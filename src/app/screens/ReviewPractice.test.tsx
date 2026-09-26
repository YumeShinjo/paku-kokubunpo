import { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { getAllQuestions } from "@/data/questionLoader";
import { buildReviewSession, REVIEW_PRACTICE_SIZE } from "@/features/quiz/buildSession";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { HungryBadge } from "@/components/HungryBadge";
import { ReviewPracticeScreen } from "./ReviewPracticeScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync("src/styles/global.css", "utf-8");

function mount(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return { container, done: () => (act(() => root.unmount()), container.remove()) };
}

describe("苦手問題の練習", () => {
  beforeEach(() => {
    useReviewStore.setState({ starredQuestionIds: [] });
    useNavigationStore.setState({ screen: { name: "title" } });
  });

  it("「コトがお腹をすかせているよ!」は、タップできるボタン。押すと苦手問題の練習へ進む。星がなければ出ない", () => {
    const empty = mount(<HungryBadge />);
    expect(empty.container.querySelector(".hungry-badge")).toBeNull();
    empty.done();

    useReviewStore.setState({ starredQuestionIds: [getAllQuestions()[0].id] });
    const { container, done } = mount(<HungryBadge />);
    const badge = container.querySelector<HTMLButtonElement>("button.hungry-badge")!;
    expect(badge.textContent).toContain("苦手");
    act(() => badge.click());
    expect(useNavigationStore.getState().screen.name).toBe("reviewPractice");
    done();
  });

  it("星のついた問題だけが出題される(最大10問。星が少なければ全部)", () => {
    const all = getAllQuestions();
    useReviewStore.setState({ starredQuestionIds: all.slice(0, 3).map((q) => q.id) });
    expect(buildReviewSession().map((q) => q.id).sort()).toEqual(all.slice(0, 3).map((q) => q.id).sort());

    useReviewStore.setState({ starredQuestionIds: all.slice(0, 25).map((q) => q.id) });
    const session = buildReviewSession();
    expect(session).toHaveLength(REVIEW_PRACTICE_SIZE);
    const starred = new Set(all.slice(0, 25).map((q) => q.id));
    for (const q of session) expect(starred.has(q.id)).toBe(true);
    expect(new Set(session.map((q) => q.id)).size).toBe(session.length); // 重複なし
  });

  it("苦手問題の練習の画面は、星の問題を出題する。ライフのある「ボス戦」ではない", () => {
    const first = getAllQuestions()[0];
    useReviewStore.setState({ starredQuestionIds: [first.id] });
    const { container, done } = mount(<ReviewPracticeScreen />);
    expect(container.textContent).toContain("にがて もんだい れんしゅう");
    expect(container.querySelector(".player-lives")).toBeNull();
    done();
  });

  it("星が1つもないときは、その旨を出して、ホームへ戻れる", () => {
    const { container, done } = mount(<ReviewPracticeScreen />);
    expect(container.textContent).toContain("にがて もんだいは ないよ");
    act(() => [...container.querySelectorAll("button")].find((b) => b.textContent === "ホームへ")!.click());
    expect(useNavigationStore.getState().screen.name).toBe("title");
    done();
  });
});

describe("出題画面上部のレイアウト(CSS)", () => {
  const rule = (selector: string) => {
    const start = css.lastIndexOf(`\n${selector} {`);
    return css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  };

  it("3つのボタン(にがて・ずかん・やめる)は、同じ1つの行(.stage-actions)に、折り返さず並ぶ", () => {
    expect(rule(".stage-actions")).toContain("display: flex;");
    expect(rule(".stage-actions button")).toContain("white-space: nowrap;");
  });

  it("コンボの場所は、出ていないときも確保してある(出ても、ボタンの位置が動かない)", () => {
    const combo = rule(".stage-header .combo");
    expect(combo).toMatch(/min-height: [\d.]+rem;/);
    expect(combo).toMatch(/min-width: [\d.]+rem;/);
  });

  it("解説のないポップアップ用のコンパクトな見た目がある", () => {
    expect(rule(".feedback-overlay .feedback.feedback-compact")).toMatch(/width: min\(100%, [\d.]+rem\);/);
  });

  it("通常ステージの背景バーは、上端基準で切り出し、下端に背景色へのフェードがあり、テーマのモチーフを重ねる", () => {
    expect(rule(".stage-visual")).toContain("background-position: center top;");
    expect(rule(".stage-visual::after")).toContain("var(--color-bg)");
    expect(rule(".stage-visual-motif")).toContain("position: absolute;");
  });
});
