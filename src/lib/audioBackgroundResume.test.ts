import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "@/app/store/settingsStore";
import { STABILIZE_MAX_WAIT_MS, playBgm, shutdownAudio, unlockPlayback } from "./audio";

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

  /** 見かけ上の時間を、rate 倍の速さで進める(vi の JS タイマーは実時間どおり、AudioContext.currentTime は rate 倍で進める)。rate=1 が「クロックが落ち着いている」状態 */
  function advance(ctx: FakeAudioContext, ms: number, rate: number) {
    // AudioContextの時計を先に進めてから、JSのタイマーを進める(ポーリングが発火した瞬間に、更新済みの値を読めるように)
    ctx.currentTime += (ms / 1000) * rate;
    vi.advanceTimersByTime(ms);
  }

  it("バックグラウンドから戻った直後は無音。AudioContextの時計が実際の時間からずれている(ピッチが変わって聞こえる)あいだは、無音のままにしておく", () => {
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

    // クロックが実際より1.4倍速く進んでいる(ピッチが高く聞こえている)あいだは、無音のまま
    for (let i = 0; i < 12; i++) {
      advance(ctx, 100, 1.4);
      expect(gain.gain.value, `${(i + 1) * 100}ms経過`).toBe(0);
    }

    vi.useRealTimers();
  });

  it("時計の進み方が、実際の時間と揃った(比率が1.0に近い)ことを、3回連続で確認できたら、短いフェードインで音量を戻す", () => {
    vi.useFakeTimers();
    unlockPlayback();
    playBgm("/assets/audio/bgm-resume-stable.mp3");
    const ctx = FakeAudioContext.instances[0];
    const gain = currentGain();

    setVisibility("hidden");
    setVisibility("visible");

    advance(ctx, 100, 1.4); // まだずれている
    advance(ctx, 100, 1.0); // 落ち着いた: 1回目
    expect(gain.gain.value).toBe(0);
    advance(ctx, 100, 1.0); // 2回目
    expect(gain.gain.setTargetAtTime).not.toHaveBeenCalled();
    expect(gain.gain.value).toBe(0);
    advance(ctx, 100, 1.0); // 3回目(連続) → ここで確定する
    expect(gain.gain.setTargetAtTime).toHaveBeenCalled();
    expect(gain.gain.value).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it("落ち着いたと思っても、また比率がずれたら、連続の判定はやり直す(1回だけの偶然で戻さない)", () => {
    vi.useFakeTimers();
    unlockPlayback();
    playBgm("/assets/audio/bgm-resume-flaky.mp3");
    const ctx = FakeAudioContext.instances[0];
    const gain = currentGain();

    setVisibility("hidden");
    setVisibility("visible");

    advance(ctx, 100, 1.0); // 1回目、安定して見える
    advance(ctx, 100, 1.0); // 2回目
    advance(ctx, 100, 1.4); // また、ずれた → 連続記録はリセットされる
    expect(gain.gain.value).toBe(0);
    advance(ctx, 100, 1.0);
    advance(ctx, 100, 1.0);
    expect(gain.gain.value).toBe(0); // ここまでで連続2回。まだ戻らない
    advance(ctx, 100, 1.0);
    expect(gain.gain.value).toBeGreaterThan(0); // 3回連続そろって、ようやく戻る

    vi.useRealTimers();
  });

  it("安全弁: 時計がいつまでも安定しない機種でも、上限の時間(4.5秒)が来たら、無音のままにせず、音量を戻す", () => {
    vi.useFakeTimers();
    unlockPlayback();
    playBgm("/assets/audio/bgm-resume-never.mp3");
    const ctx = FakeAudioContext.instances[0];
    const gain = currentGain();

    setVisibility("hidden");
    setVisibility("visible");

    const steps = STABILIZE_MAX_WAIT_MS / 100;
    for (let i = 0; i < steps - 1; i++) advance(ctx, 100, 1.5); // ずっとずれたまま
    expect(gain.gain.value).toBe(0);
    advance(ctx, 100, 1.5); // 上限(4.5秒)に達した
    expect(gain.gain.setTargetAtTime).toHaveBeenCalled();
    expect(gain.gain.value).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it("バックグラウンドに回っているあいだに、もう一度隠れても(安定を確かめている途中でも)、音量を戻す予約は残らない", () => {
    vi.useFakeTimers();
    unlockPlayback();
    playBgm("/assets/audio/bgm-resume2.mp3");
    const ctx = FakeAudioContext.instances[0];
    const gain = currentGain();

    setVisibility("hidden");
    setVisibility("visible"); // 安定待ちが始まる
    advance(ctx, 100, 1.0);
    setVisibility("hidden"); // すぐにまた隠れる(安定待ちは取り消されるはず)

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
});
