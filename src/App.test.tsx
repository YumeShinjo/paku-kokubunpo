import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import App from "./App";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** 起動直後は「タップしてはじめる」だけを出し、そのタップで音声を解禁してからタイトル画面を出す(9章) */
describe("App: タップしてはじめる", () => {
  let container: HTMLDivElement;
  let root: Root;

  const buttons = () => [...container.querySelectorAll("button")].map((b) => b.textContent?.trim() ?? "");

  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    useSettingsStore.setState({ audioUnlocked: false, muted: false });
    useNavigationStore.setState({ screen: { name: "title" } });
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

  it("解禁前は導入画面だけで、タイトル画面のボタン(はじめる・せってい等)は出ない", () => {
    expect(container.textContent).toContain("タップして はじめる");
    const names = buttons();
    expect(names.some((n) => n.includes("タップして"))).toBe(true);
    for (const title of ["はじめる", "せってい", "クレジット", "ことだまの書", "ランキング"]) {
      expect(names.includes(title), title).toBe(false);
    }
    expect(useSettingsStore.getState().audioUnlocked).toBe(false);
  });

  it("導入画面をタップすると、音声を解禁してからタイトル画面が出る", () => {
    const start = container.querySelector<HTMLButtonElement>("button.tap-to-start")!;
    act(() => start.click());
    expect(useSettingsStore.getState().audioUnlocked).toBe(true);
    expect(container.textContent).not.toContain("タップして はじめる");
    const names = buttons();
    for (const title of ["はじめる", "せってい", "クレジット"]) expect(names, title).toContain(title);
  });

  it("導入画面をタップしただけでは、押した場所のタイトルのボタンが反応しない(画面遷移しない)", () => {
    act(() => container.querySelector<HTMLButtonElement>("button.tap-to-start")!.click());
    expect(useNavigationStore.getState().screen.name).toBe("title");
  });
});
