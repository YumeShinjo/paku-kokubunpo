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

  beforeEach(() => {
    localStorage.clear();
    useProgressStore.setState({ clearedStageIds: prologue() });
    useKotonohaStore.setState({ collectedIds: [], missedIds: [] });
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
      expect(q(".yurai-bubble .yurai-name")!.textContent).toBe("ユライ");
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

    it("10問。答えると解説(読み・意味・ユライの一言)が出て、「つぎへ」で次の問題。最後は結果", () => {
      render(<KotonohaPlayScreen scope="all" />);
      for (let i = 1; i <= 10; i++) {
        expect(q(".kotonoha-progress")!.textContent).toContain(`${i} / 10`);
        expect(q(".kotonoha-sentence .kotonoha-blank")).not.toBeNull(); // 空欄がある
        const choices = qa<HTMLButtonElement>(".kotonoha-choices button");
        expect(choices.length).toBeGreaterThanOrEqual(3);
        expect(choices.length).toBeLessThanOrEqual(4);
        answerFirst();
        expect(q(".kotonoha-explain")).not.toBeNull();
        expect(q(".kotonoha-explain .kotonoha-reading")!.textContent!.length).toBeGreaterThan(0);
        expect(q(".kotonoha-explain .kotonoha-meaning")!.textContent!.length).toBeGreaterThan(0);
        expect(q(".yurai-bubble .yurai-text")!.textContent!.length).toBeGreaterThan(0);
        // 答えたあとの選択肢は押せない(やり直しはさせない)
        expect(qa<HTMLButtonElement>(".kotonoha-choices button").every((b) => b.disabled)).toBe(true);
        // 完全な形(空欄が埋まっている)
        expect(q(".kotonoha-sentence .kotonoha-blank")).toBeNull();
        click(q(".kotonoha-next"));
      }
      expect(q(".kotonoha-result")).not.toBeNull();
      expect(q(".kotonoha-score")!.textContent).toMatch(/^\d+ \/ 10$/);
      expect(q(".kotonoha-new-leaves")!.textContent).toContain("葉");
      expect(qa(".kotonoha-result-buttons button").map((b) => b.textContent)).toEqual(["もういちど", "もどる"]);
    });

    it("正解の選択肢を押すと葉が集まり、まちがえると、まちがえた問題に記録される。本編の記録は変わらない", () => {
      render(<KotonohaPlayScreen scope="koji" />);
      // 1問目: 正解を押す
      const firstQuestionButtons = qa<HTMLButtonElement>(".kotonoha-choices button");
      expect(firstQuestionButtons.length).toBeGreaterThan(0);
      const store = useKotonohaStore.getState;
      click(firstQuestionButtons[0]);
      const pickedCorrect = firstQuestionButtons[0].className === "correct"; // 解説のあと、正解の選択肢に correct が付く
      expect(store().collectedIds.length + store().missedIds.length).toBe(1);
      expect(pickedCorrect ? store().collectedIds.length : store().missedIds.length).toBe(1);
      // 本編の進捗などは、変わらない
      expect(useMasteryStore.getState().correctQuestionIds).toEqual([]);
      expect(useReviewStore.getState().starredQuestionIds).toEqual([]);
      expect(useProgressStore.getState().clearedStageIds).toEqual(prologue());
    });

    it("範囲: 故事成語を選ぶと、故事成語の問題だけが出る", () => {
      render(<KotonohaPlayScreen scope="koji" />);
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
      render(<KotonohaPlayScreen scope="kotowaza" />);
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

    it("ネタバレ語が、画面の文言に出ない(ラスボス・王様・ヴェルバルト・コレット)", () => {
      const words = ["ラスボス", "王様", "ヴェルバルト", "コレット"];
      render(<KotonohaScreen />);
      for (const word of words) expect(container.textContent, word).not.toContain(word);
      render(<KotonohaPlayScreen scope="all" key="play" />);
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
