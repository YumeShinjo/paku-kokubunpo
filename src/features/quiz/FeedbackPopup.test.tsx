import { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { ChoiceQuestion } from "@/data/schema";
import { QuizPlayer } from "./QuizPlayer";

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

describe("正誤の判定ポップアップ", () => {
  function setup() {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onComplete = vi.fn();
    act(() => root.render(<QuizPlayer areaId="prologue" questions={[question("q1"), question("q2")]} onComplete={onComplete} />));
    const choose = (label: string) =>
      act(() => [...container.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent === label)!.click());
    return { container, onComplete, choose, done: () => (act(() => root.unmount()), container.remove()) };
  }

  it("解答すると、画面に重なるポップアップ(.feedback-overlay)で判定と解説が出る。「つぎへ」で次の問題へ", () => {
    const { container, choose, done } = setup();
    expect(container.querySelector(".feedback-overlay")).toBeNull();
    choose("正しい");
    const overlay = container.querySelector(".feedback-overlay")!;
    expect(overlay.querySelector('[role="dialog"]')).not.toBeNull();
    expect(overlay.textContent).toContain("解説です");
    act(() => overlay.querySelector<HTMLButtonElement>(".feedback-next")!.click());
    expect(container.querySelector(".feedback-overlay")).toBeNull();
    expect(container.textContent).toContain("問題q2");
    done();
  });

  it("暗い部分のタップでも次へ進む。ただし、出た直後(誤タップ)は進まず、ポップアップの中のタップでは進まない", () => {
    vi.useFakeTimers();
    const { container, choose, done } = setup();
    choose("誤り");
    const overlay = container.querySelector<HTMLElement>(".feedback-overlay")!;
    act(() => overlay.click()); // 出た直後
    expect(container.querySelector(".feedback-overlay")).not.toBeNull();
    vi.advanceTimersByTime(500);
    act(() => overlay.querySelector<HTMLElement>(".feedback")!.click()); // カードの中
    expect(container.querySelector(".feedback-overlay")).not.toBeNull();
    act(() => overlay.click());
    expect(container.querySelector(".feedback-overlay")).toBeNull();
    done();
    vi.useRealTimers();
  });

  it("CSS: 画面全体を覆う固定配置で、ページをスクロールさせない", () => {
    const css = readFileSync("src/styles/global.css", "utf-8");
    const body = css.match(/\n\.feedback-overlay \{([^}]*)\}/)![1];
    expect(body).toContain("position: fixed;");
    expect(body).toContain("inset: 0;");
  });
});
