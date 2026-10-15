import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useSettingsStore } from "@/app/store/settingsStore";

const reset = vi.hoisted(() => ({
  resetAllData: vi.fn(async () => ({ removedKeys: [], ranking: "not-joined" as const })),
  reloadApp: vi.fn(),
}));
vi.mock("@/features/settings/resetData", () => reset);

import { SettingsScreen } from "./SettingsScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("設定画面: データの初期化", () => {
  let container: HTMLDivElement;
  let root: Root;
  const buttons = () => [...container.querySelectorAll("button")];
  const byText = (text: string) => buttons().find((b) => b.textContent?.includes(text));

  beforeEach(() => {
    reset.resetAllData.mockClear();
    reset.reloadApp.mockClear();
    useNavigationStore.setState({ screen: { name: "settings" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<SettingsScreen />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("「データを初期化する」を押しただけでは消さない。確認が出る", () => {
    act(() => byText("データを初期化")!.click());
    expect(container.querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(reset.resetAllData).not.toHaveBeenCalled();
  });

  it("確認で「いいえ」を押すと、何も消さずにもとへ戻る", () => {
    act(() => byText("データを初期化")!.click());
    act(() => byText("いいえ")!.click());
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
    expect(reset.resetAllData).not.toHaveBeenCalled();
    expect(reset.reloadApp).not.toHaveBeenCalled();
  });

  it("確認は「本当に初期化しますか?」+「はい/いいえ」。「はい」を押すと、データを消して、画面を読み込み直す", async () => {
    act(() => byText("データを初期化")!.click());
    expect(container.querySelector(".reset-question")?.textContent).toContain("本当に初期化");
    await act(async () => {
      container.querySelector<HTMLButtonElement>(".quit-yes")!.click();
    });
    expect(reset.resetAllData).toHaveBeenCalledTimes(1);
    expect(reset.reloadApp).toHaveBeenCalledTimes(1);
  });
});

describe("設定画面: もじの おおきさ(アクセシビリティ)", () => {
  it("小・標準・大の3択があり、選ぶと設定に保存される。既定は標準", async () => {
    const { useSettingsStore } = await import("@/app/store/settingsStore");
    useSettingsStore.setState({ textSize: "standard" });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<SettingsScreen />));

    const group = container.querySelector('[role="radiogroup"]')!;
    const buttons = [...group.querySelectorAll<HTMLButtonElement>("button")];
    expect(buttons.map((b) => b.textContent)).toEqual(["小", "標準", "大"]);
    expect(buttons.find((b) => b.textContent === "標準")!.getAttribute("aria-checked")).toBe("true");

    act(() => buttons.find((b) => b.textContent === "大")!.click());
    expect(useSettingsStore.getState().textSize).toBe("large");
    expect(buttons.find((b) => b.textContent === "大")!.getAttribute("aria-checked")).toBe("true");
    expect(buttons.find((b) => b.textContent === "標準")!.getAttribute("aria-checked")).toBe("false");

    act(() => root.unmount());
    container.remove();
  });
});

describe("設定画面: 音のログのコピー(調査用の隠しボタン)", () => {
  let container: HTMLDivElement;
  let root: Root;
  const renderScreen = () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<SettingsScreen />));
  };
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.history.replaceState({}, "", "/");
  });

  it("ふだんは、音のログのボタンは出ない", () => {
    renderScreen();
    expect(container.querySelector(".audio-debug-copy")).toBeNull();
  });

  it("URLに ?audiodebug=1 があるときだけ、音のログをコピーするボタンが出る", () => {
    window.history.replaceState({}, "", "/?audiodebug=1");
    renderScreen();
    expect(container.querySelector(".audio-debug-copy")?.textContent).toContain("音のログ");
  });
});

describe("設定画面: 見出しで分けた並び(おと・つかいかた・ひきつぎコード・このアプリについて)", () => {
  let container: HTMLDivElement;
  let root: Root;
  const text = (e: Element) => (e.textContent ?? "").replace(/\s+/g, "");
  const button = (label: string) => [...container.querySelectorAll("button")].find((b) => text(b) === label)!;

  beforeEach(() => {
    useNavigationStore.setState({ screen: { name: "settings" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<SettingsScreen />));
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("見出しが、上から順に5つ(もじの おおきさ・おと・つかいかた・ひきつぎコード・このアプリについて)。初期化は、いちばん下", () => {
    const heads = [...container.querySelectorAll(".settings-heading")].map((h) => text(h));
    expect(heads).toEqual(["もじのおおきさ", "おと", "つかいかた", "ひきつぎコードきしゅへんこうのとき", "このアプリについて"]);
    const screen = container.querySelector(".screen-settings")!;
    expect(screen.lastElementChild!.classList.contains("settings-reset")).toBe(true);
  });

  it("おと: スライダー2つ(BGM・こうかおん)、「ためす」は、こうかおんのスライダーと同じ行、ミュートはスイッチ", () => {
    const sliders = container.querySelectorAll('input[type="range"]');
    expect(sliders).toHaveLength(2);
    const seRow = container.querySelector(".settings-slider-row")!;
    expect(seRow.querySelector('input[type="range"]')).not.toBeNull();
    expect(text(seRow.querySelector("button")!)).toBe("ためす");
    const sw = container.querySelector<HTMLInputElement>('input[role="switch"]')!;
    expect(sw.type).toBe("checkbox");
    expect(sw.closest("label")!.textContent).toContain("ミュート"); // ラベルごと、行ぜんたいが押せる
  });

  it("つかいかた・ひきつぎコード: 横に2つずつ並べるボタン(あそびかた/そうさの せつめい、つくる/いれる)", () => {
    const pairs = [...container.querySelectorAll(".settings-pair")].map((p) => [...p.querySelectorAll("button")].map(text));
    expect(pairs).toEqual([
      ["あそびかた", "そうさのせつめい"],
      ["つくる", "いれる"],
    ]);
    // ふりがな(rt)をのぞいた文字が、1行の説明になっている
    const note = container.querySelector(".settings-note-line")!.cloneNode(true) as HTMLElement;
    note.querySelectorAll("rt").forEach((rt) => rt.remove());
    expect(text(note)).toBe("古い端末で「つくる」→新しい端末で「いれる」");
  });

  it("このアプリについて: プライバシーポリシー・くわしい出典・クレジット・お問い合わせの4行(縦)と、バージョン表記", () => {
    const rows = [...container.querySelectorAll(".settings-links > *")];
    expect(rows.map((r) => text(r).replace("(新しいタブで、お問い合わせフォームを開きます)", ""))).toEqual(["プライバシーポリシー", "くわしい出典", "クレジット", "お問い合わせ"]);
    expect(rows[3].tagName).toBe("A"); // お問い合わせは、外のサイトへのリンク
    expect(container.querySelector(".settings-version")!.textContent).toMatch(/^v\d/);
  });

  it("クレジット・くわしい出典・プライバシーポリシーは、設定から開いて、もどると設定に戻る", () => {
    act(() => button("クレジット").click());
    expect(useNavigationStore.getState().screen).toEqual({ name: "credits", next: { name: "settings" } });
    act(() => button("くわしい出典").click());
    expect(useNavigationStore.getState().screen).toEqual({ name: "sources", next: { name: "settings" } });
    act(() => button("プライバシーポリシー").click());
    expect(useNavigationStore.getState().screen).toEqual({ name: "privacy", next: { name: "settings" } });
  });

  it("ミュートのスイッチで、ミュートが切り替わる", () => {
    const sw = container.querySelector<HTMLInputElement>('input[role="switch"]')!;
    const before = useSettingsStore.getState().muted;
    act(() => sw.click());
    expect(useSettingsStore.getState().muted).toBe(!before);
    act(() => sw.click());
    expect(useSettingsStore.getState().muted).toBe(before);
  });
});
