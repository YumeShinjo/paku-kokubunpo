import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { KotonohaScreen } from "@/app/screens/KotonohaScreen";
import { ZukanScreen } from "@/app/screens/ZukanScreen";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { getStagesForArea } from "@/data/stages";
import { ZUKAN_TABS } from "@/features/zukan/zukanTabs";
import { zukanReturnScreen } from "@/features/zukan/zukanReturn";
import { GRAMMAR_ZUKAN_NAME } from "@/features/zukan/ZukanPages";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync("src/styles/global.css", "utf-8");
const SPOILERS = ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"];
const rule = (selector: string) => {
  const start = css.indexOf(`\n${selector} {`);
  return start < 0 ? "" : css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
};

describe("図鑑のタブの名前と並び", () => {
  it("並びは、せいとう / ぶんぽう / なかま / ことのは / おもいで。表示名はどれも4文字以下のひらがな", () => {
    expect(ZUKAN_TABS.map((t) => t.shortLabel)).toEqual(["せいとう", "ぶんぽう", "なかま", "ことのは", "おもいで"]);
    for (const tab of ZUKAN_TABS) expect(tab.shortLabel, tab.id).toMatch(/^[ぁ-ゟ]{1,4}$/);
  });

  it("「ぶんぽう」の正式な名前は「ぶんぽうの ずかん」。出題画面の「ずかん」から開く画面も、同じ名前", () => {
    expect(GRAMMAR_ZUKAN_NAME).toBe("ぶんぽうの ずかん");
    expect(ZUKAN_TABS.find((t) => t.id === "pages")!.label).toBe(GRAMMAR_ZUKAN_NAME);
    const quiz = readFileSync("src/features/quiz/QuizPlayer.tsx", "utf-8");
    expect(quiz).toContain("aria-label={GRAMMAR_ZUKAN_NAME}");
    expect(quiz).not.toContain("ことばのずかん");
  });
});

describe("図鑑・言の葉の森の画面", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (el: React.ReactElement) => act(() => root.render(el));
  const q = <T extends Element>(selector: string) => container.querySelector<T>(selector);
  const click = (el: Element | null) => act(() => (el as HTMLElement).click());
  const prologue = () => getStagesForArea("prologue").map((s) => s.id);

  beforeEach(() => {
    localStorage.clear();
    useTutorialStore.setState({ seenGuides: ["zukan"] });
    useProgressStore.setState({ clearedStageIds: prologue() });
    useStoryStore.setState({ choices: {}, seenStoryIds: [] });
    useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: true, seenEntryFirst: true, shownCompletions: [], lastEntryScene: undefined });
    useNavigationStore.setState({ screen: { name: "kotonoha" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useProgressStore.setState({ clearedStageIds: [] });
    useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: false, seenEntryFirst: false, shownCompletions: [], lastEntryScene: undefined });
  });

  describe("ぶんぽうタブ", () => {
    it("先頭に、何のページか分かる1行の案内。見出しは「ぶんぽうの ずかん」", () => {
      render(<ZukanScreen initialTab="pages" />);
      const pages = q(".zukan-pages")!;
      expect(pages.querySelector("h3")!.textContent).toBe("ぶんぽうの ずかん");
      expect(pages.children[1].className).toBe("zukan-pages-guide");
      expect(pages.children[1].textContent).toBe("ぶんぽうの ことばを しらべよう");
    });
  });

  describe("ことのはタブ", () => {
    it("見出しは、ことわざと故事成語を含む名前。ことわざ(50)と故事成語(30)の見出しで分かれ、集めた数は「n / 80」", () => {
      useKotonohaStore.setState({ collectedIds: ["kotowaza-001", "koji-001"] });
      render(<ZukanScreen initialTab="kotonoha" />);
      const headings = [...container.querySelectorAll(".kotonoha-tab h3")].map((h) => h.textContent);
      expect(headings[0]).toContain("ことわざ");
      expect(headings[0]).toContain("故事成語");
      expect(headings[1]).toContain("1 / 50");
      expect(headings[2]).toContain("1 / 30");
      expect(q(".kotonoha-tab > .kotonoha-leaf-count")!.textContent).toBe("2 / 80");
    });

    it("葉が1枚もないときは、空の案内を出す。ある ときは出さない", () => {
      render(<ZukanScreen initialTab="kotonoha" />);
      expect(q(".kotonoha-tab-empty")).not.toBeNull();
      useKotonohaStore.setState({ collectedIds: ["kotowaza-001"] });
      render(<ZukanScreen key="some" initialTab="kotonoha" />);
      expect(q(".kotonoha-tab-empty")).toBeNull();
    });

    it("ユライの一言は、名前(チップ)と台詞が、別の要素。名前が、台詞に続いた文に見えない", () => {
      useKotonohaStore.setState({ collectedIds: ["kotowaza-001"] });
      render(<ZukanScreen initialTab="kotonoha" />);
      const line = q(".leaf-yurai")!;
      const name = line.querySelector(".leaf-yurai-name")!;
      expect(name.textContent).toBe("ユライ");
      expect(name.nextElementSibling!.textContent!.length).toBeGreaterThan(0); // 台詞は、名前の次の、別の要素
      expect(name.nextElementSibling).not.toBe(name);
      expect(rule(".leaf-detail .leaf-yurai")).toContain("display: flex;");
      expect(rule(".leaf-detail .leaf-yurai")).toMatch(/gap: [\d.]+rem;/);
      expect(rule(".leaf-yurai-name")).toContain("border-radius: 999px;");
    });
  });

  describe("名前と台詞が別の要素(ユライ・コトの表示すべて)", () => {
    it("入口・結果などの吹き出しは、名前のチップと台詞が別の要素で、間にすき間(gap)がある", () => {
      expect(rule(".scene-bubble")).toMatch(/gap: [\d.]+rem;/);
      expect(rule(".scene-bubble-name")).toContain("border-radius: 999px;");
      expect(rule(".scene-bubble-name")).toContain("flex: none;");
    });

    it("解説画面の吹き出しは、名前の行と台詞の行が分かれている(名前は <p>、台詞は <div>)", () => {
      const source = readFileSync("src/features/kotonoha/Yurai.tsx", "utf-8");
      expect(source).toContain('<p className="yurai-name">ユライ</p>');
      expect(source).toContain('<div className="yurai-text">');
    });
  });

  describe("言の葉の森の入口 → 図鑑(ことのは)", () => {
    it("「ずかんを みる」を押すと、ことのはタブを選んだ状態で、ことだまの書が開く(戻り先は、言の葉の森)", () => {
      render(<KotonohaScreen />);
      const button = q<HTMLButtonElement>(".kotonoha-zukan-link")!;
      expect(button.textContent).toContain("ずかんを みる");
      click(button);
      expect(useNavigationStore.getState().screen).toEqual({ name: "zukan", tab: "kotonoha", backTo: "kotonoha" });
    });

    it("集めた葉の数(n / 80)を、ボタンの中に出す。葉が1枚もなくても、押せる", () => {
      render(<KotonohaScreen />);
      const button = q<HTMLButtonElement>(".kotonoha-zukan-link")!;
      expect(button.disabled).toBe(false);
      expect(button.querySelector(".kotonoha-leaf-count")!.textContent).toBe("0 / 80");
      useKotonohaStore.setState({ collectedIds: ["kotowaza-001", "koji-001", "koji-002"] });
      render(<KotonohaScreen key="some" />);
      expect(q(".kotonoha-zukan-link .kotonoha-leaf-count")!.textContent).toBe("3 / 80");
      expect(q(".kotonoha-zukan-link .kotonoha-leaf-count")!.getAttribute("aria-label")).toBe("集めた葉 3 / 80");
    });

    it("初回の台詞の途中は、ボタンを出さない。台詞を終えて(スキップして)から出る", () => {
      useKotonohaStore.setState({ enteredForest: false, seenEntryFirst: false });
      render(<KotonohaScreen />);
      expect(q('[data-scene="entry_first"]')).not.toBeNull();
      expect(q(".kotonoha-zukan-link")).toBeNull();
      click(q(".scene-next")); // 途中
      expect(q(".kotonoha-zukan-link")).toBeNull();
      click(q(".scene-skip"));
      expect(q(".kotonoha-zukan-link")).not.toBeNull();
    });

    it("ボタンは高さ44px以上。下の安全な余白(safe-area)を考える", () => {
      expect(Number(rule(".kotonoha-zukan-link").match(/min-height: ([\d.]+)rem/)?.[1])).toBeGreaterThanOrEqual(2.75);
      expect(rule(".screen-kotonoha-entry")).toContain("env(safe-area-inset-bottom)"); // 画面の下の余白(ボタンの下)
    });

    it("図鑑の「もどる」は、言の葉の森から来たときは言の葉の森の入口へ。ふつうに開いたときは、ホーム画面へ", () => {
      render(<ZukanScreen initialTab="kotonoha" backTo="kotonoha" />);
      click(q(".back-button"));
      expect(useNavigationStore.getState().screen).toEqual({ name: "kotonoha" });

      useNavigationStore.setState({ screen: { name: "zukan" } });
      render(<ZukanScreen key="home" />);
      click(q(".back-button"));
      expect(useNavigationStore.getState().screen).toEqual({ name: "title" });
    });

    it("図鑑の中から見返しへ行って戻るときも、戻り先を引き継ぐ(言の葉の森から来たなら、おもいでから戻っても、言の葉の森へ)", () => {
      useNavigationStore.setState({ screen: { name: "zukan", tab: "kotonoha", backTo: "kotonoha" } });
      expect(zukanReturnScreen("memories")).toEqual({ name: "zukan", tab: "memories", backTo: "kotonoha" });
      useNavigationStore.setState({ screen: { name: "zukan", tab: "accuracy" } });
      expect(zukanReturnScreen("memories")).toEqual({ name: "zukan", tab: "memories" });
      useNavigationStore.setState({ screen: { name: "title" } });
      expect(zukanReturnScreen("memories")).toEqual({ name: "zukan", tab: "memories" });
    });

    it("増えた文言(入口・図鑑)に、禁止語が出ない", () => {
      render(<KotonohaScreen />);
      for (const word of SPOILERS) expect(container.textContent, word).not.toContain(word);
      render(<ZukanScreen key="z" initialTab="kotonoha" backTo="kotonoha" />);
      for (const word of SPOILERS) expect(container.textContent, word).not.toContain(word);
      render(<ZukanScreen key="p" initialTab="pages" />);
      for (const word of SPOILERS) expect(container.textContent, word).not.toContain(word);
    });
  });
});
