import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAllQuestions } from "@/data/questionLoader";
import { PAKU_NOTE } from "@/data/engineGuide";
import { rb } from "@/data/ruby";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { QuizPlayer } from "./QuizPlayer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const plain = (text: string) => rb(text).map((s) => s.text).join("");
const choiceQuestion = getAllQuestions().find((q) => q.engine === "choice" && q.display !== "tapInSentence")!;

describe("最初の正解のポップアップの「パクっと」の説明(初回だけ・タップで閉じる)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useTutorialStore.setState({ seenGuides: ["choice", "sorting", "assembly", "tapInSentence", "zukan"] }); // 出題形式の操作ガイドは、見たあと
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const play = () => {
    act(() =>
      root.render(<QuizPlayer areaId="kotobaNoIchiba" questions={[choiceQuestion, choiceQuestion, choiceQuestion]} onComplete={() => {}} />),
    );
  };
  const answer = (correct: boolean) => {
    if (choiceQuestion.engine !== "choice") throw new Error();
    const index = choiceQuestion.choices.findIndex((c) => (c.id === choiceQuestion.correctChoiceId) === correct);
    act(() => (container.querySelectorAll<HTMLButtonElement>(".engine-choice-list button")[index]).click());
  };
  const note = () => container.querySelector(".feedback-paku");

  it("説明の文は「コトは、正しいことばを パクっと 食べて 元気になるよ」", () => {
    expect(plain(PAKU_NOTE)).toBe("コトは、正しいことばを パクっと 食べて 元気になるよ");
  });

  it("最初の正解のポップアップに出て、閉じる(つぎへ)と、見た印が付き、次の正解では出ない", () => {
    play();
    answer(true);
    expect(note()?.textContent).toContain("パクっと");
    expect(useTutorialStore.getState().seenGuides).not.toContain("paku");
    act(() => (container.querySelector(".feedback-next") as HTMLButtonElement).click());
    expect(useTutorialStore.getState().seenGuides).toContain("paku");
    answer(true);
    expect(note()).toBeNull();
  });

  it("不正解のポップアップには出ない(印も付かない)", () => {
    play();
    answer(false);
    expect(note()).toBeNull();
    act(() => (container.querySelector(".feedback-next") as HTMLButtonElement).click());
    expect(useTutorialStore.getState().seenGuides).not.toContain("paku");
  });

  it("設定の「そうさの せつめい」(ガイドのリセット)で、もう一度出る", () => {
    useTutorialStore.setState({ seenGuides: ["choice", "paku"] });
    play();
    answer(true);
    expect(note()).toBeNull();
    act(() => useTutorialStore.getState().resetGuides());
    expect(useTutorialStore.getState().seenGuides).toEqual([]);
  });
});
