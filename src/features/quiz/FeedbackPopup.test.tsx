import { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChoiceQuestion, SortingQuestion } from "@/data/schema";
import { QuizPlayer } from "./QuizPlayer";
import { BOSS_LIVES } from "./bossRules";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = (text: string) => [{ text }];
const question = (id: string): ChoiceQuestion => ({
  id,
  unit: "u",
  engine: "choice",
  prompt: t("問題" + id),
  choices: [
    { id: "a", text: t("正しい") },
    { id: "b", text: t("誤り") },
  ],
  correctChoiceId: "a",
  explanation: t("解説です"),
});

const sortingQuestion: SortingQuestion = {
  id: "s1",
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
  explanation: t("仕分けの解説です"),
};

const boss = { label: "小ボス", title: "テスト", hpMax: 8, type: "subBoss" as const };

function mount(questions: (ChoiceQuestion | SortingQuestion)[], withBoss = false, skipIntro = true) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const onComplete = vi.fn();
  act(() =>
    root.render(
      <QuizPlayer areaId="prologue" questions={questions} boss={withBoss ? boss : undefined} onComplete={onComplete} />,
    ),
  );
  const click = (label: string) =>
    act(() =>
      [...container.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.trim() === label)!.click(),
    );
  if (skipIntro) click(withBoss ? "たたかう!" : "はじめる"); // ステージ冒頭の説明ポップアップを閉じる
  return { container, onComplete, click, done: () => (act(() => root.unmount()), container.remove()) };
}

const choices = (count: number) => Array.from({ length: count }, (_, i) => question(`q${i + 1}`));
const setup = (count = 2, withBoss = false) => mount(choices(count), withBoss);

afterEach(() => vi.useRealTimers());

describe("仕分け以外: 判定と解説を1つのポップアップに。1タップで次へ", () => {
  it("解答すると、判定と解説が1つのポップアップ(.feedback-overlay)に出る。別の解説の枠(.explain-bar)は出ない", () => {
    const { container, click, done } = setup();
    expect(container.querySelector(".feedback-overlay")).toBeNull();
    click("正しい");
    const overlay = container.querySelector(".feedback-overlay")!;
    expect(overlay.querySelector('[role="dialog"]')).not.toBeNull();
    expect(overlay.textContent).toContain("解説です");
    expect(container.querySelector(".explain-bar")).toBeNull();
    done();
  });

  it("ポップアップのタップ1回で、次の問題へ進む(自動では進まない。出た直後の誤タップでは進まない)", () => {
    vi.useFakeTimers();
    const { container, click, done } = setup();
    click("誤り");
    const overlay = container.querySelector<HTMLElement>(".feedback-overlay")!;
    act(() => overlay.click()); // 出た直後
    expect(container.textContent).toContain("問題q1");
    act(() => vi.advanceTimersByTime(60_000)); // 時間がたっても進まない
    expect(container.querySelector(".feedback-overlay")).not.toBeNull();
    act(() => overlay.click());
    expect(container.querySelector(".feedback-overlay")).toBeNull();
    expect(container.textContent).toContain("問題q2");
    done();
  });

  it("「つぎへ」のボタンでも、次へ進める", () => {
    const { container, click, done } = setup();
    click("正しい");
    click("つぎへ");
    expect(container.textContent).toContain("問題q2");
    expect(container.querySelector(".feedback-overlay")).toBeNull();
    done();
  });
});

describe("仕分けだけ: 2段階(判定のポップアップ → 閉じると解説 → 「つぎへ」)", () => {
  function answerSorting(click: (l: string) => void) {
    for (const [item, category] of [
      ["走る", "動詞"],
      ["山", "名詞"],
    ]) {
      click(item);
      click(category);
    }
    click("こたえる");
  }

  it("判定だけのポップアップが出る(解説・「つぎへ」は入らない)。解説と「つぎへ」は別の枠にある", () => {
    const { container, click, done } = mount([sortingQuestion, question("q2")]);
    answerSorting(click);
    const overlay = container.querySelector(".feedback-overlay")!;
    expect(overlay.textContent).not.toContain("仕分けの解説です");
    expect(overlay.querySelector("button")).toBeNull();
    const bar = container.querySelector(".explain-bar")!;
    expect(bar.textContent).toContain("仕分けの解説です");
    expect(bar.querySelector(".feedback-next")).not.toBeNull();
    done();
  });

  it("ポップアップは自動では消えず、タップすると、ポップアップだけが閉じる(次の問題へは進まない)。進めるのは「つぎへ」だけ", () => {
    vi.useFakeTimers();
    const { container, click, done } = mount([sortingQuestion, question("q2")]);
    answerSorting(click);
    const overlay = container.querySelector<HTMLElement>(".feedback-overlay")!;
    act(() => overlay.click()); // 出た直後の誤タップでは閉じない
    expect(container.querySelector(".feedback-overlay")).not.toBeNull();
    act(() => vi.advanceTimersByTime(60_000));
    expect(container.querySelector(".feedback-overlay")).not.toBeNull();
    act(() => overlay.click());
    expect(container.querySelector(".feedback-overlay")).toBeNull();
    expect(container.querySelector(".explain-bar")!.textContent).toContain("仕分けの解説です");
    expect(container.textContent).not.toContain("問題q2"); // まだ同じ問題
    click("つぎへ");
    expect(container.textContent).toContain("問題q2");
    expect(container.querySelector(".explain-bar")).toBeNull();
    done();
  });

  it("CSS: ポップアップは画面全体を覆う固定配置。解説の枠は画面の下に固定(スクロール不要)", () => {
    const css = readFileSync("src/styles/global.css", "utf-8");
    const overlay = css.match(/\n\.feedback-overlay \{([^}]*)\}/)![1];
    expect(overlay).toContain("position: fixed;");
    expect(overlay).toContain("inset: 0;");
    const bar = css.match(/\n\.explain-bar \{([^}]*)\}/)![1];
    expect(bar).toContain("position: fixed;");
    expect(bar).toContain("bottom: 0;");
  });
});

describe("ステージ冒頭の説明ポップアップ", () => {
  it("ステージを始めたときに1度だけ出て、閉じると、その後は出ない(問題ごとには出さない。常時表示の説明ブロックもない)", () => {
    const { container, click, done } = mount(choices(2), false, false);
    const intro = container.querySelector(".stage-intro")!;
    expect(intro.textContent).toContain("ことだま使いの心得");
    expect(container.querySelector(".engine-flavor")).toBeNull();
    click("はじめる");
    expect(container.querySelector(".stage-intro")).toBeNull();
    click("正しい");
    click("つぎへ");
    expect(container.querySelector(".stage-intro")).toBeNull();
    done();
  });

  it("途中からの再開では出さない", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <QuizPlayer
          areaId="prologue"
          questions={choices(2)}
          resume={{ index: 1, correctCount: 1, combo: 1, maxCombo: 1, hp: 0 }}
          onComplete={vi.fn()}
        />,
      ),
    );
    expect(container.querySelector(".stage-intro")).toBeNull();
    act(() => root.unmount());
    container.remove();
  });
});

describe("ステージ背景: ボス戦は大きく、通常ステージは小さな装飾バー", () => {
  it("ボス戦の背景の枠(.stage-visual-tall)に大きく出し、通常ステージは小さな枠(tall なし)", () => {
    const normal = setup(2, false);
    expect(normal.container.querySelector(".stage-visual")).not.toBeNull();
    expect(normal.container.querySelector(".stage-visual-tall")).toBeNull();
    normal.done();
    const bossStage = setup(3, true);
    expect(bossStage.container.querySelector(".stage-visual-tall")).not.toBeNull();
    bossStage.done();
  });

  it("CSS: 通常ステージの枠は小さく(装飾バー)、ボス戦は大きい", () => {
    const css = readFileSync("src/styles/global.css", "utf-8");
    const vars = css.match(/\n\.screen-stage \{([^}]*)\}/)![1];
    const rem = (name: string) => Number(vars.match(new RegExp(`--${name}: (?:clamp\\()?([0-9.]+)rem`))![1]);
    expect(rem("stage-visual-height")).toBeLessThanOrEqual(5);
    expect(rem("stage-visual-height")).toBeGreaterThanOrEqual(4);
    expect(rem("stage-visual-tall-height")).toBeGreaterThanOrEqual(8);
  });

  it("CSS: ヘッダーのボタンは折り返さない(「やめる」が2行にならない)", () => {
    const css = readFileSync("src/styles/global.css", "utf-8");
    expect(css).toMatch(/\.stage-header button \{\s*white-space: nowrap;/);
  });
});

describe("ボス戦のライフ(5)", () => {
  it("ライフは5。誤答で1つずつ減り、正解では減らない", () => {
    expect(BOSS_LIVES).toBe(5);
    const { container, click, done } = setup(10, true);
    const lives = () => container.querySelector(".player-lives")!.getAttribute("aria-label");
    expect(lives()).toBe("ライフ 5 / 5");
    click("誤り");
    expect(lives()).toBe("ライフ 4 / 5");
    click("つぎへ");
    click("正しい");
    expect(lives()).toBe("ライフ 4 / 5");
    done();
  });

  it("ライフが0になると、「つぎへ」で、ライフ切れとして終わる(最初からのやり直しは呼び出し側)", () => {
    const { onComplete, click, done } = setup(10, true);
    for (let i = 0; i < BOSS_LIVES; i++) {
      click("誤り");
      expect(onComplete).not.toHaveBeenCalled();
      click("つぎへ");
    }
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toMatchObject({ lifeOut: true, bossDefeated: false });
    done();
  });

  it("通常ステージにはライフの表示はなく、何度間違えても終わらない", () => {
    const { container, onComplete, click, done } = setup(10, false);
    expect(container.querySelector(".player-lives")).toBeNull();
    for (let i = 0; i < 6; i++) {
      click("誤り");
      click("つぎへ");
    }
    expect(onComplete).not.toHaveBeenCalled();
    done();
  });
});

describe("バトル中のことばのずかん", () => {
  it("「📖 ずかん」から、すべてのページ(未クリアのエリアも)を開け、閉じると問題に戻る", () => {
    const { container, click, done } = setup();
    expect(container.querySelector(".zukan-modal")).toBeNull();
    click("📖 ずかん");
    const modal = container.querySelector(".zukan-modal")!;
    expect(modal.querySelectorAll("details.zukan-page").length).toBeGreaterThan(1);
    expect(modal.textContent).not.toContain("🔒");
    click("✕ とじる");
    expect(container.querySelector(".zukan-modal")).toBeNull();
    expect(container.textContent).toContain("問題q1");
    done();
  });

  it("解答したあと(解説を読んでいるとき)も開ける", () => {
    const { container, click, done } = setup();
    click("正しい");
    click("📖 ずかん");
    expect(container.querySelector(".zukan-modal")).not.toBeNull();
    done();
  });
});
