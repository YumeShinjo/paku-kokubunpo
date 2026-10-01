import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { useProgressStore } from "@/app/store/progressStore";
import { getStagesForArea } from "@/data/stages";
import { kojiQuestions, kotowazaQuestions } from "@/data/kotowaza";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { ENDING_CHOICE_EVENT_ID } from "@/data/titles";
import { DEFAULT_ZUKAN_TAB, resolveZukanTab, visibleZukanTabs, ZUKAN_TABS, type ZukanTab } from "@/features/zukan/zukanTabs";
import { ZukanScreen } from "./ZukanScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync("src/styles/global.css", "utf-8");

describe("ことだまの書のタブ", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (el: React.ReactElement) => act(() => root.render(el));
  const tabs = () => [...container.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const selectedTab = () => tabs().find((t) => t.getAttribute("aria-selected") === "true")!;
  const click = (label: string) => act(() => tabs().find((t) => t.textContent === label)!.click());
  const scrollTo = vi.fn();

  beforeEach(() => {
    useTutorialStore.setState({ seenGuides: ["zukan"] });
    useStoryStore.setState({ choices: {}, seenStoryIds: [] });
    useNavigationStore.setState({ screen: { name: "zukan" } });
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    scrollTo.mockClear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useStoryStore.setState({ choices: {}, seenStoryIds: [] });
  });

  it("タブは「せいとうりつ」「ことばの ずかん」「おもいで」の3つ。開いたときは「せいとうりつ」", () => {
    render(<ZukanScreen />);
    expect(tabs().map((t) => t.textContent)).toEqual(["せいとうりつ", "ことばの ずかん", "おもいで"]);
    expect(selectedTab().textContent).toBe("せいとうりつ");
    expect(container.querySelector(".zukan-list")).not.toBeNull(); // 正答率の一覧
    expect(container.querySelector(".zukan-pages")).toBeNull();
    expect(container.querySelector(".zukan-title")).toBeNull();
  });

  it("タブと中身は、アクセシビリティの関連づけ(tablist / tab / tabpanel)がある", () => {
    render(<ZukanScreen />);
    expect(container.querySelector('[role="tablist"]')).not.toBeNull();
    const panel = container.querySelector('[role="tabpanel"]')!;
    expect(panel.getAttribute("aria-labelledby")).toBe(selectedTab().id);
    expect(selectedTab().getAttribute("aria-controls")).toBe(panel.id);
  });

  it("「ことばの ずかん」: 既存のずかんのページ(バトル中のずかんと同じ部品)が出る", () => {
    render(<ZukanScreen />);
    click("ことばの ずかん");
    expect(selectedTab().textContent).toBe("ことばの ずかん");
    expect(container.querySelector(".zukan-pages")).not.toBeNull();
    expect(container.querySelectorAll(".zukan-page").length).toBeGreaterThan(0);
    expect(container.querySelector(".zukan-list")).toBeNull();
  });

  it("「おもいで」: 称号・エンディングの見返し・ストーリーの見返し。見返しは、選んだ分岐があるときだけ", () => {
    render(<ZukanScreen />);
    click("おもいで");
    expect(container.querySelector(".zukan-title")?.textContent).toContain("しょうごう");
    expect(container.querySelector(".zukan-replay")).toBeNull();
    expect(container.querySelector(".zukan-memories")).not.toBeNull();
    act(() => useStoryStore.setState({ choices: { [ENDING_CHOICE_EVENT_ID]: "castle" } }));
    expect(container.querySelector(".title-badge")).not.toBeNull();
    expect(container.querySelector(".zukan-replay button")?.textContent).toContain("エンディングを もういちど 見る");
  });

  it("エンディングの見返しは、終わったあと「おもいで」タブに戻る。ストーリーの見返しも同じ", () => {
    useStoryStore.setState({ choices: { [ENDING_CHOICE_EVENT_ID]: "castle" }, seenStoryIds: ["kotobaNoIchiba-intro"] });
    render(<ZukanScreen initialTab="memories" />);
    act(() => container.querySelector<HTMLButtonElement>(".zukan-replay button")!.click());
    const replay = useNavigationStore.getState().screen;
    // ストーリーの連鎖の最後(結果画面の next)が、おもいでタブの ことだまの書
    const last = JSON.stringify(replay);
    expect(last).toContain('"name":"zukan","tab":"memories"');

    useNavigationStore.setState({ screen: { name: "zukan", tab: "memories" } });
    render(<ZukanScreen key="again" initialTab="memories" />);
    act(() => container.querySelector<HTMLButtonElement>(".memory-list button")!.click());
    expect(useNavigationStore.getState().screen).toMatchObject({ name: "story", next: { name: "zukan", tab: "memories" } });
  });

  it("選んだタブは、この画面にいる間は覚えている。知らないタブidのときは、既定のタブ", () => {
    render(<ZukanScreen />);
    click("おもいで");
    render(<ZukanScreen />); // 同じ画面の描き直し
    expect(selectedTab().textContent).toBe("おもいで");
    render(<ZukanScreen key="other" initialTab="no-such-tab" />);
    expect(selectedTab().textContent).toBe("せいとうりつ");
    render(<ZukanScreen key="pages" initialTab="pages" />);
    expect(selectedTab().textContent).toBe("ことばの ずかん");
  });

  it("タブを切り替えると、スクロール位置は先頭にもどる(同じタブを押したときは、そのまま)", () => {
    render(<ZukanScreen />);
    click("せいとうりつ");
    expect(scrollTo).not.toHaveBeenCalled();
    click("ことばの ずかん");
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("苦手問題のようなボタンの動作(自由練習へ)は、せいとうりつタブのまま動く", () => {
    render(<ZukanScreen />);
    expect(container.querySelector(".zukan-review")?.textContent).toContain("苦手");
    expect(container.querySelectorAll(".zukan-row").length).toBeGreaterThan(0);
  });

  describe("ことわざ・故事成語ずかん(タブ)", () => {
    const prologue = () => getStagesForArea("prologue").map((s) => s.id);
    const kotonohaTab = () => tabs().find((t) => t.textContent?.includes("ずかん") && t.textContent.includes("故事成語"));

    it("序章をクリアするまでは、タブが出ない。クリアすると、4つ目のタブとして出る", () => {
      useProgressStore.setState({ clearedStageIds: [] });
      render(<ZukanScreen />);
      expect(tabs()).toHaveLength(3);
      expect(kotonohaTab()).toBeUndefined();
      useProgressStore.setState({ clearedStageIds: prologue() });
      render(<ZukanScreen key="cleared" />);
      expect(tabs()).toHaveLength(4);
      expect(kotonohaTab()!.textContent).toContain("ことわざ・");
      expect(kotonohaTab()!.textContent).toContain("ずかん");
      expect(kotonohaTab()!.textContent).toContain("こじせいご"); // ふりがな(方針で残る語)
      useProgressStore.setState({ clearedStageIds: [] });
    });

    it("中身: 集めた数(N / 80)。集めた葉は完全な形を見出しにして、タップで詳細。集めていない葉は「？」で、答えが分かる文字は出ない", () => {
      useProgressStore.setState({ clearedStageIds: prologue() });
      const collected = kotowazaQuestions.slice(0, 2);
      useKotonohaStore.setState({ collectedIds: [collected[0].id, collected[1].id, kojiQuestions[0].id], missedIds: [] });
      render(<ZukanScreen initialTab="kotonoha" />);
      expect(container.querySelector(".kotonoha-leaf-count")!.textContent).toBe("3 / 80");
      const headings = [...container.querySelectorAll(".kotonoha-tab h3")].map((h) => h.textContent);
      expect(headings[0]).toContain("ことわざ");
      expect(headings[1]).toContain("故事成語");
      expect(container.querySelectorAll(".leaf-card")).toHaveLength(80);
      const opened = [...container.querySelectorAll("details.leaf-card")];
      expect(opened).toHaveLength(3);
      // 見出しは完全な形(答えを含む)。詳細には、読み・意味・ユライの一言
      const first = opened[0];
      expect(first.querySelector("summary")!.textContent!.replace(/\s/g, "")).toContain(collected[0].answer.map((s) => s.text).join(""));
      expect(first.querySelector(".kotonoha-reading")!.textContent).toBe(collected[0].reading);
      expect(first.querySelector(".leaf-yurai")!.textContent).toContain("ユライ");
      // 集めていない葉: 「？」だけ。ほかの問題の答え・文は、見えない
      const empty = [...container.querySelectorAll(".leaf-card.is-empty")];
      expect(empty).toHaveLength(77);
      expect(empty.every((e) => e.textContent!.replace(/\s/g, "") === "？")).toBe(true);
      const uncollectedAnswer = kotowazaQuestions[10].answer.map((s) => s.text).join("");
      expect(container.textContent).not.toContain(kotowazaQuestions[10].full.map((s) => s.text).join(""));
      expect(uncollectedAnswer.length).toBeGreaterThan(0);
      useProgressStore.setState({ clearedStageIds: [] });
      useKotonohaStore.setState({ collectedIds: [], missedIds: [] });
    });

    it("ネタバレ語(ラスボス・王様・ヴェルバルト・コレット)は出ない", () => {
      useProgressStore.setState({ clearedStageIds: prologue() });
      useKotonohaStore.setState({ collectedIds: [...kotowazaQuestions, ...kojiQuestions].map((q) => q.id), missedIds: [] });
      render(<ZukanScreen initialTab="kotonoha" />);
      for (const word of ["ラスボス", "王様", "ヴェルバルト", "コレット"]) expect(container.textContent, word).not.toContain(word);
      useProgressStore.setState({ clearedStageIds: [] });
      useKotonohaStore.setState({ collectedIds: [], missedIds: [] });
    });
  });

  describe("タブの定義(データ)", () => {
    const Dummy = () => <p className="dummy-panel">ことわざ</p>;
    const extra: ZukanTab[] = [
      ...ZUKAN_TABS,
      { id: "proverbs", label: "ことわざ ずかん", Panel: Dummy },
      { id: "empty", label: "からっぽ", Panel: Dummy, hasContent: () => false },
    ];

    it("配列にタブを足すだけで増える。中身のないタブ(hasContent が false)は出ない", () => {
      render(<ZukanScreen tabs={extra} />);
      expect(tabs().map((t) => t.textContent)).toEqual(["せいとうりつ", "ことばの ずかん", "おもいで", "ことわざ ずかん"]);
      click("ことわざ ずかん");
      expect(container.querySelector(".dummy-panel")).not.toBeNull();
    });

    it("visibleZukanTabs / resolveZukanTab", () => {
      expect(visibleZukanTabs(extra).map((t) => t.id)).toEqual(["accuracy", "pages", "memories", "proverbs"]);
      expect(resolveZukanTab("empty", visibleZukanTabs(extra))).toBe(DEFAULT_ZUKAN_TAB);
      expect(resolveZukanTab("proverbs", visibleZukanTabs(extra))).toBe("proverbs");
      expect(resolveZukanTab(undefined)).toBe(DEFAULT_ZUKAN_TAB);
    });
  });

  describe("見た目(CSS)", () => {
    const rule = (selector: string) => {
      const start = css.indexOf(`\n${selector} {`);
      return start < 0 ? "" : css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
    };

    it("タブの高さは44px以上。タブが増えて入りきらなくなったら、横にスクロールできる", () => {
      expect(Number(rule(".zukan-tab").match(/min-height: ([\d.]+)rem/)?.[1])).toBeGreaterThanOrEqual(2.75);
      expect(rule(".zukan-tablist")).toContain("overflow-x: auto;");
      // 標準の文字サイズでは、タブが縮んで(長いラベルは折り返して)幅に収まる。「大」では、縮めず、横にスクロール
      expect(rule(".zukan-tab")).toContain("flex: 1 1 auto;");
      expect(css).toMatch(/html\[data-text-size="large"\] \.zukan-tab \{[^}]*flex: 1 0 auto;[^}]*white-space: nowrap;/);
      expect(css).toMatch(/\.zukan-tabs\[data-fade-end="true"\]::after/);
    });
  });
});
