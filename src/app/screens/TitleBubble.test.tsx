import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 表情の画像は、置かれていなくても確かめられるよう、名前をそのままURLにして返す
vi.mock("@/assets/registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/assets/registry")>();
  return { ...actual, findImage: (name: string) => `url:${name}` };
});

import { TitleScreen } from "./TitleScreen";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { useMascotStore } from "@/app/store/mascotStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { useStoryStore } from "@/app/store/storyStore";
import { TAP_LINES } from "@/data/homeLines";
import { getStagesForArea } from "@/data/stages";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const FORBIDDEN = ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"];

describe("ホーム画面: コトの吹き出し", () => {
  let container: HTMLDivElement;
  let root: Root;
  const q = <T extends Element>(selector: string) => container.querySelector<T>(selector);
  const render = (key = "r") => act(() => root.render(<TitleScreen key={key} />));
  const tap = () => act(() => q<HTMLButtonElement>(".title-koto-tap")!.click());
  const text = () => q(".title-bubble-text")!.textContent!;
  const shownImage = () => q(".title-koto .mascot-image")!.getAttribute("src")!.replace("url:", "");
  const setState = (opts: { stars?: number; cleared?: boolean; leaves?: number }) => {
    useReviewStore.setState({ starredQuestionIds: Array.from({ length: opts.stars ?? 0 }, (_, i) => `q-${i}`) });
    useProgressStore.setState({ clearedStageIds: opts.cleared === false ? [] : getStagesForArea("prologue").map((s) => s.id) });
    useKotonohaStore.setState({ collectedIds: Array.from({ length: opts.leaves ?? 0 }, (_, i) => `kotowaza-${i}`) });
  };

  beforeEach(() => {
    useNavigationStore.setState({ screen: { name: "title" } });
    useStoryStore.setState({ choices: {}, seenStoryIds: [] });
    useMascotStore.setState({ growthStage: 0 });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    setState({ cleared: false });
    vi.restoreAllMocks();
  });

  it("ロゴは出さない(ホーム画面から外した)。画面の名前は、見えない見出しで残す", () => {
    setState({});
    render();
    expect(q(".title-logo")).toBeNull();
    expect(q(".title-hero img.title-logo")).toBeNull();
    const heading = q("h1")!;
    expect(heading.textContent).toBe("パクっと国文法");
    expect(heading.className).toContain("visually-hidden");
  });

  it("開いたとき、状況の一言を1つ出す(判定の順: 星 → 序章未クリア → 葉0枚 → 葉の途中 → 葉80枚 → ふだん)", () => {
    setState({ stars: 2 });
    render("a");
    expect(text()).toContain("苦手な問題が残ってるよ");
    setState({ cleared: false });
    render("b");
    expect(text()).toContain("はじめる");
    setState({ leaves: 0 });
    render("c");
    expect(text()).toContain("ユライが待ってるよ");
    setState({ leaves: 12 });
    render("d");
    expect(text()).toContain("あと68枚");
    setState({ leaves: 80 });
    render("e");
    expect(text()).toContain("ぜんぶそろったね");
  });

  it("状況の一言ごとの表情: 星1〜4問=ハングリー、5問以上=眠そう、葉=コンボ、そのほか=通常", () => {
    setState({ stars: 3 });
    render("a");
    expect(shownImage()).toBe("mascot/hungry");
    setState({ stars: 5 });
    render("b");
    expect(shownImage()).toBe("mascot/sleepy");
    setState({ leaves: 12 });
    render("c");
    expect(shownImage()).toBe("mascot/combo");
    setState({ cleared: false });
    render("d");
    expect(shownImage()).toBe("mascot/base");
  });

  it("コトをタップすると、別の一言に替わる(表情も、その一言のとおり)。連続して、同じ一言にならない。時間では、消えも、戻りもしない", () => {
    vi.useFakeTimers();
    setState({ leaves: 12 });
    render();
    let previous = text();
    const lines = new Map(TAP_LINES.map((l) => [l.text.replace("♪", ""), l]));
    for (let i = 0; i < 60; i++) {
      tap();
      const now = text();
      expect(now, `${i}`).not.toBe(previous);
      previous = now;
      const line = [...lines.values()].find((l) => now.replace(/\[[^\]]*\]/g, "").includes(l.text.slice(0, 6)))!;
      expect(shownImage(), line.id).toBe(line.expression ? `mascot/${line.expression}` : "mascot/base");
    }
    // 何秒たっても、一言も表情も、そのまま(元に戻すタイマーがない)
    const kept = text();
    const keptImage = shownImage();
    act(() => vi.advanceTimersByTime(60_000));
    expect(text()).toBe(kept);
    expect(shownImage()).toBe(keptImage);
    vi.useRealTimers();
  });

  it("タップできるのは、コトの絵全体(見えない大きなボタンが、絵と同じ大きさで重なる)。名前で読み上げられる", () => {
    setState({});
    render();
    const stage = q(".title-koto-stage")!;
    const button = stage.querySelector(".title-koto-tap")!;
    expect(button.getAttribute("aria-label")).toBe("コトに話しかける");
    expect(button.parentElement).toBe(stage);
    const css = readFileSync("src/styles/global.css", "utf-8");
    const rule = css.slice(css.indexOf("\n.title-koto-tap {"));
    expect(rule.slice(0, rule.indexOf("}"))).toContain("width: 100%;");
    expect(rule.slice(0, rule.indexOf("}"))).toContain("height: 100%;");
  });

  it("吹き出しの文字に、禁止語が出ない(どの状態でも)", () => {
    for (const opts of [{ stars: 7 }, { cleared: false }, { leaves: 0 }, { leaves: 30 }, { leaves: 80 }]) {
      setState(opts);
      render(JSON.stringify(opts));
      for (let i = 0; i < 20; i++) {
        for (const word of FORBIDDEN) expect(container.textContent, word).not.toContain(word);
        tap();
      }
    }
  });

  it("表情の画像は、ホームを開いたときに、一度だけ先に読み込む(コンボ・ハングリー・眠そう)。タップのたびには、読み込まない", () => {
    const sources: string[] = [];
    class FakeImage {
      set src(value: string) {
        sources.push(value);
      }
    }
    vi.stubGlobal("Image", FakeImage);
    setState({ leaves: 5 });
    render();
    expect(sources.sort()).toEqual(["url:mascot/combo", "url:mascot/hungry", "url:mascot/sleepy"]);
    for (let i = 0; i < 10; i++) tap();
    expect(sources).toHaveLength(3);
    vi.unstubAllGlobals();
  });

  it("ホームの画面のコードに、定期的な処理(setInterval・setTimeout・requestAnimationFrame)がない(BGMのノイズの教訓)", () => {
    const source = readFileSync("src/app/screens/TitleScreen.tsx", "utf-8");
    expect(source).not.toMatch(/setInterval|setTimeout|requestAnimationFrame/);
    const data = readFileSync("src/data/homeLines.ts", "utf-8");
    expect(data).not.toMatch(/setInterval|setTimeout|requestAnimationFrame/);
  });

  it("戻るボタンの動作(最初の画面へ戻る)・音量ボタンの位置は、変えない", () => {
    setState({});
    const openSplash = vi.fn();
    useNavigationStore.setState({ openSplash });
    render();
    act(() => q<HTMLButtonElement>(".title-back")!.click());
    expect(openSplash).toHaveBeenCalledTimes(1);
  });
});
