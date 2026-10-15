import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assetCredits } from "@/data/credits";
import { COURSE_PROOF_TEXT } from "@/data/courseProof";
import { buildSourceGroups, requiredCredits, splitUrlCell } from "@/data/sources";
import { useNavigationStore } from "@/app/store/navigationStore";
import { CreditsScreen } from "./CreditsScreen";
import { SourcesScreen } from "./SourcesScreen";
import { TitleScreen } from "./TitleScreen";
import { TapToStart } from "@/components/TapToStart";
import { HowToScreen } from "./HowToScreen";
import { SettingsScreen } from "./SettingsScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SPOILERS = ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"];
const css = readFileSync("src/styles/global.css", "utf-8");
window.scrollTo = () => {};

describe("講義の自作証明「情報通信技術活用論 2026」", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("文字列は、全角・半角の表記を含めて、指定どおり", () => {
    expect(COURSE_PROOF_TEXT).toBe("情報通信技術活用論 2026");
  });

  it("ホーム画面・最初の画面・クレジットの末尾・くわしい出典の末尾に出る(ふりがなは付けない)", () => {
    const noRuby = (el: Element) => expect(el.querySelector("ruby")).toBeNull();
    act(() => root.render(<TitleScreen />));
    const home = container.querySelector(".title-proof")!;
    expect(home.textContent).toBe(COURSE_PROOF_TEXT);
    noRuby(home);

    act(() => root.render(<TapToStart />));
    expect(container.querySelector(".splash-proof")!.textContent).toBe(COURSE_PROOF_TEXT);

    act(() => root.render(<CreditsScreen next={{ name: "title" }} />));
    const credits = container.querySelector(".screen-credits")!;
    expect(credits.lastElementChild!.textContent).toBe(COURSE_PROOF_TEXT);

    act(() => root.render(<SourcesScreen next={{ name: "title" }} />));
    expect(container.querySelector(".screen-sources")!.lastElementChild!.textContent).toBe(COURSE_PROOF_TEXT);
    // 「ひらく」を押した後も、ページの最後にある
    act(() => (container.querySelector(".sources-open") as HTMLButtonElement).click());
    expect(container.querySelector(".screen-sources")!.lastElementChild!.textContent).toBe(COURSE_PROOF_TEXT);
  });

  it("文字の大きさは12px(0.75rem)以上で、タップを受けない(他のUIの邪魔をしない)", () => {
    const rule = css.match(/\n\.course-proof \{([^}]*)\}/)![1];
    expect(rule).toMatch(/font-size: 0\.75rem;/);
    expect(rule).toMatch(/pointer-events: none;/);
  });
});

describe("くわしい出典ページ", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useNavigationStore.setState({ screen: { name: "title" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("クレジット画面から開ける。もどると、元のクレジット画面に戻る", () => {
    act(() => root.render(<CreditsScreen next={{ name: "title" }} />));
    const link = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("くわしい出典"))!;
    expect(link).toBeDefined();
    act(() => link.click());
    const screen = useNavigationStore.getState().screen;
    expect(screen.name).toBe("sources");
    if (screen.name !== "sources") return;
    expect(screen.next).toEqual({ name: "credits", next: { name: "title" }, areaId: undefined, ending: undefined });
  });

  it("最初は警告だけで、「ひらく」を押すまで、曲名・素材名・URLの一覧を見せない(ネタバレになりうるため)", () => {
    act(() => root.render(<SourcesScreen next={{ name: "title" }} />));
    const before = container.textContent ?? "";
    expect(before).toContain("くわしい出典");
    // ふりがな(rt)を除いた文字が、指定の文言どおり
    const clone = container.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("rt").forEach((n) => n.remove());
    expect(clone.textContent).toContain("ストーリーのネタバレを含みます。クリア後に見ることをおすすめします");
    expect(container.querySelector(".sources-warning")).not.toBeNull();
    expect(container.querySelector(".sources-item")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    for (const c of assetCredits) expect(before, c.name).not.toContain(c.name);
    for (const word of SPOILERS) expect(before, word).not.toContain(word);
    // 画面の読み上げ(aria)にも、ネタバレの語がない
    for (const el of container.querySelectorAll("[aria-label],[alt],[title]")) {
      const text = `${el.getAttribute("aria-label") ?? ""}${el.getAttribute("alt") ?? ""}${el.getAttribute("title") ?? ""}`;
      for (const word of SPOILERS) expect(text, word).not.toContain(word);
    }
  });

  it("「ひらく」を押すと、台帳の全素材が、区分ごとに出る。入手元URLはリンクで、外のサイトは新しいタブで開く", () => {
    act(() => root.render(<SourcesScreen next={{ name: "title" }} />));
    act(() => (container.querySelector(".sources-open") as HTMLButtonElement).click());
    expect(container.querySelector(".sources-open")).toBeNull();
    const headings = [...container.querySelectorAll(".sources-section h3")].map((h) => h.textContent);
    expect(headings).toEqual(expect.arrayContaining(["BGM(音楽)", "こうかおん", "がぞう(と、画像をつくったAI)", "フォント", "アイコン・ライブラリ"]));
    const text = container.textContent ?? "";
    const shown = assetCredits.filter((c) => ["BGM", "SE", "画像", "生成AIモデル", "フォント", "ライブラリ"].includes(c.kind));
    expect(shown.length).toBe(assetCredits.length);
    for (const c of shown) expect(text, c.name).toContain(c.name);
    expect(text).toContain("Hareno");
    const hrefs = [...container.querySelectorAll<HTMLAnchorElement>("a.sources-link")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("https://youtu.be/AdWxKyHYQM0");
    expect(hrefs).toContain("https://youtu.be/CGjkJKXqgHY");
    for (const a of container.querySelectorAll("a.sources-link")) {
      expect(a.getAttribute("target")).toBe("_blank");
      expect(a.getAttribute("rel")).toContain("noopener");
    }
    // 見つからなかったものは、「要確認」と明記している
    expect(text).toContain("要確認");
  });

  it("表記が必要な素材(ポケットサウンド・CC BY の曲)が、指定の書式で、先頭に出る", () => {
    act(() => root.render(<SourcesScreen next={{ name: "title" }} />));
    act(() => (container.querySelector(".sources-open") as HTMLButtonElement).click());
    const first = container.querySelector(".sources-required-list")!.textContent ?? "";
    expect(first).toContain("効果音：ポケットサウンド – https://pocket-se.info/");
    expect(first).toContain("CC BY 4.0");
    expect(requiredCredits.length).toBe(2);
  });

  it("リンクは、タップできる大きさ(高さ44px以上)で、ボタンは3rem以上", () => {
    expect(css).toMatch(/\.sources-link \{[^}]*min-height: 44px;/);
    expect(css).toMatch(/\.sources-open \{[^}]*min-height: 3rem;/);
    expect(css).toMatch(/\.credits-sources-link \{[^}]*min-height: 3rem;/);
  });

  it("URL欄の分け方: URLと補足を分ける。「要確認」だけの欄は、URLなし", () => {
    expect(splitUrlCell("https://example.com/a (補足)")).toEqual({ urls: ["https://example.com/a"], note: "補足" });
    expect(splitUrlCell("https://a.example/ https://b.example/x")).toEqual({ urls: ["https://a.example/", "https://b.example/x"], note: "" });
    expect(splitUrlCell("要確認")).toEqual({ urls: [], note: "要確認" });
    expect(splitUrlCell("なし(自作)")).toEqual({ urls: [], note: "なし(自作)" });
  });

  it("区分の並び: BGM → こうかおん → がぞう → フォント → ライブラリ", () => {
    expect(buildSourceGroups(assetCredits).map((g) => g.id)).toEqual(["bgm", "se", "image", "font", "library"]);
  });

  it("設定の「くわしい出典」から開ける。もどると設定に戻る", () => {
    useNavigationStore.setState({ screen: { name: "settings" } });
    act(() => root.render(<SettingsScreen />));
    const button = [...container.querySelectorAll("button")].find((b) => b.textContent?.trim() === "くわしい出典")!;
    expect(button).toBeDefined();
    act(() => button.click());
    expect(useNavigationStore.getState().screen).toEqual({ name: "sources", next: { name: "settings" } });
  });

  it("あそびかたの最後のカードに、出典・クレジットの案内の1文と、くわしい出典へのボタンがある。もどるとあそびかたに戻る", () => {
    useNavigationStore.setState({ screen: { name: "howto" } });
    act(() => root.render(<HowToScreen />));
    const cards = [...container.querySelectorAll(".howto-card")];
    const last = cards[cards.length - 1];
    const clone = last.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("rt").forEach((n) => n.remove());
    expect(clone.querySelector(".howto-action-note")!.textContent).toBe("出典・クレジットは、設定から見られます。");
    // 最後のカードだけにある
    expect(container.querySelectorAll(".howto-action")).toHaveLength(1);
    act(() => (last.querySelector(".howto-action-button") as HTMLButtonElement).click());
    expect(useNavigationStore.getState().screen).toEqual({ name: "sources", next: { name: "howto" } });
  });

  it("ホーム画面・最初の画面には、くわしい出典へのボタンを足さない", () => {
    act(() => root.render(<TitleScreen />));
    expect([...container.querySelectorAll("button")].some((b) => b.textContent?.includes("くわしい出典"))).toBe(false);
    act(() => root.render(<TapToStart />));
    expect([...container.querySelectorAll("button")].some((b) => b.textContent?.includes("くわしい出典"))).toBe(false);
  });
});
