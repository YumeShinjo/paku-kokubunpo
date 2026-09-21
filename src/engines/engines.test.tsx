import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AssemblyQuestion, ChoiceQuestion, Question, SortingQuestion } from "@/data/schema";
import type { Answer } from "@/engines/core/judge";
import { ChoiceEngine } from "@/engines/choice/ChoiceEngine";
import { AssemblyEngine } from "@/engines/assembly/AssemblyEngine";
import { SortingEngine } from "@/engines/sorting/SortingEngine";

/**
 * 1問につき判定は1回だけ(重大な不具合の再発防止)。
 * 正誤判定のあとに選択肢を選び直したり「こたえる」を押し直したりしても、解答は1回しか通知されない。
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = (text: string) => [{ text }];

const choiceQuestion: ChoiceQuestion = {
  id: "t-choice",
  unit: "u",
  engine: "choice",
  prompt: t("問題"),
  choices: [
    { id: "a", text: t("正しい") },
    { id: "b", text: t("誤り1") },
    { id: "c", text: t("誤り2") },
  ],
  correctChoiceId: "a",
};

const tapQuestion: ChoiceQuestion = {
  id: "t-tap",
  unit: "u",
  engine: "choice",
  display: "tapInSentence",
  prompt: t("問題"),
  choices: [
    { id: "s0", text: t("弟が"), given: true },
    { id: "s1", text: t("公園で") },
    { id: "s2", text: t("遊ぶ。") },
  ],
  correctChoiceId: "s2",
};

const assemblyQuestion: AssemblyQuestion = {
  id: "t-assembly",
  unit: "u",
  engine: "assembly",
  mode: "fillBlank",
  instruction: t("穴埋め"),
  sentenceTemplate: [{ text: "書" }, { text: "___" }, { text: "た" }],
  cards: [
    { id: "x", text: t("い") },
    { id: "y", text: t("き") },
  ],
  correctOrder: ["x"],
};

const sortingQuestion: SortingQuestion = {
  id: "t-sorting",
  unit: "u",
  engine: "sorting",
  instruction: t("仕分け"),
  categories: [
    { id: "c1", label: t("動詞") },
    { id: "c2", label: t("名詞") },
  ],
  items: [
    { id: "i1", text: t("走る"), correctCategoryId: "c1", explanation: t("解説") },
    { id: "i2", text: t("山"), correctCategoryId: "c2", explanation: t("解説") },
  ],
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(element: React.ReactElement) {
  act(() => root.render(element));
}

const buttons = () => [...container.querySelectorAll("button")];
const clickButton = (el: Element) => act(() => (el as HTMLButtonElement).click());
const byText = (text: string) => buttons().find((b) => b.textContent?.includes(text))!;

describe("選択式(通常): 1問につき判定は1回だけ", () => {
  it("選んだあと、同じ選択肢・別の選択肢を押しても、解答は1回しか通知されない", () => {
    const onAnswer = vi.fn<(a: Answer) => void>();
    render(<ChoiceEngine question={choiceQuestion} onAnswer={onAnswer} />);
    clickButton(byText("誤り1"));
    clickButton(byText("誤り1"));
    clickButton(byText("正しい"));
    clickButton(byText("誤り2"));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith({ engine: "choice", choiceId: "b" });
  });

  it("再描画を待たずに続けて押されても(同じ瞬間の連打)、最初に押した選択肢だけが解答になる", () => {
    const onAnswer = vi.fn<(a: Answer) => void>();
    render(<ChoiceEngine question={choiceQuestion} onAnswer={onAnswer} />);
    const [first, second, third] = buttons();
    act(() => {
      first.click();
      second.click();
      third.click();
    });
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith({ engine: "choice", choiceId: "a" });
    expect(byText("正しい").className).toContain("correct");
    expect(byText("誤り2").className).not.toMatch(/correct|incorrect/);
  });

  it("解答後は、すべての選択肢が押せない(disabled)。選んだものと正解が色で示される", () => {
    render(<ChoiceEngine question={choiceQuestion} onAnswer={() => {}} />);
    expect(buttons().every((b) => !b.disabled)).toBe(true);
    clickButton(byText("誤り1"));
    expect(buttons().every((b) => b.disabled)).toBe(true);
    expect(byText("誤り1").className).toContain("incorrect");
    expect(byText("正しい").className).toContain("correct");
    expect(byText("誤り2").className).not.toMatch(/correct|incorrect/);
  });

  it("正解を選んだときは、選んだ選択肢だけが正解の色になる", () => {
    render(<ChoiceEngine question={choiceQuestion} onAnswer={() => {}} />);
    clickButton(byText("正しい"));
    expect(byText("正しい").className).toContain("correct");
    expect(byText("誤り1").className).not.toMatch(/correct|incorrect/);
  });
});

describe("選択式(文中タップ): 1問につき判定は1回だけ", () => {
  it("タップしたあと、別の文節をタップしても、解答は1回しか通知されない。文節は押せなくなる", () => {
    const onAnswer = vi.fn<(a: Answer) => void>();
    render(<ChoiceEngine question={tapQuestion} onAnswer={onAnswer} />);
    clickButton(byText("公園で"));
    clickButton(byText("遊ぶ。"));
    clickButton(byText("公園で"));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith({ engine: "choice", choiceId: "s1" });
    expect(buttons().every((b) => b.disabled)).toBe(true);
  });
});

describe("穴埋め(組み立て): 1問につき判定は1回だけ", () => {
  it("「こたえる」を押したあと、カードを選び直して「こたえる」を押し直しても、解答は1回しか通知されない", () => {
    const onAnswer = vi.fn<(a: Answer) => void>();
    render(<AssemblyEngine question={assemblyQuestion} onAnswer={onAnswer} />);
    clickButton(byText("い"));
    clickButton(byText("こたえる"));
    clickButton(byText("き"));
    clickButton(byText("こたえる"));
    clickButton(byText("こたえる"));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith({ engine: "assembly", order: ["x"] });
  });

  it("「こたえる」を同じ瞬間に連打しても、解答は1回だけ", () => {
    const onAnswer = vi.fn();
    render(<AssemblyEngine question={assemblyQuestion} onAnswer={onAnswer} />);
    clickButton(byText("い"));
    const submit = byText("こたえる");
    act(() => {
      submit.click();
      submit.click();
      submit.click();
    });
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it("解答後は、カードも「こたえる」も押せない(disabled)", () => {
    render(<AssemblyEngine question={assemblyQuestion} onAnswer={() => {}} />);
    clickButton(byText("い"));
    clickButton(byText("こたえる"));
    expect(buttons().every((b) => b.disabled)).toBe(true);
  });

  it("カードを選ぶ前は「こたえる」が押せない", () => {
    const onAnswer = vi.fn();
    render(<AssemblyEngine question={assemblyQuestion} onAnswer={onAnswer} />);
    expect(byText("こたえる").disabled).toBe(true);
    clickButton(byText("こたえる"));
    expect(onAnswer).not.toHaveBeenCalled();
  });
});

describe("仕分け: 1問につき判定は1回だけ", () => {
  function placeAll() {
    for (const [item, category] of [
      ["走る", "動詞"],
      ["山", "名詞"],
    ]) {
      clickButton(byText(item));
      clickButton(byText(category));
    }
  }

  it("「こたえる」で確定したあと、項目やカゴを押しても、解答は1回しか通知されない", () => {
    const onAnswer = vi.fn<(a: Answer) => void>();
    render(<SortingEngine question={sortingQuestion} onAnswer={onAnswer} />);
    placeAll();
    clickButton(byText("こたえる"));
    // 解答後は「こたえる」自体が消え、項目・カゴは押せない
    expect(buttons().some((b) => b.textContent?.includes("こたえる"))).toBe(false);
    for (const b of buttons()) expect(b.disabled).toBe(true);
    clickButton(byText("動詞"));
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it("全部の項目を入れる前は「こたえる」が押せない", () => {
    const onAnswer = vi.fn();
    render(<SortingEngine question={sortingQuestion} onAnswer={onAnswer} />);
    clickButton(byText("走る"));
    clickButton(byText("動詞"));
    expect(byText("こたえる").disabled).toBe(true);
    expect(onAnswer).not.toHaveBeenCalled();
  });
});

describe("QuizPlayer: 続けて届いた同じ問題の解答は、ボスのHPを二重に減らさない", () => {
  let capturedAnswer: ((a: Answer) => void) | null = null;

  beforeEach(() => {
    capturedAnswer = null;
    vi.resetModules();
    vi.doMock("@/engines/EngineRouter", () => ({
      EngineRouter: ({ question, onAnswer }: { question: Question; onAnswer: (a: Answer) => void }) => {
        capturedAnswer = onAnswer;
        return <div data-testid="engine">{question.id}</div>;
      },
    }));
  });

  afterEach(() => {
    vi.doUnmock("@/engines/EngineRouter");
  });

  it("同じ問題に正解を2回通知しても、HPは1しか減らず、正解数も1", async () => {
    const { QuizPlayer } = await import("@/features/quiz/QuizPlayer");
    const onComplete = vi.fn();
    render(
      <QuizPlayer
        areaId="prologue"
        questions={[choiceQuestion, { ...choiceQuestion, id: "t-choice-2" }]}
        boss={{ label: "小ボス", title: "テスト", hpMax: 5, type: "subBoss" }}
        onComplete={onComplete}
      />,
    );
    expect(container.querySelector(".hp-text")?.textContent).toContain("5 / 5");
    const correct: Answer = { engine: "choice", choiceId: "a" };
    act(() => {
      capturedAnswer?.(correct);
      capturedAnswer?.(correct);
      capturedAnswer?.(correct);
    });
    expect(container.querySelector(".hp-text")?.textContent).toContain("4 / 5");
  });
});
