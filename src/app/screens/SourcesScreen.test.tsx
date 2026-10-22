import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assetCredits } from "@/data/credits";
import { COURSE_PROOF_TEXT } from "@/data/courseProof";
import { buildSourceGroups, splitUrlCell } from "@/data/sources";
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
    expect(headings).toEqual(["BGM", "効果音", "画像", "制作素材", "ソフトウェア"]);
    const text = container.textContent ?? "";
    const shown = assetCredits.filter((c) => ["BGM", "SE", "画像", "生成AIモデル", "制作素材", "フォント", "ライブラリ"].includes(c.kind));
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
    // 入手元が、ほかの行の参照(生成AIのイラスト)や自作の行は、「要確認」ではなく、その説明を出す。「要確認」と出る行は、ない(台帳に、入手元が未特定の行がないため)
    expect(text).toContain("入手元: 生成AIモデルの行を参照");
    expect(text).not.toContain("入手元: 要確認");
  });

  it("表記が必須の素材(ポケットサウンド・Prairie4・OtoLogic)だけに、小さな「表記必須」の印が付く。区分の見出し・説明の文章(「表記が必要・希望」など)は、ない", () => {
    act(() => root.render(<SourcesScreen next={{ name: "title" }} />));
    act(() => (container.querySelector(".sources-open") as HTMLButtonElement).click());
    const marked = [...container.querySelectorAll(".sources-item")].filter((li) => li.querySelector(".sources-badge"));
    expect(marked.map((li) => li.querySelector(".sources-name")!.textContent)).toEqual([expect.stringContaining("Prairie4"), "holy1", expect.stringContaining("オノマトペ キラキラ04")]);
    expect(container.querySelectorAll(".sources-badge")).toHaveLength(3);
    expect(container.querySelector(".sources-badge")!.textContent).toBe("表記必須");
    // ポケットサウンドの行の要点に、指定の書式がある。あかずきんポップの行にも、作者が希望する書式がある
    expect(container.textContent).toContain("効果音：ポケットサウンド – https://pocket-se.info/");
    expect(container.textContent).toContain("フォント：あかずきんポップ フリーダウンロード：https://flopdesign.booth.pm/items/1748058");
    // 説明の文章・必要/希望の区分は、出さない
    for (const text of ["表記が必要・希望", "このアプリで使った"]) expect(container.querySelector(".screen-sources")!.textContent, text).not.toContain(text);
    expect(container.querySelector(".sources-required-list")).toBeNull();
    expect(container.querySelector(".sources-lead")).toBeNull();
  });

  it("1つの素材の行には、名前・作者・入手元(リンク)・条件の要点(1行)の4つだけ。使った場所・ライセンスの長い説明は、出さない", () => {
    act(() => root.render(<SourcesScreen next={{ name: "title" }} />));
    act(() => (container.querySelector(".sources-open") as HTMLButtonElement).click());
    for (const item of container.querySelectorAll(".sources-item")) {
      expect(item.querySelectorAll(".sources-name"), item.textContent!).toHaveLength(1);
      expect(item.querySelectorAll(".sources-by")).toHaveLength(1);
      expect(item.querySelectorAll(".sources-links")).toHaveLength(1);
      expect(item.querySelectorAll(".sources-summary")).toHaveLength(1);
      expect(item.querySelector("dl"), "説明の定義リスト").toBeNull();
      expect(item.querySelector(".sources-summary")!.textContent!.length, item.textContent!).toBeGreaterThan(0);
    }
    // 要点は、ふつうの行(長い規約の全文ではない)。台帳の全素材に、要点がある
    for (const c of assetCredits) expect(c.summary.length, c.name).toBeGreaterThan(0);
    for (const c of assetCredits) expect(c.summary.length, c.name).toBeLessThanOrEqual(130);
  });

  it("独立した画面: 言の葉の森の部品・クラスの中に入っていない。もどるで、開いた元の画面へ戻る", () => {
    useNavigationStore.setState({ screen: { name: "sources", next: { name: "howto" } } });
    act(() => root.render(<SourcesScreen next={{ name: "howto" }} />));
    const screen = container.querySelector(".screen-sources")!;
    expect(screen.closest(".screen-kotonoha")).toBeNull();
    expect(screen.className).not.toContain("kotonoha");
    expect(screen.parentElement).toBe(container); // ほかの画面の中ではなく、画面そのもの
    act(() => (container.querySelector(".back-button") as HTMLButtonElement).click());
    expect(useNavigationStore.getState().screen).toEqual({ name: "howto" });
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

  it("入手元の説明がある行(生成AIのイラスト・自作)は「要確認」にしない。URLも説明もない行だけが要確認", () => {
    const image = buildSourceGroups(assetCredits).find((g) => g.id === "image")!;
    for (const item of image.items) {
      expect(item.urls, item.name).toEqual([]);
      expect(item.note, item.name).not.toBe("");
      expect(item.urlUnknown, item.name).toBe(false);
    }
    const unknown = buildSourceGroups([{ name: "x", kind: "SE", source: "s", license: "l", usage: "u", url: "", summary: "" }]);
    expect(unknown[0].items[0].urlUnknown).toBe(true);
  });

  it("区分の並び: BGM → 効果音 → 画像 → 制作素材 → ソフトウェア", () => {
    expect(buildSourceGroups(assetCredits).map((g) => g.id)).toEqual(["bgm", "se", "image", "material", "software"]);
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
