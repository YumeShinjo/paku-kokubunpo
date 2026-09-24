import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useToastStore } from "@/app/store/toastStore";
import { Toaster, TOAST_GAP_MS, TOAST_VISIBLE_MS } from "./Toaster";

const audio = vi.hoisted(() => ({
  playSe: vi.fn(),
  duckBgm: vi.fn(),
  seDurationMs: vi.fn(() => 3000), // 効果音は通知の表示(2.5秒)より少し長い
  seBusyRemainingMs: vi.fn(() => 0),
}));
vi.mock("@/lib/audio", () => audio);

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("Toaster(エリアクリアの通知)", () => {
  let container: HTMLDivElement;
  let root: Root;

  const text = () => container.querySelector(".toast")?.textContent ?? null;
  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    audio.playSe.mockClear();
    audio.seBusyRemainingMs.mockReturnValue(0);
    useToastStore.setState({ queue: [] });
    useNavigationStore.setState({ screen: { name: "stageSelect", areaId: "prologue" } });
    act(() => root.render(<Toaster />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it("マップ以外の画面(クリア画面など)にいるあいだは出さない。マップに戻ると出る", () => {
    useNavigationStore.setState({ screen: { name: "stage", areaId: "prologue", stageId: "prologue-stage2" } });
    act(() => useToastStore.getState().push("growth", "pageUnlock"));
    advance(5000);
    expect(text()).toBeNull();
    expect(audio.playSe).not.toHaveBeenCalled();
    act(() => useNavigationStore.setState({ screen: { name: "areaSelect" } }));
    expect(text()).toContain("せいちょうした!");
  });

  it("1つずつ順に出て、出る瞬間に対応する効果音が1回ずつ鳴る。重ならない", () => {
    act(() => useToastStore.getState().push("growth", "pageUnlock"));
    expect(text()).toContain("せいちょうした!");
    expect(audio.playSe).toHaveBeenCalledTimes(1);
    expect(audio.playSe).toHaveBeenLastCalledWith("growth");

    // 最初の通知の効果音(3秒)と表示が終わるまで、次は出ない
    advance(2999);
    expect(text()).toContain("せいちょうした!");
    expect(audio.playSe).toHaveBeenCalledTimes(1);

    advance(TOAST_GAP_MS + 1);
    expect(text()).toContain("ずかんが ふえたよ!");
    expect(audio.playSe).toHaveBeenCalledTimes(2);
    expect(audio.playSe).toHaveBeenLastCalledWith("pageUnlock");
  });

  it("2〜3秒で自動的に消え、消えたあとは何も残らない", () => {
    act(() => useToastStore.getState().push("growth"));
    expect(TOAST_VISIBLE_MS).toBeGreaterThanOrEqual(2000);
    expect(TOAST_VISIBLE_MS).toBeLessThanOrEqual(3000);
    advance(TOAST_VISIBLE_MS + 10);
    expect(container.querySelector(".toast.is-leaving")).not.toBeNull();
    advance(3000 + TOAST_GAP_MS);
    expect(text()).toBeNull();
  });

  it("操作をふさがない(通知の入れ物はポインターを受けない設定。role=status で読み上げ)", () => {
    act(() => useToastStore.getState().push("growth"));
    const area = container.querySelector(".toast-area");
    expect(area?.getAttribute("role")).toBe("status");
  });

  it("クリア音など演出の効果音が鳴っているあいだは、鳴り終わるのを待ってから出す", () => {
    audio.seBusyRemainingMs.mockReturnValue(4000);
    act(() => useToastStore.getState().push("growth"));
    expect(text()).toBeNull();
    audio.seBusyRemainingMs.mockReturnValue(0);
    advance(4100);
    expect(text()).toContain("せいちょうした!");
    expect(audio.playSe).toHaveBeenCalledTimes(1);
  });
});
