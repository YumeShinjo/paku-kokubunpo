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

  describe("裏に回って戻る(イベントが重なっても、再生・ゲイン・resume は1回だけ)", () => {
    /** BGM用の要素(createMediaElementSource に渡されたもの)と、各メソッドの呼び出し回数 */
    function setup() {
      let element: HTMLAudioElement | undefined;
      const createSource = vi.spyOn(FakeAudioContext.prototype, "createMediaElementSource").mockImplementation(function (
        this: FakeAudioContext,
        el: unknown,
      ) {
        element = el as HTMLAudioElement;
        return new FakeNode();
      } as never);
      // 本物のブラウザと同じく、play() のあとは paused が false、pause() のあとは true になるようにする
      const setPaused = (el: HTMLMediaElement, value: boolean) => Object.defineProperty(el, "paused", { configurable: true, get: () => value });
      const play = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
        setPaused(this, false);
        return Promise.resolve();
      });
      const pause = vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) {
        setPaused(this, true);
      });
      return { createSource, play, pause, el: () => element! };
    }
    const firePageEvents = (...names: string[]) => names.forEach((n) => window.dispatchEvent(new Event(n)));

    it("裏に回ったときは、止める(pause)のは1回だけ。visibilitychange と pagehide が続けて来ても、2回目は何もしない", () => {
      const { pause } = setup();
      unlockPlayback();
      playBgm("/assets/audio/bgm-once.mp3");
      const ctx = FakeAudioContext.instances[0];
      const suspend = vi.spyOn(ctx, "suspend");
      pause.mockClear();

      setVisibility("hidden");
      firePageEvents("pagehide");
      setVisibility("hidden");
      expect(pause).toHaveBeenCalledTimes(1);
      expect(suspend).toHaveBeenCalledTimes(1);
    });

    it("戻ったとき、visibilitychange・pageshow が何回来ても、再開は1回だけ(再生・resume・ゲインの音量リセットが、増えない)", () => {
      vi.useFakeTimers();
      const { play } = setup();
      unlockPlayback();
      playBgm("/assets/audio/bgm-return.mp3");
      const ctx = FakeAudioContext.instances[0];
      const resume = vi.spyOn(ctx, "resume");
      const gain = currentGain();

      setVisibility("hidden");
      play.mockClear();
      resume.mockClear();
      gain.gain.setValueAtTime.mockClear();
      gain.gain.cancelScheduledValues.mockClear();

      setVisibility("visible");
      firePageEvents("pageshow", "pageshow");
      setVisibility("visible");
      expect(resume).toHaveBeenCalledTimes(1); // 止まっていたので、1回だけ
      expect(play).toHaveBeenCalledTimes(1);
      expect(gain.gain.setValueAtTime).toHaveBeenCalledTimes(1);
      expect(gain.gain.cancelScheduledValues).toHaveBeenCalledTimes(1); // 新しくかける前に、前の予約を取り消してある

      vi.advanceTimersByTime(RESUME_SETTLE_MS + 100);
      expect(gain.gain.setTargetAtTime).toHaveBeenCalledTimes(1); // フェードインも1回
      vi.advanceTimersByTime(10000);
      expect(gain.gain.setTargetAtTime).toHaveBeenCalledTimes(1);
      expect(play).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it("AudioContext がまだ動いていないあいだは、<audio> を再生しない。動き出したあとに、1回だけ再生する", () => {
      const { play } = setup();
      unlockPlayback();
      playBgm("/assets/audio/bgm-wait.mp3");
      const ctx = FakeAudioContext.instances[0];
      // resume() の完了を、あとから手で進める(iOSで、タップまで resume が終わらないときの再現)
      let finish: () => void = () => {};
      vi.spyOn(ctx, "resume").mockImplementation(() => {
        return new Promise<void>((resolve) => {
          finish = () => {
            ctx.state = "running";
            (ctx as unknown as { fire: (t: string) => void }).fire("statechange");
            resolve();
          };
        });
      });

      setVisibility("hidden");
      play.mockClear();
      setVisibility("visible");
      expect(ctx.state).toBe("suspended");
      expect(play).not.toHaveBeenCalled(); // 動いていないうちは、鳴らさない
      document.dispatchEvent(new Event("click")); // 画面のタップ(wake)でも、動いていなければ、鳴らさない
      playBgm("/assets/audio/bgm-wait-2.mp3"); // 待っているあいだに場面が変わっても、鳴らさない
      expect(play).not.toHaveBeenCalled();

      finish();
      expect(play).toHaveBeenCalledTimes(1); // 動き出したあとに、1回だけ
    });

    it("戻ったとき、同じ曲を最初から入れ替える(曲のURLを付け直す)。導入曲の途中なら導入曲、そうでなければくり返しの曲", () => {
      const { el } = setup();
      unlockPlayback();
      playBgm("/assets/audio/bgm-loop.mp3", "/assets/audio/bgm-intro.mp3");
      expect(el().src).toContain("bgm-intro.mp3");
      el().src = "about:blank"; // 状態が崩れた、と見立てる
      setVisibility("hidden");
      setVisibility("visible");
      expect(el().src).toContain("bgm-intro.mp3"); // 導入曲の途中だった
      el().dispatchEvent(new Event("ended")); // 導入曲が終わって、くり返しの曲へ
      expect(el().src).toContain("bgm-loop.mp3");
      el().src = "about:blank";
      setVisibility("hidden");
      setVisibility("visible");
      expect(el().src).toContain("bgm-loop.mp3");
    });

    it("createMediaElementSource は、BGMの要素に1回だけ(再生・画面の切り替え・裏から戻るで、何度呼ばれても、増えない)", () => {
      const { createSource } = setup();
      unlockPlayback();
      playBgm("/assets/audio/bgm-src-a.mp3");
      playBgm("/assets/audio/bgm-src-b.mp3");
      setVisibility("hidden");
      setVisibility("visible");
      unlockPlayback();
      expect(createSource).toHaveBeenCalledTimes(1);
    });

    it("createMediaElementSource が例外になっても、握りつぶして繰り返し呼ばない(試すのは1回だけ)", () => {
      const createSource = vi.spyOn(FakeAudioContext.prototype, "createMediaElementSource").mockImplementation(() => {
        throw new Error("InvalidStateError");
      });
      unlockPlayback();
      playBgm("/assets/audio/bgm-throw-a.mp3");
      playBgm("/assets/audio/bgm-throw-b.mp3");
      expect(createSource).toHaveBeenCalledTimes(1);
    });

    it("AudioContext は、1つだけ使い回す(裏に回って戻っても、新しく作らない)", () => {
      unlockPlayback();
      playBgm("/assets/audio/bgm-ctx.mp3");
      setVisibility("hidden");
      setVisibility("visible");
      setVisibility("hidden");
      setVisibility("visible");
      expect(FakeAudioContext.instances).toHaveLength(1);
    });

    it("ミュート中に裏から戻っても何も鳴らさず、ミュートを解除したときだけ鳴る(これまでの動き)", () => {
      const { play } = setup();
      unlockPlayback();
      playBgm("/assets/audio/bgm-mute-return.mp3");
      useSettingsStore.getState().setMuted(true);
      setVisibility("hidden");
      play.mockClear();
      setVisibility("visible");
      expect(play).not.toHaveBeenCalled();
      useSettingsStore.getState().setMuted(false);
      expect(play).toHaveBeenCalledTimes(1);
    });
  });
});
