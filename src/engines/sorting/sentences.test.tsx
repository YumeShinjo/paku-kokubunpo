import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { SortingQuestion } from "@/data/schema";
import { getAllQuestions } from "@/data/questionLoader";
import { SortingEngine } from "./SortingEngine";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const sortingQuestions = getAllQuestions().filter((q): q is SortingQuestion => q.engine === "sorting");
const aru = sortingQuestions.find((q) => q.id === "ichiba-pos-batch-01")!;
const plain = (text: { text: string }[]) => text.map((s) => s.text).join("").replace(/[「」]/g, "");

/**
 * 仕分け: カゴに入れたカードは、対象の語だけの小さな表示になり、文が見えなくなる。
 * そこで、入れたカードの文を、「もんだいぶんを みる」の欄に出す(①②の番号つき)。
 */
describe("仕分け: もんだいぶんを みる(カゴに入れたカードの文)", () => {
  let container: HTMLDivElement;
  let root: Root;

  const mount = (question: SortingQuestion) => act(() => root.render(<SortingEngine question={question} onAnswer={vi.fn()} />));
  const toggle = () => container.querySelector<HTMLButtonElement>(".sorting-sentences-toggle");
  const list = () => container.querySelector(".sorting-sentences-list");
  const place = (itemId: string, categoryId: string) => {
    act(() => container.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`)!.click());
    act(() => container.querySelector<HTMLElement>(`.sorting-basket[data-category-id="${categoryId}"] .sorting-basket-label`)!.click());
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("まだ1枚も入れていないときは、欄を出さない(文は、カードにそのまま出ている)", () => {
    mount(aru);
    expect(toggle()).toBeNull();
    expect(container.querySelectorAll(".sorting-items .sorting-item")).toHaveLength(aru.items.length);
  });

  it("「ある」の問題(①②): カゴに入れると、欄が開いた状態で出て、入れたカードの文だけが、①②つきで並ぶ。まだ入れていないカードの文は、欄に出ない", () => {
    mount(aru);
    const [first, second, third] = [aru.items[1], aru.items[2], aru.items[0]]; // 動詞の「ある」・連体詞の「ある」・「走る」
    place(first.id, first.correctCategoryId);
    place(second.id, second.correctCategoryId);
    expect(toggle()!.getAttribute("aria-expanded")).toBe("true");
    expect(toggle()!.textContent).toBe("もんだいぶんを とじる");
    const rows = [...list()!.querySelectorAll("li")];
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.textContent!.replace(/[①②]/g, ""))).toEqual([plain(first.text), plain(second.text)]);
    // 文の中の「ある」は、白いカードで、①か②の番号がついている(カゴの中のカードの番号と対応する)
    for (const row of rows) {
      expect(row.querySelector(".target-card")?.textContent).toMatch(/ある[①②]/);
    }
    const basketMarks = [...container.querySelectorAll(".sorting-basket-items .target-mark")].map((m) => m.textContent).sort();
    const sentenceMarks = rows.map((r) => r.querySelector(".target-mark")!.textContent).sort();
    expect(sentenceMarks).toEqual(basketMarks);
    expect(sentenceMarks.sort()).toEqual(["①", "②"]);
    // まだ入れていないカードの文は、欄には出ない(上のカードに、そのまま出ている)
    expect(list()!.textContent).not.toContain(plain(third.text));
    expect(container.querySelector(".sorting-items")!.textContent).toContain(plain(third.text));
  });

  it("ボタンで、閉じる・開くができる。閉じると、文の一覧は消える(ボタンは残る)", () => {
    mount(aru);
    place(aru.items[1].id, aru.items[1].correctCategoryId);
    act(() => toggle()!.click());
    expect(list()).toBeNull();
    expect(toggle()!.getAttribute("aria-expanded")).toBe("false");
    expect(toggle()!.textContent).toBe("もんだいぶんを みる");
    act(() => toggle()!.click());
    expect(list()).not.toBeNull();
  });

  it("同じ表記のカードがない問題は、欄は閉じた状態で出て、「もんだいぶんを みる」で開く", () => {
    const other = sortingQuestions.find((q) => q.id !== aru.id && q.items.some((i) => i.text.some((s) => /[「」]/.test(s.text)) || i.text.length > 1))!;
    mount(other);
    place(other.items[0].id, other.items[0].correctCategoryId);
    expect(toggle()!.getAttribute("aria-expanded")).toBe("false");
    expect(list()).toBeNull();
    act(() => toggle()!.click());
    expect(list()!.querySelectorAll("li")).toHaveLength(1);
  });

  it("確定したあとは、欄を出さない(結果の表示に、文が出ている)。ドラッグの対象のカード(data-item-id)は、欄の中にはない", () => {
    mount(aru);
    for (const item of aru.items) place(item.id, item.correctCategoryId);
    expect(container.querySelectorAll(".sorting-sentences-list li")).toHaveLength(aru.items.length);
    expect(container.querySelectorAll(".sorting-sentences [data-item-id]")).toHaveLength(0); // 欄の文は、ドラッグ・タップの対象ではない
    act(() => [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("こたえる"))!.click());
    expect(toggle()).toBeNull();
    expect(container.querySelector(".sorting-results")).not.toBeNull();
  });

  it("欄のボタンは、高さ44px以上(CSS)。カゴ・カードの大きさの指定は、変えていない", () => {
    const css = readFileSync("src/styles/global.css", "utf-8");
    const block = css.match(/\.sorting-sentences-toggle \{[^}]*\}/)![0];
    expect(block).toMatch(/min-height: 2\.75rem;/); // 44px
    expect(css).toMatch(/\.sorting-basket-label \{\n\s+min-height: 1\.9rem;/);
  });
});
