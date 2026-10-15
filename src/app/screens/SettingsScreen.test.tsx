import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { AUDIO_DEBUG_FULL_KEY, AUDIO_DEBUG_KEY, AUDIO_EXPERIMENT_KEYS, isExperimentOn, getAudioDebugEntries, isAudioDebugEnabled, logAudioDebug, resetAudioDebugForTest } from "@/lib/audioDebug";
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

describe("設定画面: 音のログ(調査用。ふだんは見えない)", () => {
  let container: HTMLDivElement;
  let root: Root;
  const renderScreen = () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<SettingsScreen />));
  };
  const panel = () => container.querySelector(".audio-debug-panel");
  const version = () => container.querySelector<HTMLElement>(".settings-version")!;
  const sw = () => panel()!.querySelector<HTMLInputElement>('input[role="switch"]')!;

  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    resetAudioDebugForTest();
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.history.replaceState({}, "", "/");
    resetAudioDebugForTest();
    vi.useRealTimers();
  });

  it("ふだんは、音のログの項目は出ない", () => {
    renderScreen();
    expect(panel()).toBeNull();
    expect(container.textContent).not.toContain("音のログ");
  });

  it("URLに ?audiodebug=1 を付けて開いたあと、音のログの項目(スイッチ・いま高い・コピー・クリア)が出る", () => {
    window.history.replaceState({}, "", "/?audiodebug=1");
    renderScreen();
    expect(panel()).not.toBeNull();
    expect(sw()).not.toBeNull();
    expect([...panel()!.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["いま高い", "コピー", "クリア"]);
  });

  it("URLなしで開き直しても(保存されているので)出る。スイッチを切っても、その場では消えず、読み込み直すと、また見えなくなる", () => {
    window.history.replaceState({}, "", "/?audiodebug=1");
    renderScreen();
    act(() => root.unmount());
    container.remove();
    // ホーム画面から起動(URLにパラメータなし。端末に保存された設定だけが残る)
    const saved = window.localStorage.getItem(AUDIO_DEBUG_KEY)!;
    resetAudioDebugForTest();
    window.localStorage.setItem(AUDIO_DEBUG_KEY, saved);
    window.history.replaceState({}, "", "/");
    renderScreen();
    expect(panel()).not.toBeNull();
    act(() => sw().click());
    expect(panel()).not.toBeNull();
    expect(isAudioDebugEnabled()).toBe(false);
    act(() => root.unmount());
    container.remove();
    resetAudioDebugForTest();
    renderScreen();
    expect(panel()).toBeNull();
  });

  it("バージョン表記を5回続けてタップすると、項目が出る(4回では出ない)。まだ、ログは、とっていない", () => {
    vi.useFakeTimers();
    renderScreen();
    for (let i = 0; i < 4; i++) act(() => version().click());
    expect(panel()).toBeNull();
    act(() => version().click());
    expect(panel()).not.toBeNull();
    expect(isAudioDebugEnabled()).toBe(false);
    expect(sw().checked).toBe(false);
    // 切れているあいだは、コピー・クリアは押せない
    expect([...panel()!.querySelectorAll("button")].every((b) => b.disabled)).toBe(true);
  });

  it("タップの間があくと(2秒より長く)、回数を数え直す", () => {
    vi.useFakeTimers();
    renderScreen();
    for (let i = 0; i < 3; i++) act(() => version().click());
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    for (let i = 0; i < 2; i++) act(() => version().click());
    expect(panel()).toBeNull(); // 3回+2回は、続けて5回ではない
    for (let i = 0; i < 3; i++) act(() => version().click());
    expect(panel()).not.toBeNull();
  });

  it("スイッチを入れると、ログをとり始める(保存される)。クリアで記録だけ空になり、切ると、記録が空になる", () => {
    vi.useFakeTimers();
    renderScreen();
    for (let i = 0; i < 5; i++) act(() => version().click());
    act(() => sw().click());
    expect(isAudioDebugEnabled()).toBe(true);
    expect(window.localStorage.getItem(AUDIO_DEBUG_KEY)).toBe("1");
    logAudioDebug("mark");
    expect(getAudioDebugEntries().length).toBeGreaterThan(0);
    const clear = [...panel()!.querySelectorAll("button")].find((b) => b.textContent === "クリア")!;
    act(() => clear.click());
    expect(getAudioDebugEntries()).toHaveLength(0);
    expect(isAudioDebugEnabled()).toBe(true);
    logAudioDebug("mark2");
    act(() => sw().click());
    expect(isAudioDebugEnabled()).toBe(false);
    expect(getAudioDebugEntries()).toHaveLength(0);
  });

  it("「いま高い」ボタンは、ログが有効なときだけ出る。押すと MARK の行が記録されて、「きろくしました」と出る", () => {
    vi.useFakeTimers();
    renderScreen();
    for (let i = 0; i < 5; i++) act(() => version().click()); // 項目は出るが、まだログは切れている
    const mark = () => panel()!.querySelector<HTMLButtonElement>(".audio-debug-mark");
    expect(mark()).toBeNull();
    act(() => sw().click());
    expect(mark()).not.toBeNull();
    expect(mark()!.textContent).toBe("いま高い");
    act(() => mark()!.click());
    expect(getAudioDebugEntries().some((e) => e.event === "MARK")).toBe(true);
    expect(panel()!.textContent).toContain("きろくしました");
    // ログを切ると、ボタンは消える
    act(() => sw().click());
    expect(mark()).toBeNull();
  });

  it("「ぜんぶ きろく」のスイッチ: ログが切れているあいだは押せない。入れると、保存される", () => {
    window.history.replaceState({}, "", "/?audiodebug=1");
    renderScreen();
    const full = () => [...panel()!.querySelectorAll<HTMLInputElement>('input[role="switch"]')][1];
    expect(full().closest("label")!.textContent).toContain("ぜんぶ きろく");
    expect(full().disabled).toBe(false);
    act(() => full().click());
    expect(full().checked).toBe(true);
    expect(window.localStorage.getItem(AUDIO_DEBUG_FULL_KEY)).toBe("1");
    act(() => sw().click()); // ログを切る
    expect(full().disabled).toBe(true);
  });

  it("実験のスイッチ A・B は、ログが有効なときだけ出る。入れると保存される(ふだんはオフ)", () => {
    vi.useFakeTimers();
    renderScreen();
    for (let i = 0; i < 5; i++) act(() => version().click());
    const switches = () => [...panel()!.querySelectorAll<HTMLInputElement>('input[role="switch"]')];
    const labels = () => switches().map((x) => (x.closest("label")!.textContent ?? "").trim());
    expect(labels()).toEqual(["ログを とる", "ぜんぶ きろく(約2秒ごと)"]); // ログが切れているあいだは、A・B は出ない
    act(() => switches()[0].click());
    expect(labels()).toEqual(["ログを とる", "ぜんぶ きろく(約2秒ごと)", "A 復帰で作り直す", "B AudioBufferで再生"]);
    expect(switches()[2].checked).toBe(false);
    expect(switches()[3].checked).toBe(false);
    act(() => switches()[2].click());
    act(() => switches()[3].click());
    expect(window.localStorage.getItem(AUDIO_EXPERIMENT_KEYS.rebuild)).toBe("1");
    expect(window.localStorage.getItem(AUDIO_EXPERIMENT_KEYS.buffer)).toBe("1");
    expect(isExperimentOn("rebuild")).toBe(true);
    act(() => switches()[0].click()); // ログを切ると、A・B は出なくなり、働かない
    expect(labels()).toHaveLength(2);
    expect(isExperimentOn("buffer")).toBe(false);
  });

  it("コピーを押すと、記録のテキストがクリップボードに入り、件数が出る", async () => {
    window.history.replaceState({}, "", "/?audiodebug=1");
    renderScreen();
    logAudioDebug("playBgm", "title.mp3");
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const copy = [...panel()!.querySelectorAll("button")].find((b) => b.textContent === "コピー")!;
    await act(async () => copy.click());
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("playBgm");
    expect(panel()!.textContent).toMatch(/\d+件を コピーしました/);
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
