import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { SortingQuestion } from "@/data/schema";
import { getAllQuestions } from "@/data/questionLoader";
import { duplicateTargetMarks } from "@/data/targetText";
import { SortingEngine } from "./SortingEngine";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const sortingQuestions = getAllQuestions().filter((q): q is SortingQuestion => q.engine === "sorting");
const plain = (q: SortingQuestion) => q.items.map((i) => i.text.map((s) => s.text).join(""));
/** 本物の問題: 「ある」(連体詞)と「ある」(動詞)が、同じ表記で2枚ある */
const aru = sortingQuestions.find((q) => q.id === "ichiba-pos-batch-01")!;

describe("同じ表記のカードに付ける番号(①②)", () => {
  it("同じ表記の語がある問題は、全問題の中で、「ある」の問題だけ(洗い出し結果)", () => {
    const withDuplicates = sortingQuestions.filter((q) => duplicateTargetMarks(q.items).size > 0).map((q) => q.id);
    expect(withDuplicates).toEqual(["ichiba-pos-batch-01"]);
    // 仕分け以外(組み立て・選択式)には、同じ表記のカード・選択肢がない
    for (const q of getAllQuestions()) {
      if (q.engine === "assembly") expect(new Set(q.cards.map((c) => c.text.map((s) => s.text).join(""))).size, q.id).toBe(q.cards.length);
      if (q.engine === "choice") expect(new Set(q.choices.map((c) => c.text.map((s) => s.text).join(""))).size, q.id).toBe(q.choices.length);
    }
  });

  it("「ある」の2枚だけに、①②が付き、ほかのカードには付かない。番号は答えのヒント(品詞名など)を含まない", () => {
    const marks = duplicateTargetMarks(aru.items);
    expect([...marks.values()].sort()).toEqual(["①", "②"]);
    const aruItems = aru.items.filter((i) => marks.has(i.id));
    expect(aruItems).toHaveLength(2);
    expect(new Set(aruItems.map((i) => i.correctCategoryId)).size).toBe(2); // 2枚は、別の品詞(見分けないと、正解できない)
    for (const mark of marks.values()) expect(mark).toMatch(/^[①-⑩]$/);
  });

  it("同じ表記が1つだけの語・番号が要らない問題には、番号を付けない", () => {
    const t = (text: string) => [{ text }];
    expect(duplicateTargetMarks([{ id: "a", text: t("走る") }, { id: "b", text: t("山") }]).size).toBe(0);
    // 「」でくくった対象の語で比べる(文が違っても、対象が同じ表記なら番号を付ける)
    const marks = duplicateTargetMarks([
      { id: "a", text: t("あの人は「ある」日来た。") },
      { id: "b", text: t("本が「ある」。") },
      { id: "c", text: t("「山」が高い。") },
    ]);
    expect(marks.get("a")).toBe("①");
    expect(marks.get("b")).toBe("②");
    expect(marks.has("c")).toBe(false);
  });

  describe("画面: 文の中・カゴの中・ドラッグ中・結果に、同じ番号が残る", () => {
    let container: HTMLDivElement;
    let root: Root;
    const aruSentences = () => plain(aru).filter((s) => s.includes("ある"));

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);
      act(() => root.render(<SortingEngine question={aru} onAnswer={() => {}} />));
    });

    afterEach(() => {
      act(() => root.unmount());
      container.remove();
    });

    const markOf = (el: Element) => el.querySelector(".target-mark")?.textContent ?? null;
    const aruChips = () => [...container.querySelectorAll<HTMLElement>("[data-item-id]")].filter((b) => b.querySelector(".target-card")?.textContent?.includes("ある"));

    it("まだ入れていないカード(文の中の対象の語)に、①②が付いている", () => {
      const chips = aruChips();
      expect(chips).toHaveLength(2);
      expect(chips.map(markOf).sort()).toEqual(["①", "②"]);
      expect(aruSentences().length).toBeGreaterThanOrEqual(2);
      // ほかのカードには、番号がない
      const others = [...container.querySelectorAll<HTMLElement>("[data-item-id]")].filter((b) => !chips.includes(b));
      for (const other of others) expect(markOf(other)).toBeNull();
    });

    it("カゴに入れたあとも、同じ番号が残る(どちらのカードか、見分けられる)", () => {
      const before = new Map(aruChips().map((c) => [c.dataset.itemId!, markOf(c)]));
      for (const chip of aruChips()) {
        act(() => chip.click()); // タップで選ぶ
        const label = container.querySelector<HTMLButtonElement>(".sorting-basket-label")!;
        act(() => label.click());
      }
      const placed = [...container.querySelectorAll<HTMLElement>(".sorting-basket-items [data-item-id]")].filter((b) => b.textContent?.includes("ある"));
      expect(placed).toHaveLength(2);
      for (const chip of placed) {
        expect(markOf(chip)).toBe(before.get(chip.dataset.itemId!));
        expect(chip.textContent).toMatch(/ある[①②]/);
      }
      expect(new Set(placed.map(markOf)).size).toBe(2);
    });

    it("全部入れて答えると、結果の一覧にも、同じ番号が付く", () => {
      const labels = [...container.querySelectorAll<HTMLButtonElement>(".sorting-basket-label")];
      for (const item of aru.items) {
        const chip = container.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`)!;
        act(() => chip.click());
        const index = aru.categories.findIndex((c) => c.id === item.correctCategoryId);
        act(() => labels[index].click());
      }
      act(() => (container.querySelector(".answer-submit") as HTMLButtonElement).click());
      const results = [...container.querySelectorAll(".sorting-result-item")].filter((p) => p.querySelector(".target-card")?.textContent?.includes("ある"));
      expect(results).toHaveLength(2);
      expect(results.map(markOf).sort()).toEqual(["①", "②"]);
    });
  });
});
