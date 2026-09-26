import { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChoiceQuestion } from "@/data/schema";
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

const boss = { label: "小ボス", title: "テスト", hpMax: 8, type: "subBoss" as const };

function setup(count = 2, withBoss = false) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const onComplete = vi.fn();
  const questions = Array.from({ length: count }, (_, i) => question(`q${i + 1}`));
  act(() =>
    root.render(
      <QuizPlayer areaId="prologue" questions={questions} boss={withBoss ? boss : undefined} onComplete={onComplete} />,
    ),
  );
  const click = (label: string) =>
    act(() =>
      [...container.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.trim() === label)!.click(),
    );
  return { container, onComplete, click, done: () => (act(() => root.unmount()), container.remove()) };
}

afterEach(() => vi.useRealTimers());

describe("正誤の判定ポップアップと、解説・「つぎへ」", () => {
  it("解答すると、判定だけのポップアップが出る。解説と「つぎへ」は、ポップアップとは別の枠(.explain-bar)にある", () => {
    const { container, click, done } = setup();
    expect(container.querySelector(".feedback-overlay")).toBeNull();
    click("正しい");
    const overlay = container.querySelector(".feedback-overlay")!;
    expect(overlay.querySelector('[role="dialog"]')).not.toBeNull();
    expect(overlay.textContent).not.toContain("解説です"); // 解説は、ポップアップの中には入れない(覆わない)
    expect(overlay.querySelector("button")).toBeNull(); // 「つぎへ」も、ポップアップの中にはない
    const bar = container.querySelector(".explain-bar")!;
    expect(bar.textContent).toContain("解説です");
    expect(bar.querySelector(".feedback-next")).not.toBeNull();
    done();
  });

  it("ポップアップは自動では消えず、タップすると、ポップアップだけが閉じる(次の問題へは進まない。解説は残る)", () => {
    vi.useFakeTimers();
    const { container, click, done } = setup();
    click("誤り");
    const overlay = container.querySelector<HTMLElement>(".feedback-overlay")!;
    act(() => overlay.click()); // 出た直後の誤タップでは閉じない
    expect(container.querySelector(".feedback-overlay")).not.toBeNull();
    act(() => vi.advanceTimersByTime(60_000)); // 時間がたっても消えない
    expect(container.querySelector(".feedback-overlay")).not.toBeNull();
    act(() => overlay.click());
    expect(container.querySelector(".feedback-overlay")).toBeNull();
    expect(container.querySelector(".explain-bar")!.textContent).toContain("解説です");
    expect(container.textContent).toContain("問題q1"); // まだ同じ問題
    done();
  });

  it("次の問題へ進めるのは、「つぎへ」だけ。進むと、ポップアップも解説も消える", () => {
    const { container, click, done } = setup();
    click("正しい");
    click("つぎへ");
    expect(container.textContent).toContain("問題q2");
    expect(container.querySelector(".feedback-overlay")).toBeNull();
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
