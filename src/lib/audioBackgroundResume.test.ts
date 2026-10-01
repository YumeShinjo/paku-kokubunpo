import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "@/app/store/settingsStore";
import { RESUME_FADE_SEC, RESUME_SETTLE_MS, playBgm, shutdownAudio, unlockPlayback } from "./audio";

/**
 * バックグラウンドから戻ったときの、BGMのピッチ異常(iOS実機の不具合)対策の再発防止テスト。
 * jsdom には本物の AudioContext がないので、最小限の偽物(FakeAudioContext)を用意して確かめる。
 * 実際に耳で聞こえるピッチのずれそのものは、この環境では確認できない(実機でのみ確認できる)。
 */

class FakeGainParam {
  value = 1;
  setValueAtTime = vi.fn((v: number) => {
    this.value = v;
  });
  cancelScheduledValues = vi.fn();
  setTargetAtTime = vi.fn((v: number) => {
    this.value = v;
  });
}

class FakeNode {
  connect(): FakeNode {
    return this;
  }
}

class FakeGain extends FakeNode {
  gain = new FakeGainParam();
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: "running" | "suspended" | "closed" = "running";
  currentTime = 0;
  destination = new FakeNode();
  sampleRate: number;
  private listeners: Record<string, Array<() => void>> = {};

  constructor(options?: { sampleRate?: number }) {
    this.sampleRate = options?.sampleRate ?? 48000;
    FakeAudioContext.instances.push(this);
  }
  addEventListener(type: string, cb: () => void) {
    (this.listeners[type] ??= []).push(cb);
  }
  removeEventListener() {}
  private fire(type: string) {
    for (const cb of this.listeners[type] ?? []) cb();
  }
  createMediaElementSource(): FakeNode {
    return new FakeNode();
  }
  createGain(): FakeGain {
    return new FakeGain();
  }
  resume() {
    this.state = "running";
    this.fire("statechange");
    return Promise.resolve();
  }
  suspend() {
    this.state = "suspended";
    this.fire("statechange");
    return Promise.resolve();
  }
  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

/** いま作られている FakeAudioContext の、生成された gain(BGM用)を取り出す */
function currentGain(): FakeGain {
  return (
    (global as unknown as { __lastGain?: FakeGain }).__lastGain ??
    (() => {
      throw new Error("gain not captured");
    })()
  );
}

describe("バックグラウンドから戻ったときのBGM(iOSのピッチ異常対策)", () => {
  beforeEach(() => {
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
    FakeAudioContext.instances = [];
    useSettingsStore.setState({ bgmVolume: 0.7, seVolume: 0.8, muted: false, audioUnlocked: false });
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    // createGain の戻り値(FakeGain)を、テストから直接のぞけるようにしておく
    vi.spyOn(FakeAudioContext.prototype, "createGain").mockImplementation(function (this: FakeAudioContext) {
      const gain = new FakeGain();
      (global as unknown as { __lastGain?: FakeGain }).__lastGain = gain;
      return gain;
    });
  });

  afterEach(() => {
    shutdownAudio(); // 次のテストへ、AudioContext・BGM要素などの状態を持ち越さない
    setVisibility("visible");
    vi.restoreAllMocks();
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    delete (global as unknown as { __lastGain?: FakeGain }).__lastGain;
  });

  it("AudioContext は、BGM素材のサンプルレート(44.1kHz)を明示して作る", () => {
    unlockPlayback();
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].sampleRate).toBe(44100);
  });

  it("バックグラウンドから戻ったとき、AudioContextが止まっていれば、いったん無音にしてから再開し、しばらくしてから音量を戻す(いきなり鳴らして、ピッチのずれを聞かせない)", () => {
    vi.useFakeTimers();
    unlockPlayback();
    playBgm("/assets/audio/bgm-resume.mp3");
    const ctx = FakeAudioContext.instances[0];
    const gain = currentGain();

    setVisibility("hidden");
    expect(ctx.state).toBe("suspended"); // haltPlayback で休ませてある

    setVisibility("visible");
    expect(gain.gain.value).toBe(0); // 再開の一瞬は、無音にしてある
    expect(ctx.state).toBe("running");

    vi.advanceTimersByTime(499);
    expect(gain.gain.value).toBe(0); // まだ戻さない
    vi.advanceTimersByTime(200);
    expect(gain.gain.setTargetAtTime).toHaveBeenCalled(); // 滑らかに、元の音量へ戻す(実機でのピッチのずれが体感3秒ほど続くのに合わせ、3秒かけて戻す)
    expect(gain.gain.value).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it("無音にする時間とフェードインの長さの合計が、実機で確認したピッチのずれの時間(体感3秒)を、余裕を持って覆う長さになっている", () => {
    expect(RESUME_SETTLE_MS + RESUME_FADE_SEC * 1000).toBeGreaterThanOrEqual(3500);
    expect(RESUME_SETTLE_MS).toBeLessThanOrEqual(700); // 無音の区間自体は短く保ち、「音が出ない」という違和感が出すぎないようにする
  });

  it("バックグラウンドに回っているあいだに、もう一度隠れても(戻る前に)、音量を戻す予約は残らない", () => {
    vi.useFakeTimers();
    unlockPlayback();
    playBgm("/assets/audio/bgm-resume2.mp3");
    const gain = currentGain();

    setVisibility("hidden");
    setVisibility("visible"); // 音量を戻す予約が入る
    setVisibility("hidden"); // すぐにまた隠れる(予約は取り消されるはず)

    vi.advanceTimersByTime(5000);
    expect(gain.gain.value).toBe(0); // 隠れたままなので、無音のまま(勝手に戻らない)

    vi.useRealTimers();
  });

  it("すでに動いている(バックグラウンドに回っていなかった)ときは、無音にしたりしない", () => {
    unlockPlayback();
    playBgm("/assets/audio/bgm-running.mp3");
    const gain = currentGain();
    gain.gain.value = 0.5;

    setVisibility("visible"); // hidden を経ていない(すでに visible → visible)
    expect(gain.gain.value).toBe(0.5); // 触っていない
  });

  it("ミュート中は、バックグラウンドから戻っても、何もしない(鳴らさない)", () => {
    unlockPlayback();
    playBgm("/assets/audio/bgm-muted-resume.mp3");
    useSettingsStore.getState().setMuted(true);
    const ctx = FakeAudioContext.instances[0];

    setVisibility("hidden");
    setVisibility("visible");
    expect(ctx.state).toBe("suspended"); // ミュート中は動かさない
  });

  it("音量の書き換え(ゲイン)は、目標が変わったときだけ。画面が変わる(曲は同じ)・文字の大きさなど音に関係ない設定の変更では、書き込まない", () => {
    unlockPlayback();
    playBgm("/assets/audio/bgm-gain.mp3");
    const gain = currentGain();
    gain.gain.setValueAtTime.mockClear();
    gain.gain.cancelScheduledValues.mockClear();
    gain.gain.setTargetAtTime.mockClear();
    const writes = () =>
      gain.gain.setValueAtTime.mock.calls.length + gain.gain.cancelScheduledValues.mock.calls.length + gain.gain.setTargetAtTime.mock.calls.length;

    playBgm("/assets/audio/bgm-gain.mp3"); // 同じ曲(画面が変わっても、曲が同じ)
    useSettingsStore.getState().setTextSize("large");
    useSettingsStore.getState().setSeVolume(0.5);
    useSettingsStore.getState().setTextSize("standard");
    expect(writes()).toBe(0);

    useSettingsStore.getState().setBgmVolume(0.3); // BGMの音量が変わったときは、書き込む
    expect(writes()).toBeGreaterThan(0);
    expect(gain.gain.value).toBeCloseTo(0.3 * 0.4, 5);
    gain.gain.setTargetAtTime.mockClear();
    gain.gain.setValueAtTime.mockClear();
    gain.gain.cancelScheduledValues.mockClear();
    useSettingsStore.getState().setBgmVolume(0.3); // 同じ値(変更なし)
    expect(writes()).toBe(0);
  });
});

