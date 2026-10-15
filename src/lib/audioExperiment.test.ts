import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "@/app/store/settingsStore";
import { getAudioDebugEntries, resetAudioDebugForTest, setAudioDebugEnabled, setAudioExperiment } from "./audioDebug";
import { playBgm, shutdownAudio, stopBgm, unlockPlayback } from "./audio";

/**
 * 実験A(復帰したら <audio> 要素を作り直す)と、実験B(BGMを AudioBuffer で鳴らす)。どちらも、デバッグ項目のスイッチをオンにしたときだけ動く。
 * スイッチがオフのとき(ふだん)は、今までと同じ再生であることも、確かめる。
 */
class FakeSource {
  buffer: unknown = null;
  loop = false;
  loopStart = 0;
  loopEnd = 0;
  onended: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  connect = vi.fn(() => ({ connect: vi.fn() })); // source.connect(gain).connect(destination) の形
  disconnect = vi.fn();
}

class FakeContext {
  static current: FakeContext;
  /** 作られたときの状態(タスクキルのあと、起動したばかりのときは、suspended) */
  static initialState = "running";
  /** resume() のふるまい: ok=running になる / stuck=成功するが、running にならない / reject=失敗する */
  static resumeBehavior: "ok" | "stuck" | "reject" = "ok";
  state = FakeContext.initialState;
  resumeBehavior = FakeContext.resumeBehavior;
  oscillators: Array<{ start: ReturnType<typeof vi.fn> }> = [];
  currentTime = 10;
  sampleRate = 44100;
  destination = {};
  listeners: Record<string, Array<() => void>> = {};
  gains: Array<{ gain: Record<string, unknown> }> = [];
  mediaSources: Array<{ connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = [];
  bufferSources: FakeSource[] = [];
  decodeCalls = 0;
  decodeDuration = 85.94;
  decodeFails = false;
  resume = vi.fn(async () => {
    if (this.resumeBehavior === "reject") throw new Error("NotAllowedError");
    if (this.resumeBehavior === "ok") this.set("running");
  });
  suspend = vi.fn(async () => {
    this.set("suspended");
  });
  close = vi.fn(async () => {});
  constructor() {
    FakeContext.current = this;
  }
  addEventListener(name: string, fn: () => void) {
    (this.listeners[name] ??= []).push(fn);
  }
  /** 状態を変えて、statechange を送る */
  set(state: string) {
    this.state = state;
    for (const fn of this.listeners.statechange ?? []) fn();
  }
  createGain() {
    const gain = {
      gain: { value: 1, setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn(), setTargetAtTime: vi.fn() },
      connect: vi.fn(() => ({ connect: vi.fn() })),
    };
    this.gains.push(gain);
    return gain;
  }
  createMediaElementSource() {
    const node = {
      connect: vi.fn((dest: unknown) => dest),
      disconnect: vi.fn(),
    };
    this.mediaSources.push(node);
    return node;
  }
  createOscillator() {
    const osc = {
      type: "sine",
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(() => ({ connect: vi.fn() })),
      start: vi.fn(),
      stop: vi.fn(),
    };
    this.oscillators.push(osc);
    return osc;
  }
  createBufferSource() {
    const source = new FakeSource();
    this.bufferSources.push(source);
    return source;
  }
  decodeAudioData = vi.fn(async () => {
    this.decodeCalls++;
    if (this.decodeFails) throw new Error("decode failed");
    return { duration: this.decodeDuration, length: Math.round(this.decodeDuration * 44100), sampleRate: 44100, numberOfChannels: 2 };
  });
}

const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const ctx = () => FakeContext.current;
const setVisibility = (value: "visible" | "hidden") => {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => value });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("音の実験A・B(デバッグ項目のスイッチ。ふだんはオフ)", () => {
  let played: Array<{ el: HTMLMediaElement; src: string }>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    FakeContext.initialState = "running";
    FakeContext.resumeBehavior = "ok";
    played = [];
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeContext;
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
      played.push({ el: this, src: this.getAttribute("src") ?? "" });
      return Promise.resolve();
    });
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(window.HTMLMediaElement.prototype, "load").mockImplementation(() => {});
    fetchMock = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
    vi.stubGlobal("fetch", fetchMock);
    useSettingsStore.setState({ bgmVolume: 0.7, seVolume: 0.8, muted: false, audioUnlocked: false });
    resetAudioDebugForTest(true); // 音のログは、有効(実験のスイッチは、オフ)
    setVisibility("visible");
  });

  afterEach(() => {
    shutdownAudio();
    resetAudioDebugForTest();
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** 解禁して(効果音の読み込みが終わるのを待ち、数え直してから)、曲を鳴らし始める */
  const unlock = async () => {
    unlockPlayback();
    await flush();
    fetchMock.mockClear();
    ctx().decodeAudioData.mockClear();
    ctx().decodeCalls = 0;
    ctx().bufferSources.length = 0;
  };
  const start = async (src = "/audio/bgm/title.mp3", intro?: string) => {
    await unlock();
    playBgm(src, intro);
  };
  const lastPlayed = () => played[played.length - 1];
  const interruptAndReturn = () => {
    ctx().set("interrupted");
    ctx().set("running");
  };

  describe("実験A: 復帰したら audio 要素を作り直す", () => {
    it("スイッチがオフ(ふだん): 中断から戻っても、要素は作り直さない(MediaElementSource は、最初の1つだけ)", async () => {
      await start();
      const first = lastPlayed().el;
      interruptAndReturn();
      expect(ctx().mediaSources).toHaveLength(1);
      expect(lastPlayed().el).toBe(first);
      expect(getAudioDebugEntries().some((e) => e.event === "rebuild")).toBe(false);
    });

    it("スイッチがオンでも、音のログが無効なあいだは、働かない", async () => {
      setAudioExperiment("rebuild", true);
      await start();
      setAudioDebugEnabled(false);
      interruptAndReturn();
      expect(ctx().mediaSources).toHaveLength(1);
    });

    it("スイッチがオン: interrupted → running で、古い要素と MediaElementSource を捨て、新しいものを、同じ GainNode につなぎ直し、頭から鳴らす", async () => {
      setAudioExperiment("rebuild", true);
      await start();
      const oldEl = lastPlayed().el as HTMLAudioElement;
      const gain = ctx().gains[0];
      interruptAndReturn();

      // 1. 古いものを捨てた
      expect(ctx().mediaSources[0].disconnect).toHaveBeenCalled();
      expect(oldEl.hasAttribute("src")).toBe(false);
      // 2. 新しい要素と MediaElementSource を、同じ GainNode につないだ(GainNode は、作り直していない)
      expect(ctx().mediaSources).toHaveLength(2);
      expect(ctx().mediaSources[1].connect).toHaveBeenCalledWith(gain);
      expect(ctx().gains).toHaveLength(1);
      // 3. 新しい要素で、同じ曲を、頭から鳴らした
      const now = lastPlayed();
      expect(now.el).not.toBe(oldEl);
      expect(now.src).toContain("title.mp3");
      expect((now.el as HTMLAudioElement).loop).toBe(true);
      // ログ
      const row = getAudioDebugEntries().find((e) => e.event === "rebuild");
      expect(row?.note).toMatch(/reason=interrupted→running old\(ready=0 net=\d paused=.* t=.*\) new\(ready=0 net=\d paused=.*\)/);
    });

    it("導入曲の途中で作り直したら、導入曲から入れ直し、終わったら、くり返しの曲へ移る", async () => {
      setAudioExperiment("rebuild", true);
      await start("/audio/bgm/explore.mp3", "/audio/bgm/explore-intro.mp3");
      interruptAndReturn();
      const intro = lastPlayed();
      expect(intro.src).toContain("explore-intro.mp3");
      expect((intro.el as HTMLAudioElement).loop).toBe(false);
      intro.el.dispatchEvent(new Event("ended")); // 導入曲が終わった
      expect(lastPlayed().src).toContain("explore.mp3");
      expect((lastPlayed().el as HTMLAudioElement).loop).toBe(true);
    });

    it("アプリが見える状態に戻って、audio の readyState が 0 のときも、作り直す(スイッチオンのときだけ)", async () => {
      await start();
      setVisibility("hidden");
      setVisibility("visible"); // スイッチがオフ: 作り直さない
      expect(ctx().mediaSources).toHaveLength(1);

      setAudioExperiment("rebuild", true);
      setVisibility("hidden");
      setVisibility("visible"); // jsdom の readyState は 0(中身が空)
      expect(ctx().mediaSources).toHaveLength(2);
      expect(getAudioDebugEntries().find((e) => e.event === "rebuild")?.note).toContain("visible, readyState=0");
    });

    it("readyState が 0 でなければ(中身がある)、見える状態に戻っても、作り直さない", async () => {
      setAudioExperiment("rebuild", true);
      await start();
      Object.defineProperty(lastPlayed().el, "readyState", { configurable: true, get: () => 4 });
      setVisibility("hidden");
      setVisibility("visible");
      expect(ctx().mediaSources).toHaveLength(1);
    });
  });

  describe("実験B: BGMを AudioBuffer で鳴らす", () => {
    it("スイッチがオフ(ふだん): fetch も decodeAudioData も AudioBufferSourceNode も使わず、<audio> で鳴らす", async () => {
      await start();
      await flush();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(ctx().decodeAudioData).not.toHaveBeenCalled();
      expect(ctx().bufferSources).toHaveLength(0);
      expect(lastPlayed().src).toContain("title.mp3");
    });

    it("スイッチがオン: 読み込み → デコード(1回)→ AudioBufferSourceNode(loop・loopStart=0・loopEnd=長さ)を GainNode につないで鳴らす。<audio> では鳴らさない", async () => {
      setAudioExperiment("buffer", true);
      await start();
      await flush();
      expect(fetchMock).toHaveBeenCalledWith("/audio/bgm/title.mp3");
      expect(ctx().decodeCalls).toBe(1);
      const source = ctx().bufferSources[0];
      expect(source.loop).toBe(true);
      expect(source.loopStart).toBe(0);
      expect(source.loopEnd).toBeCloseTo(85.94, 3);
      expect(source.connect).toHaveBeenCalledWith(ctx().gains[0]); // 音量は、いままでと同じ GainNode を通る
      expect(source.start).toHaveBeenCalledWith(0, 0);
      expect(played.some((p) => p.src.includes("title.mp3"))).toBe(false);
      // ログ: 曲の長さ・サンプル数・メモリ・ループの設定
      const loaded = getAudioDebugEntries().find((e) => e.event === "buffer-loaded");
      expect(loaded?.note).toMatch(/title\.mp3 dur=85\.94s len=3789954 sr=44100 ch=2 bytes=28\.9MB fetch=\d+ms decode=\d+ms/);
      expect(getAudioDebugEntries().find((e) => e.event === "buffer-start")?.note).toMatch(/loop=true loopStart=0 loopEnd=85\.94/);
    });

    it("曲を替えると、前の source を止めて、バッファを捨て、新しい曲を、1回だけデコードする(同時に1曲ぶん)", async () => {
      setAudioExperiment("buffer", true);
      await start();
      await flush();
      const first = ctx().bufferSources[0];
      playBgm("/audio/bgm/stage.mp3");
      await flush();
      expect(first.stop).toHaveBeenCalled();
      expect(ctx().decodeCalls).toBe(2);
      expect(ctx().bufferSources).toHaveLength(2);
      expect(ctx().bufferSources[1].start).toHaveBeenCalled();
    });

    it("曲を替えたとき、読み込み中だった前の曲は、鳴らさずに捨てる", async () => {
      setAudioExperiment("buffer", true);
      await unlock();
      playBgm("/audio/bgm/title.mp3");
      playBgm("/audio/bgm/stage.mp3"); // title の読み込みが終わる前に、替わった
      await flush();
      expect(ctx().bufferSources).toHaveLength(1); // 鳴らしたのは、stage だけ
      expect(getAudioDebugEntries().filter((e) => e.event === "buffer-start")).toHaveLength(1);
    });

    it("導入曲 → くり返しの曲: 導入曲は loop なしで鳴らし、終わったら、くり返しの曲を読み込んで、loop で鳴らす", async () => {
      setAudioExperiment("buffer", true);
      await start("/audio/bgm/explore.mp3", "/audio/bgm/explore-intro.mp3");
      await flush();
      const intro = ctx().bufferSources[0];
      expect(intro.loop).toBe(false);
      intro.onended?.(); // 導入曲が終わった
      await flush();
      const loop = ctx().bufferSources[1];
      expect(ctx().decodeCalls).toBe(2);
      expect(loop.loop).toBe(true);
      expect(loop.start).toHaveBeenCalled();
    });

    it("デコードに失敗したら、<audio> 方式に戻して、同じ曲を鳴らし、「fallback」をログに残す", async () => {
      setAudioExperiment("buffer", true);
      await unlock();
      FakeContext.current.decodeFails = true;
      playBgm("/audio/bgm/title.mp3");
      await flush();
      expect(lastPlayed().src).toContain("title.mp3");
      const row = getAudioDebugEntries().find((e) => e.event === "fallback");
      expect(row?.note).toMatch(/buffer→audio title\.mp3: decode failed/);
    });

    it("読み込み(fetch)に失敗したときも、<audio> 方式に戻る", async () => {
      setAudioExperiment("buffer", true);
      fetchMock.mockImplementation(async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) }));
      await start();
      await flush();
      expect(lastPlayed().src).toContain("title.mp3");
      expect(getAudioDebugEntries().some((e) => e.event === "fallback")).toBe(true);
    });

    it("ミュートで止めて、解除すると、止めた位置から続ける(新しい source を、その位置から始める)", async () => {
      setAudioExperiment("buffer", true);
      await start();
      await flush();
      const first = ctx().bufferSources[0];
      ctx().currentTime = 13; // 3秒たった
      useSettingsStore.getState().setMuted(true);
      expect(first.stop).toHaveBeenCalled();
      useSettingsStore.getState().setMuted(false);
      await flush();
      const second = ctx().bufferSources[1];
      expect(second.start).toHaveBeenCalledWith(0, 3);
    });

    it("裏に回って戻ったときは、頭から鳴らし直す(<audio> 方式と同じ)", async () => {
      setAudioExperiment("buffer", true);
      await start();
      await flush();
      ctx().currentTime = 14;
      setVisibility("hidden");
      expect(ctx().bufferSources[0].stop).toHaveBeenCalled();
      ctx().currentTime = 20;
      setVisibility("visible");
      await flush();
      const again = ctx().bufferSources[ctx().bufferSources.length - 1];
      expect(again.start).toHaveBeenCalledWith(0, 0);
    });

    it("stopBgm で止めて、バッファを捨てる。そのあとは、もう鳴らさない", async () => {
      setAudioExperiment("buffer", true);
      await start();
      await flush();
      stopBgm();
      expect(ctx().bufferSources[0].stop).toHaveBeenCalled();
      ctx().set("suspended");
      ctx().set("running");
      await flush();
      expect(ctx().bufferSources).toHaveLength(1);
    });

    it("鳴らしている最中にスイッチを切ると、同じ曲を、<audio> で頭から鳴らし直す。入れると、AudioBuffer で鳴らし直す", async () => {
      await start();
      await flush();
      expect(ctx().bufferSources).toHaveLength(0);
      setAudioExperiment("buffer", true); // <audio> → AudioBuffer
      await flush();
      expect(ctx().bufferSources).toHaveLength(1);
      played.length = 0;
      setAudioExperiment("buffer", false); // AudioBuffer → <audio>
      await flush();
      expect(ctx().bufferSources[0].stop).toHaveBeenCalled();
      expect(lastPlayed().src).toContain("title.mp3");
    });
  });
  describe("実験B: 起動直後(最初のタップ)から、BGMと効果音が鳴る", () => {
    /** fetch を、こちらの合図があるまで待たせる(読み込み・デコードに時間がかかる状態) */
    const delayFetch = () => {
      const releases: Array<() => void> = [];
      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            releases.push(() => resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
          }),
      );
      return () => releases.splice(0).forEach((release) => release());
    };
    const mockSession = (type = "auto") => {
      const session = { type };
      Object.defineProperty(navigator, "audioSession", { configurable: true, value: session });
      return session;
    };
    afterEach(() => {
      delete (navigator as unknown as { audioSession?: unknown }).audioSession;
    });
    const bgmSources = () => ctx().bufferSources.filter((x) => x.loop);

    it("AudioContext が suspended のまま起動 → 最初のタップで resume を(待たずに)呼び、BGMも効果音も鳴る(fetch・デコードが遅れていても)", async () => {
      FakeContext.initialState = "suspended";
      setAudioExperiment("buffer", true);
      const session = mockSession();
      const release = delayFetch();

      unlockPlayback(); // 最初のタップ。resume は、この呼び出しの中で、同期的に呼ばれる(await の前)
      expect(ctx().resume).toHaveBeenCalledTimes(1);
      expect(session.type).toBe("playback");
      playBgm("/audio/bgm/title.mp3");
      await flush();
      // 読み込みが終わるまでは、BGMは始まらないが、AudioContext は、もう動いている
      expect(ctx().state).toBe("running");
      expect(ctx().bufferSources).toHaveLength(0);

      release(); // 読み込み・デコードが終わった
      await flush();
      expect(bgmSources()).toHaveLength(1);
      expect(bgmSources()[0].start).toHaveBeenCalled();
      // 効果音(同じ AudioContext): ロック解除が済んでいるので、鳴る
      const before = ctx().bufferSources.length + ctx().oscillators.length;
      const { playSe } = await import("./audio");
      playSe("correct");
      expect(ctx().bufferSources.length + ctx().oscillators.length).toBe(before + 1);
      const started = [...ctx().bufferSources.filter((x) => !x.loop && x.start.mock.calls.length > 0), ...ctx().oscillators.filter((o) => o.start.mock.calls.length > 0)];
      expect(started.length).toBeGreaterThan(0);
      // 記録: 最初のタップの時点の状態と、BGMを始めた時点の状態
      const names = getAudioDebugEntries().map((e) => e.event);
      expect(names).toEqual(expect.arrayContaining(["unlock-tap", "audio-session", "buffer-loaded", "buffer-start"]));
      expect(getAudioDebugEntries().find((e) => e.event === "unlock-tap")?.note).toMatch(/^ctxState=suspended session=playback audioPaused=\S+ silentSwitch=n\/a/);
      expect(getAudioDebugEntries().find((e) => e.event === "buffer-start")?.note).toMatch(/ctxState=running session=playback audioPaused=\S+/);
    });

    it("Bがオンのとき、audioSession.type は playback。ミュートなら ambient、Bをオフにすると auto(ふだんと同じ)", async () => {
      const session = mockSession();
      setAudioExperiment("buffer", true);
      await unlock();
      expect(session.type).toBe("playback");
      useSettingsStore.getState().setMuted(true);
      expect(session.type).toBe("ambient");
      useSettingsStore.getState().setMuted(false);
      expect(session.type).toBe("playback");
      setAudioExperiment("buffer", false);
      expect(session.type).toBe("auto");
    });

    it("Bがオフ(ふだん): audioSession.type は auto。無音のループ(<audio>)も使わない", async () => {
      const session = mockSession();
      await start();
      expect(session.type).toBe("auto");
      expect(played.some((p) => p.src.startsWith("data:audio/wav") && p.src.length > 200)).toBe(false);
      expect(getAudioDebugEntries().some((e) => e.event === "unlock-tap" || e.event === "audio-session")).toBe(false);
    });

    it("Bがオンのあいだ、無音のデータの <audio> を鳴らし続ける(音声セッションを「メディア再生」に保つ)。曲は <audio> では鳴らさない", async () => {
      setAudioExperiment("buffer", true);
      await start();
      await flush();
      const silent = played.filter((p) => p.src.startsWith("data:audio/wav;base64,"));
      expect(silent.length).toBeGreaterThan(0);
      expect(lastPlayed().el.getAttribute("src")!.length).toBeGreaterThan(10000); // 1秒ぶんの無音(1サンプルではない)
      expect((lastPlayed().el as HTMLAudioElement).loop).toBe(true);
      expect(window.HTMLMediaElement.prototype.pause).not.toHaveBeenCalled();
      expect(played.some((p) => p.src.includes("title.mp3"))).toBe(false);
    });

    it("ミュートすると、無音の <audio> も止め、解除すると、また鳴らす(他のアプリの音を止めない・ふつうの方式と同じ)", async () => {
      setAudioExperiment("buffer", true);
      await start();
      await flush();
      const pause = window.HTMLMediaElement.prototype.pause as unknown as ReturnType<typeof vi.fn>;
      useSettingsStore.getState().setMuted(true);
      expect(pause).toHaveBeenCalled();
      played.length = 0;
      useSettingsStore.getState().setMuted(false);
      await flush();
      expect(played.some((p) => p.src.startsWith("data:audio/wav"))).toBe(true);
    });

    it("始めようとしたとき AudioContext が running でなければ、buffer-blocked を記録し、次のタップで resume してから始める", async () => {
      setAudioExperiment("buffer", true);
      await unlock();
      ctx().state = "suspended"; // タップのあと、止まった
      ctx().resumeBehavior = "stuck";
      playBgm("/audio/bgm/title.mp3");
      await flush();
      expect(ctx().bufferSources).toHaveLength(0);
      expect(getAudioDebugEntries().find((e) => e.event === "buffer-blocked")?.note).toBe("ctx.state=suspended at start");

      ctx().resumeBehavior = "ok";
      ctx().resume.mockClear();
      document.dispatchEvent(new Event("pointerdown")); // 次のタップ
      await flush();
      expect(ctx().resume).toHaveBeenCalled();
      expect(bgmSources()).toHaveLength(1);
      expect(getAudioDebugEntries().some((e) => e.event === "tap-resume")).toBe(true);
    });

    it("1回限りのリスナー: タップで動いたあとは、もう resume を呼ばない(pointerdown を何度タップしても、1回だけ)", async () => {
      setAudioExperiment("buffer", true);
      await unlock();
      ctx().state = "suspended";
      ctx().resumeBehavior = "stuck";
      playBgm("/audio/bgm/title.mp3");
      await flush();
      ctx().resumeBehavior = "ok";
      ctx().resume.mockClear();
      document.dispatchEvent(new Event("pointerdown"));
      await flush();
      document.dispatchEvent(new Event("pointerdown"));
      document.dispatchEvent(new Event("pointerdown"));
      await flush();
      expect(ctx().resume).toHaveBeenCalledTimes(1);
      expect(bgmSources()).toHaveLength(1);
    });

    it("タップで動かそうとして、2回続けて動かなかったら、<audio> 方式に戻す(fallback)。アプリが無音のまま止まらない", async () => {
      setAudioExperiment("buffer", true);
      await unlock();
      ctx().state = "suspended";
      ctx().resumeBehavior = "stuck";
      playBgm("/audio/bgm/title.mp3");
      await flush();
      document.dispatchEvent(new Event("click")); // 1回目: 動かない
      await flush();
      expect(getAudioDebugEntries().some((e) => e.event === "fallback")).toBe(false);
      document.dispatchEvent(new Event("click")); // 2回目: 動かない → <audio> 方式へ
      await flush();
      const fallback = getAudioDebugEntries().find((e) => e.event === "fallback");
      expect(fallback?.note).toMatch(/buffer→audio: still suspended after tap-resume/);
      expect(lastPlayed().src).toContain("title.mp3"); // <audio> で、同じ曲を鳴らす
      expect(ctx().bufferSources).toHaveLength(0);
    });

    it("resume が失敗(reject)しても、2回続いたら、<audio> 方式に戻る", async () => {
      setAudioExperiment("buffer", true);
      await unlock();
      ctx().state = "suspended";
      ctx().resumeBehavior = "reject";
      playBgm("/audio/bgm/title.mp3");
      await flush();
      document.dispatchEvent(new Event("click"));
      await flush();
      document.dispatchEvent(new Event("click"));
      await flush();
      expect(getAudioDebugEntries().find((e) => e.event === "fallback")?.note).toMatch(/resume rejected: NotAllowedError/);
      expect(lastPlayed().src).toContain("title.mp3");
    });
  });
});
