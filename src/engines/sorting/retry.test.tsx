import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SortingQuestion } from "@/data/schema";
import { judgeAnswer, judgeSortingItems, type Answer } from "@/engines/core/judge";
import { SortingEngine } from "./SortingEngine";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = (text: string) => [{ text }];
const question: SortingQuestion = {
  id: "t-retry",
  unit: "u",
  engine: "sorting",
  instruction: t("仕分け"),
  categories: [
    { id: "c1", label: t("動詞") },
    { id: "c2", label: t("名詞") },
    { id: "c3", label: t("形容詞") },
  ],
  items: [
    { id: "i1", text: t("走る"), correctCategoryId: "c1", explanation: t("解説1") },
    { id: "i2", text: t("山"), correctCategoryId: "c2", explanation: t("解説2") },
    { id: "i3", text: t("高い"), correctCategoryId: "c3", explanation: t("解説3") },
  ],
};

describe("仕分け: 1回だけやり直せる(1回目に外したカードだけ戻し、合っているカードは固定)", () => {
  let container: HTMLDivElement;
  let root: Root;
  let onAnswer: ReturnType<typeof vi.fn<(a: Answer) => void>>;

  const buttons = () => [...container.querySelectorAll("button")];
  const chip = (text: string) => buttons().find((b) => b.classList.contains("sorting-item") && b.textContent?.includes(text))!;
  const label = (text: string) => buttons().find((b) => b.classList.contains("sorting-basket-label") && b.textContent === text)!;
  const submit = () => buttons().find((b) => b.textContent?.includes("こたえる"))!;
  const place = (item: string, category: string) => {
    act(() => chip(item).click());
    act(() => label(category).click());
  };
  const basketTexts = (id: string) =>
    [...container.querySelectorAll(`[data-category-id="${id}"] .sorting-basket-items button`)].map((b) => b.textContent);
  const pool = () => [...container.querySelectorAll(".sorting-items .sorting-item")].map((b) => b.textContent);
  const note = () => container.querySelector(".sorting-retry-note")?.textContent ?? null;

  beforeEach(() => {
    onAnswer = vi.fn();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<SortingEngine question={question} onAnswer={onAnswer} />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("1回目が全問正解なら、そのまま確定して、解答を1回だけ通知する(やり直しは出ない)", () => {
    place("走る", "動詞");
    place("山", "名詞");
    place("高い", "形容詞");
    act(() => submit().click());
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(judgeAnswer(question, onAnswer.mock.calls[0][0])).toBe(true);
    expect((onAnswer.mock.calls[0][0] as { recoveredOnRetry?: boolean }).recoveredOnRetry).toBeUndefined(); // やり直していない
    expect(note()).toBeNull();
    expect(container.querySelector(".sorting-results")).not.toBeNull();
  });

  it("1回目に1枚外すと、外したカードだけが戻り、合っているカードは固定される。「あと1枚 ちがうよ」。解答は、まだ通知しない", () => {
    place("走る", "動詞");
    place("山", "形容詞"); // 外す
    place("高い", "形容詞");
    act(() => submit().click());
    expect(onAnswer).not.toHaveBeenCalled();
    expect(note()).toContain("あと1枚 ちがうよ");
    // 答え・品詞名は出さない
    for (const word of ["名詞", "正解", "山は", "解説"]) expect(note(), word).not.toContain(word);
    expect(pool()).toEqual(["山"]); // 外したカードだけが戻っている
    expect(basketTexts("c1")).toContain("走る");
    expect(basketTexts("c3")).toContain("高い");
    expect(basketTexts("c3")).not.toContain("山");
    // 合っているカードは固定(押せない)。外したカードは動かせる
    expect(chip("走る").disabled).toBe(true);
    expect(chip("走る").classList.contains("is-locked")).toBe(true);
    expect(chip("高い").disabled).toBe(true);
    expect(chip("山").disabled).toBe(false);
    expect(container.querySelector(".sorting-results")).toBeNull();
    // まだ全部入れていないので、「こたえる」は押せない
    expect(submit().disabled).toBe(true);
  });

  it("2回目も外したら、結果の表示(◎×と解説)に進む。解答は、1回目の入れ方で、1回だけ通知する(1回目は不正解)", () => {
    place("走る", "動詞");
    place("山", "形容詞");
    place("高い", "形容詞");
    act(() => submit().click());
    place("山", "動詞"); // 2回目も外す
    act(() => submit().click());
    expect(onAnswer).toHaveBeenCalledTimes(1);
    const answer = onAnswer.mock.calls[0][0] as Extract<Answer, { engine: "sorting" }>;
    expect(answer.placements).toEqual({ i1: "c1", i2: "c3", i3: "c3" }); // 1回目の入れ方
    expect(judgeAnswer(question, answer)).toBe(false);
    expect(answer.recoveredOnRetry).toBeUndefined(); // 2回目も外した: 「2かいめで せいかい」の表示にはしない
    const results = container.querySelector(".sorting-results")!;
    expect(results.textContent).toContain("解説2");
    expect(results.querySelectorAll("li.incorrect")).toHaveLength(1);
    expect(results.querySelectorAll("li.correct")).toHaveLength(2);
    expect(note()).toBeNull();
    // 確定後は、何を押しても、解答は増えない
    for (const b of buttons()) expect(b.disabled).toBe(true);
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it("2回目に直しても、解答は1回目の結果(不正解)。結果の表示は、直した入れ方(全部◎)", () => {
    place("走る", "動詞");
    place("山", "形容詞");
    place("高い", "形容詞");
    act(() => submit().click());
    place("山", "名詞"); // 2回目で直す
    act(() => submit().click());
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(judgeAnswer(question, onAnswer.mock.calls[0][0])).toBe(false); // 星・ライフは、1回目で決まる
    // 2回目で全部合った、という印(recoveredOnRetry)が付く。判定・集計は変わらない(placements は1回目の入れ方のまま)
    const answer = onAnswer.mock.calls[0][0] as Extract<Answer, { engine: "sorting" }>;
    expect(answer.recoveredOnRetry).toBe(true);
    expect(answer.placements).toEqual({ i1: "c1", i2: "c3", i3: "c3" });
    expect(container.querySelectorAll(".sorting-results li.correct")).toHaveLength(3);
  });

  it("2枚以上外したら、「あと2枚」。外した2枚が戻り、合っている1枚だけが固定される", () => {
    place("走る", "動詞");
    place("山", "動詞");
    place("高い", "名詞");
    act(() => submit().click());
    expect(note()).toContain("あと2枚 ちがうよ");
    expect(pool().sort()).toEqual(["山", "高い"].sort());
    expect(chip("走る").disabled).toBe(true);
  });

  it("judgeSortingItems: 項目ごとの正誤を返す。まだ入れていない項目は誤り", () => {
    expect(judgeSortingItems(question, { i1: "c1", i2: "c3" })).toEqual({ i1: true, i2: false, i3: false });
  });
});
