import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { useMasteryStore } from "@/app/store/masteryStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { useStoryStore } from "@/app/store/storyStore";
import { getStagesForArea } from "@/data/stages";
import { ForestEntry } from "@/features/kotonoha/ForestEntry";
import { KotonohaPlayScreen } from "./KotonohaPlayScreen";
import { KotonohaScreen } from "./KotonohaScreen";
import { sceneForScreen } from "@/features/audio/bgmScene";
import { getAllIdiomQuestions } from "@/data/kotowaza";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const prologue = () => getStagesForArea("prologue").map((s) => s.id);
const css = readFileSync("src/styles/global.css", "utf-8");

describe("言の葉の森(画面)", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (el: React.ReactElement) => act(() => root.render(el));
  const q = <T extends Element>(selector: string) => container.querySelector<T>(selector);
  const qa = <T extends Element>(selector: string) => [...container.querySelectorAll<T>(selector)];
  const click = (el: Element | null) => act(() => (el as HTMLElement).click());
  /** 出題の画面を開いて、ラウンド開始の一言(intro)を、タップで飛ばす */
  const play = (scope: "all" | "kotowaza" | "koji", key?: string) => {
    render(<KotonohaPlayScreen scope={scope} key={key} />);
    click(q(".scene-next"));
  };

  beforeEach(() => {
    localStorage.clear();
    useProgressStore.setState({ clearedStageIds: prologue() });
    useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: true, seenEntryFirst: true, shownCompletions: [], lastEntryScene: undefined });
    useMasteryStore.setState({ correctQuestionIds: [], lastSyncedCount: 0 });
    useReviewStore.setState({ starredQuestionIds: [] });
    useStoryStore.setState({ choices: {}, seenStoryIds: [] });
    useNavigationStore.setState({ screen: { name: "kotonoha" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useProgressStore.setState({ clearedStageIds: [] });
  });

  describe("ホームの入口(ForestEntry)", () => {
    it("解放後: 名前・「ことわざ・故事成語」・集めた葉の数。押すと入口の画面へ", () => {
      useKotonohaStore.setState({ collectedIds: ["kotowaza-001", "koji-001"] });
      render(<ForestEntry />);
      const card = q<HTMLButtonElement>(".title-forest")!;
      expect(card.textContent).toContain("の葉"); // 名前(言[こと]の葉[は]の森[もり]。ふりがなの文字が間に入る)
      expect(card.textContent).toContain("森");
      expect(card.textContent).toContain("ことわざ・故事成語");
      expect(card.textContent).toContain("2 / 80");
      expect(card.className).not.toContain("is-locked");
      expect(card.querySelector(".lucide-leaf")).not.toBeNull();
      click(card);
      expect(useNavigationStore.getState().screen).toEqual({ name: "kotonoha" });
    });

    it("未解放: 鍵のアイコンと案内。押しても入れない", () => {
      useProgressStore.setState({ clearedStageIds: [] });
      useNavigationStore.setState({ screen: { name: "title" } });
      render(<ForestEntry />);
      const card = q<HTMLButtonElement>(".title-forest")!;
      expect(card.className).toContain("is-locked");
      expect(card.getAttribute("aria-disabled")).toBe("true");
      expect(card.textContent).toContain("ことばの分かれ道をクリアすると遊べるよ");
      expect(card.querySelector(".lucide-lock")).not.toBeNull();
      expect(card.textContent).not.toContain("/ 80");
      click(card);
      expect(useNavigationStore.getState().screen).toEqual({ name: "title" });
    });

    it("序章の一部だけをクリアしても、まだ入れない", () => {
      useProgressStore.setState({ clearedStageIds: prologue().slice(0, 1) });
      useNavigationStore.setState({ screen: { name: "title" } });
      render(<ForestEntry />);
      click(q(".title-forest"));
      expect(useNavigationStore.getState().screen).toEqual({ name: "title" });
    });

    it("カードの高さは44px以上の決まり(CSS)。行の高さの固定値(1.9)より狭くして、ホームが伸びないようにしている", () => {
      expect(css).toMatch(/\.title-forest \{[^}]*min-height: 2\.75rem;/);
    });
  });

  describe("入口の画面", () => {
    it("3つのボタン(すべて・ことわざ・故事成語)と、葉の数(N / 80)。押すと、その範囲で始まる", () => {
      useKotonohaStore.setState({ collectedIds: ["kotowaza-001"] });
      render(<KotonohaScreen />);
      const buttons = qa<HTMLButtonElement>(".kotonoha-scope-list button");
      expect(buttons).toHaveLength(3);
      expect(buttons.map((b) => b.querySelector(".kotonoha-scope-count")!.textContent)).toEqual(["1 / 80", "1 / 50", "0 / 30"]);
      expect(q(".kotonoha-leaf-count")!.textContent).toBe("1 / 80");
      expect(q(".scene-bubble.is-yurai .scene-bubble-name")!.textContent).toBe("ユライ");
      expect(q(".scene-bubble.is-koto .scene-bubble-name")!.textContent).toBe("コト");
      expect(q(".yurai")).not.toBeNull(); // ユライ(画像がなければ、仮表示の人影)
      click(buttons[1]);
      expect(useNavigationStore.getState().screen).toEqual({ name: "kotonohaPlay", scope: "kotowaza" });
    });

    it("戻るボタンでホームへ。未解放で直接開いても、案内だけで、ゲームは始まらない", () => {
      render(<KotonohaScreen />);
      click(q(".back-button"));
      expect(useNavigationStore.getState().screen).toEqual({ name: "title" });
      useProgressStore.setState({ clearedStageIds: [] });
      render(<KotonohaScreen key="locked" />);
      expect(q(".kotonoha-scope-list")).toBeNull();
      expect(container.textContent).toContain("ことばの分かれ道をクリアすると遊べるよ");
    });
  });

  describe("出題 → 解説 → 結果", () => {
    const answerFirst = () => click(q(".kotonoha-choices button"));

    it("10問。答えると解説(ひとこと・完全な形・意味・ユライの一言)が出て、「つぎへ」で次の問題。最後は結果", () => {
      play("all");
      for (let i = 1; i <= 10; i++) {
        expect(q(".kotonoha-progress")!.textContent).toContain(`${i} / 10`);
        expect(q(".kotonoha-sentence .kotonoha-blank")).not.toBeNull(); // 空欄がある
        const choices = qa<HTMLButtonElement>(".kotonoha-choices button");
        expect(choices.length).toBeGreaterThanOrEqual(3);
        expect(choices.length).toBeLessThanOrEqual(4);
        expect(q(".kotonoha-bottom")).toBeNull(); // 答えるまでは、「つぎへ」はない
        answerFirst();
        const card = q(".kotonoha-explain")!;
        expect(card).not.toBeNull();
        expect(card.querySelector(".kotonoha-verdict")!.textContent).toMatch(/^(せいかい!|ざんねん)$/);
        // 完全な形(空欄が埋まっている)。読みだけのひらがなの行は、出さない(完全な形に、ふりがながある)
        expect(card.querySelector(".kotonoha-full .kotonoha-blank")).toBeNull();
        expect(card.querySelector(".kotonoha-full")!.textContent!.length).toBeGreaterThan(0);
        expect(q(".kotonoha-reading")).toBeNull();
        expect(card.querySelector(".kotonoha-meaning")!.textContent!.length).toBeGreaterThan(0);
        // ほかの選択肢は消える。残るのは、選んだ答えと正解だけ(正解を選んだときは1行、まちがえたときは2行)
        expect(q(".kotonoha-choices")).toBeNull();
        const rows = qa(".kotonoha-answers li");
        expect(rows.length).toBe(card.querySelector(".kotonoha-verdict")!.textContent === "せいかい!" ? 1 : 2);
        expect(rows[rows.length - 1].className).toBe("correct");
        // ユライの一言は、ユライの立ち絵の隣の吹き出し(別のカードにしない)
        const bubble = q(".kotonoha-scene .yurai-bubble .yurai-text")!;
        expect(bubble.textContent!.length).toBeGreaterThan(0);
        expect(card.contains(bubble)).toBe(false);
        expect(q(".kotonoha-scene.has-bubble .yurai")).not.toBeNull();
        // 「つぎへ」は、画面の下に固定するところ(.kotonoha-bottom)にある
        expect(q(".kotonoha-bottom .kotonoha-next")).not.toBeNull();
        // 「ゆらい」のラベルはない(旅人の「ユライ」と混ざるため、「もとの話」)
        expect(container.textContent).not.toContain("ゆらい");
        click(q(".kotonoha-next"));
      }
      expect(q(".kotonoha-result")).not.toBeNull();
      expect(q(".kotonoha-bottom")).toBeNull();
      expect(q(".kotonoha-score")!.textContent).toMatch(/^\d+ \/ 10$/);
      expect(q(".kotonoha-new-leaves")!.textContent).toContain("葉");
      expect(qa(".kotonoha-result-buttons button").map((b) => b.textContent)).toEqual(["もういちど", "もどる"]);
    });

    it("「もとの話を見る」は、由来(origin)がある問題だけ。折りたたみで、開くと由来が見える", () => {
      const all = getAllIdiomQuestions();
      expect(all.some((x) => !x.origin)).toBe(true); // ことわざには、由来のないものがある
      expect(all.some((x) => x.origin)).toBe(true);
      let withOrigin = 0;
      let without = 0;
      // 故事成語は由来が必ずある。ことわざ(由来のない問題がある)も含めて、何ラウンドか見る
      for (const scope of ["koji", "kotowaza"] as const) {
        for (let round = 0; round < 2; round++) {
          play(scope, `${scope}${round}`);
          for (let i = 0; i < 10; i++) {
            answerFirst();
            const details = q<HTMLDetailsElement>(".kotonoha-origin-details");
            if (details) {
              withOrigin++;
              expect(details.querySelector("summary")!.textContent).toBe("もとの話を見る");
              expect(details.open).toBe(false);
              expect(details.querySelector(".kotonoha-origin")!.textContent!.length).toBeGreaterThan(0);
            } else {
              without++;
              expect(container.textContent).not.toContain("もとの話");
            }
            click(q(".kotonoha-next"));
          }
        }
      }
      expect(withOrigin).toBeGreaterThan(0);
      expect(without).toBeGreaterThan(0);
    });

    it("正解の選択肢を押すと葉が集まり、まちがえると、まちがえた問題に記録される。本編の記録は変わらない", () => {
      play("koji");
      const store = useKotonohaStore.getState;
      click(q(".kotonoha-choices button"));
      const pickedCorrect = q(".kotonoha-verdict")!.textContent === "せいかい!";
      expect(store().collectedIds.length + store().missedIds.length).toBe(1);
      expect(pickedCorrect ? store().collectedIds.length : store().missedIds.length).toBe(1);
      // 本編の進捗などは、変わらない
      expect(useMasteryStore.getState().correctQuestionIds).toEqual([]);
      expect(useReviewStore.getState().starredQuestionIds).toEqual([]);
      expect(useProgressStore.getState().clearedStageIds).toEqual(prologue());
    });

    it("範囲: 故事成語を選ぶと、故事成語の問題だけが出る", () => {
      play("koji");
      for (let i = 0; i < 10; i++) {
        expect(q(".kotonoha-scope-tag")!.textContent).toContain("故事成語");
        answerFirst();
        click(q(".kotonoha-next"));
      }
      const ids = [...useKotonohaStore.getState().collectedIds, ...useKotonohaStore.getState().missedIds];
      expect(ids).toHaveLength(10);
      expect(ids.every((id) => id.startsWith("koji-"))).toBe(true);
    });

    it("「もういちど」で同じ範囲の新しいラウンド、「もどる」で入口の画面へ", () => {
      play("kotowaza");
      for (let i = 0; i < 10; i++) {
        answerFirst();
        click(q(".kotonoha-next"));
      }
      click(qa<HTMLButtonElement>(".kotonoha-result-buttons button")[0]);
      expect(q(".kotonoha-result")).toBeNull();
      expect(q(".kotonoha-progress")!.textContent).toContain("1 / 10");
      expect(q(".kotonoha-scope-tag")!.textContent).toContain("ことわざ");
      // 2ラウンド目も、10問とも別々の問題(同じラウンドで重ねて出さない)
      const fulls = new Set<string>();
      for (let i = 0; i < 10; i++) {
        answerFirst();
        fulls.add(q(".kotonoha-sentence")!.textContent!);
        click(q(".kotonoha-next"));
      }
      expect(fulls.size).toBe(10);
      click(qa<HTMLButtonElement>(".kotonoha-result-buttons button")[1]);
      expect(useNavigationStore.getState().screen).toEqual({ name: "kotonoha" });
    });

    it("効果音とBGM: 入口は探索の曲、出題中は出題の曲(既存の曲を使う)", () => {
      expect(sceneForScreen({ name: "kotonoha" })).toBe("explore");
      expect(sceneForScreen({ name: "kotonohaPlay", scope: "all" })).toBe("stage");
    });

    it("CSS: 「つぎへ」は画面の下に固定(下の安全な余白を考える)。上は、ステータスバーの下から始める。音量ボタンは右上", () => {
      const rule = (selector: string) => {
        const start = css.indexOf(`
${selector} {`);
        return start < 0 ? "" : css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
      };
      expect(rule(".kotonoha-bottom")).toContain("position: fixed;");
      expect(rule(".kotonoha-bottom")).toContain("bottom: 0;");
      expect(rule(".kotonoha-bottom")).toContain("env(safe-area-inset-bottom)");
      expect(rule(".screen-kotonoha")).toContain("padding-top: calc(1rem + env(safe-area-inset-top));");
      expect(rule(".screen-kotonoha .back-button")).toContain("env(safe-area-inset-top)");
      // 答えたあとは、固定の「つぎへ」の分、下をあける
      expect(css).toMatch(/\.screen-kotonoha-play\[data-phase="explain"\] \{[^}]*padding-bottom: calc\([^)]*safe-area-inset-bottom/);
      // 「つぎへ」は押しやすい高さ(44px以上)
      expect(Number(rule(".kotonoha-next").match(/min-height: ([\d.]+)rem/)?.[1])).toBeGreaterThanOrEqual(2.75);
    });

    it("ネタバレ語が、画面の文言に出ない(ラスボス・王様・ヴェルバルト・コレット・王女)", () => {
      const words = ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"];
      render(<KotonohaScreen />);
      for (const word of words) expect(container.textContent, word).not.toContain(word);
      play("all", "play");
      for (let i = 0; i < 10; i++) {
        for (const word of words) expect(container.textContent, word).not.toContain(word);
        answerFirst();
        for (const word of words) expect(container.textContent, word).not.toContain(word);
        click(q(".kotonoha-next"));
      }
      for (const word of words) expect(container.textContent, word).not.toContain(word);
    });
  });
});
