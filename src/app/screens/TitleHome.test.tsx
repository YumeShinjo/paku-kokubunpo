import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { useMasteryStore } from "@/app/store/masteryStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useStoryStore } from "@/app/store/storyStore";
import { getAllQuestions } from "@/data/questionLoader";
import { ENDING_CHOICE_EVENT_ID } from "@/data/titles";
import { TitleScreen } from "./TitleScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync("src/styles/global.css", "utf-8");

describe("ホーム画面(タップ後のタイトル画面)の構成", () => {
  let container: HTMLDivElement;
  let root: Root;
  const q = <T extends Element>(selector: string) => container.querySelector<T>(selector);

  beforeEach(() => {
    useMasteryStore.setState({ correctQuestionIds: [], lastSyncedCount: 0 });
    useStoryStore.setState({ choices: {}, seenStoryIds: [] });
    useReviewStore.setState({ starredQuestionIds: [] });
    useNavigationStore.setState({ screen: { name: "title" }, splashOpen: false });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<TitleScreen />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("左上に、「タイトルへもどる」の丸いボタンがある(押すと、最初の画面を出す)", () => {
    const back = q<HTMLButtonElement>("button.title-back")!;
    expect(back.getAttribute("aria-label")).toBe("タイトルへもどる");
    expect(back.querySelector("svg")).not.toBeNull();
    act(() => back.click());
    expect(useNavigationStore.getState().splashOpen).toBe(true);
    expect(useNavigationStore.getState().screen.name).toBe("title");
  });

  it("進捗が0のとき: カードの中に、空の進捗バーと「正解した問題 0 / N問」が出る(称号の行は出ない)", () => {
    const card = q(".title-card")!;
    const bar = card.querySelector('[role="progressbar"]')!;
    const total = getAllQuestions().length;
    expect(bar.getAttribute("aria-valuenow")).toBe("0");
    expect(bar.getAttribute("aria-valuemax")).toBe(String(total));
    expect((bar.firstElementChild as HTMLElement).style.width).toBe("0%");
    expect(card.textContent).toContain(`正解した問題 0 / ${total}問`);
    expect(card.querySelector(".title-owned")).toBeNull();
  });

  it("進捗があるとき: バーが、正解した割合だけ伸びる", () => {
    const total = getAllQuestions().length;
    act(() => useMasteryStore.setState({ correctQuestionIds: Array.from({ length: 10 }, (_, i) => `m${i}`) }));
    const bar = q('[role="progressbar"]')!;
    expect(bar.getAttribute("aria-valuenow")).toBe("10");
    expect(parseFloat((bar.firstElementChild as HTMLElement).style.width)).toBeCloseTo((10 / total) * 100, 5);
    expect(q(".title-card")!.textContent).toContain(`正解した問題 10 / ${total}問`);
  });

  it("称号があるとき: 称号のバッジが、同じカードの中に、王冠のアイコンつきで出る", () => {
    act(() => useStoryStore.setState({ choices: { [ENDING_CHOICE_EVENT_ID]: "castle" } }));
    const card = q(".title-card")!;
    const owned = card.querySelector(".title-owned")!;
    expect(owned.querySelector(".title-badge")).not.toBeNull();
    expect(owned.querySelector(".title-badge-icon")?.getAttribute("class")).toContain("crown");
    // 称号→進捗バー→正解数の順
    expect(owned.compareDocumentPosition(card.querySelector(".mastery-bar")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("サブボタン2つ(ことだまの書・ランキング): 左に色つきの丸いバッジ(アイコンの土台)があり、色が違う", () => {
    const buttons = [...container.querySelectorAll<HTMLButtonElement>(".title-sub-buttons button")];
    expect(buttons.map((b) => b.textContent)).toEqual(["ことだまの書", "ランキング"]);
    for (const b of buttons) {
      const badge = b.querySelector(".sub-badge");
      expect(badge?.querySelector("svg"), b.textContent ?? "").not.toBeNull();
      expect(b.firstElementChild).toBe(badge);
    }
    expect(buttons.map((b) => b.className)).toEqual(["sub-book", "sub-rank"]);
  });

  it("上のバー: 左に家(戻る)、右に「せってい」(歯車アイコン・44px以上)。音量ボタンの左に並ぶ。押すとせってい画面へ", () => {
    const gear = q<HTMLButtonElement>("button.title-settings")!;
    expect(gear.getAttribute("aria-label")).toBe("せってい");
    expect(gear.querySelector("svg")).not.toBeNull();
    expect(q("button.title-back")).not.toBeNull();
    // 下のサブボタンには、せっていはない(入口は、上のバーのひとつだけ)
    expect([...container.querySelectorAll(".title-sub-buttons button")].some((b) => b.textContent?.includes("せってい"))).toBe(false);
    act(() => gear.click());
    expect(useNavigationStore.getState().screen.name).toBe("settings");
  });

  it("フッター: 「クレジット」と「プライバシーポリシー」が、小さい文字で、中央の1行に並ぶ。押すと、それぞれの画面へ", () => {
    const footer = q(".title-footer")!;
    expect([...footer.querySelectorAll("button")].map((b) => b.textContent?.trim())).toEqual(["クレジット", "プライバシーポリシー"]);
    // クレジットは、フッターにだけある(サブボタンにはない)
    expect([...container.querySelectorAll(".title-sub-buttons button")].some((b) => b.textContent?.includes("クレジット"))).toBe(false);
    act(() => footer.querySelector<HTMLButtonElement>(".title-credits")!.click());
    expect(useNavigationStore.getState().screen.name).toBe("credits");
    act(() => useNavigationStore.getState().goTo({ name: "title" }));
    act(() => footer.querySelector<HTMLButtonElement>(".title-privacy")!.click());
    expect(useNavigationStore.getState().screen.name).toBe("privacy");
  });

  it("並び順: 称号カード → はじめる → 言の葉の森 → ことだまの書・ランキング → フッター", () => {
    const order = [".title-card", ".title-primary", ".title-forest", ".title-sub-buttons", ".title-footer"].map((sel) => q(sel)!);
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING, `${i}`).toBeTruthy();
    }
  });

  it("「はじめる」は、左に足あとのアイコンがある主役のボタン", () => {
    const primary = q<HTMLButtonElement>("button.title-primary")!;
    expect(primary.querySelector("svg")).not.toBeNull();
    expect(primary.textContent).toBe("はじめる");
    act(() => primary.click());
    expect(useNavigationStore.getState().screen.name).toBe("areaSelect");
  });

  it("コトの後ろに光の輪、足元に影がある(飾り。静止していて、動かさない)", () => {
    const koto = q(".title-koto")!;
    expect(koto.querySelector(".title-koto-glow")?.getAttribute("aria-hidden")).toBe("true");
    expect(koto.querySelector(".title-koto-shadow")?.getAttribute("aria-hidden")).toBe("true");
    const block = css.slice(css.indexOf("\n.title-koto {"), css.indexOf("\n.title-status {"));
    expect(block).not.toMatch(/animation|@keyframes/);
  });

  it("「もどる」「はじめる」以外の、プライバシーポリシーの入口は、これまでどおり、グリッドの下にある", () => {
    const privacy = q<HTMLButtonElement>("button.title-privacy")!;
    const grid = q(".title-sub-buttons")!;
    expect(grid.compareDocumentPosition(privacy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(privacy.textContent?.trim()).toBe("プライバシーポリシー");
  });
});

describe("ホーム画面 → 最初の画面 → ホーム画面(アプリ全体)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    window.scrollTo = () => {};
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    useSettingsStore.setState({ audioUnlocked: true, muted: false });
    useReviewStore.setState({ starredQuestionIds: [] });
    useNavigationStore.setState({ screen: { name: "title" }, splashOpen: false });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<App />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  const click = (selector: string) => act(() => container.querySelector<HTMLButtonElement>(selector)!.click());

  it("戻るボタンで、最初の「タッチして はじめる」画面へ。タップすると、ホーム画面へ戻る(音声は解禁したまま)", () => {
    expect(container.querySelector(".title-primary")).not.toBeNull();
    click("button.title-back");
    expect(container.querySelector(".tap-to-start")).not.toBeNull();
    expect(container.querySelector(".title-primary")).toBeNull();
    expect(useSettingsStore.getState().audioUnlocked).toBe(true);

    click("button.tap-to-start");
    expect(container.querySelector(".tap-to-start")).toBeNull();
    expect(container.querySelector(".title-primary")).not.toBeNull();
    expect(useNavigationStore.getState().splashOpen).toBe(false);
    expect(useSettingsStore.getState().audioUnlocked).toBe(true);
  });

  it("戻ってきた最初の画面は、星(苦手問題)があれば、手を振るコトではなく、これまでの表情のコトを出す", () => {
    act(() => useReviewStore.setState({ starredQuestionIds: ["a"] }));
    click("button.title-back");
    expect(container.querySelector(".splash-koto-wave")).toBeNull();
    expect(container.querySelector(".splash-koto-mascot")).not.toBeNull();
  });

  it("最初の画面のクレジット・プライバシーポリシーの入口からも、ふつうに進める(最初の画面が残らない)", () => {
    click("button.title-back");
    click("button.splash-privacy");
    expect(useNavigationStore.getState().splashOpen).toBe(false);
    expect(container.querySelector(".policy")).not.toBeNull();
  });

  it("戻る操作は、ブラウザの履歴を増やさない(ブラウザの戻る操作と干渉しない)", () => {
    const before = window.history.length;
    click("button.title-back");
    click("button.tap-to-start");
    expect(window.history.length).toBe(before);
  });
});
