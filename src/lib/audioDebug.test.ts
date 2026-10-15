import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUDIO_DEBUG_KEY,
  clearAudioDebug,
  formatAudioDebug,
  getAudioDebugEntries,
  getAudioDebugState,
  isAudioDebugEnabled,
  logAudioDebug,
  resetAudioDebugForTest,
  revealAudioDebug,
  setAudioDebugEnabled,
  subscribeAudioDebug,
  watchAudioContext,
  watchAudioElement,
} from "./audioDebug";

/** <audio> の偽物: イベントを送れて、再生位置・一時停止・再生速度を決められる */
function fakeAudio() {
  const target = new EventTarget();
  return Object.assign(target, { currentTime: 0, paused: false, playbackRate: 1, defaultPlaybackRate: 1 });
}
function fakeContext(state = "running") {
  const target = new EventTarget();
  return Object.assign(target, { state, sampleRate: 44100 });
}

describe("音のデバッグログ(?audiodebug=1)", () => {
  let wall = 1000;
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    resetAudioDebugForTest(true);
    wall = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => wall);
  });
  afterEach(() => {
    window.history.replaceState({}, "", "/");
    resetAudioDebugForTest();
    vi.restoreAllMocks();
  });

  it("ふだん(URLにも、保存にも、指定がない)は、無効", () => {
    resetAudioDebugForTest();
    expect(isAudioDebugEnabled()).toBe(false);
    expect(getAudioDebugState()).toEqual({ enabled: false, revealed: false });
  });

  it("URLに audiodebug=1 を付けて開くと、有効になり、端末に保存される(PWAで、URLなしで起動しても、有効のまま)", () => {
    resetAudioDebugForTest();
    window.history.replaceState({}, "", "/?audiodebug=1");
    expect(isAudioDebugEnabled()).toBe(true);
    expect(getAudioDebugState()).toEqual({ enabled: true, revealed: true });
    expect(window.localStorage.getItem(AUDIO_DEBUG_KEY)).toBe("1");
    // URLなしで開き直す(ホーム画面から起動)。保存された設定で、有効になる
    const saved = window.localStorage.getItem(AUDIO_DEBUG_KEY)!;
    resetAudioDebugForTest();
    window.localStorage.setItem(AUDIO_DEBUG_KEY, saved);
    window.history.replaceState({}, "", "/");
    expect(isAudioDebugEnabled()).toBe(true);
  });

  it("audiodebug=0 で開くと、無効に戻り、保存も消える", () => {
    resetAudioDebugForTest();
    window.localStorage.setItem(AUDIO_DEBUG_KEY, "1");
    window.history.replaceState({}, "", "/?audiodebug=0");
    expect(isAudioDebugEnabled()).toBe(false);
    expect(window.localStorage.getItem(AUDIO_DEBUG_KEY)).toBeNull();
  });

  it("保存(localStorage)が使えなくても、例外にならず、その回のあいだは有効にできる", () => {
    resetAudioDebugForTest();
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    window.history.replaceState({}, "", "/?audiodebug=1");
    expect(() => isAudioDebugEnabled()).not.toThrow();
    expect(isAudioDebugEnabled()).toBe(true);
    expect(() => setAudioDebugEnabled(false)).not.toThrow();
    expect(isAudioDebugEnabled()).toBe(false);
    setItem.mockRestore();
    getItem.mockRestore();
  });

  it("項目の表示(revealed)だけを出しても、有効にはならない(保存もしない)", () => {
    resetAudioDebugForTest();
    expect(getAudioDebugState().revealed).toBe(false);
    revealAudioDebug();
    expect(getAudioDebugState()).toEqual({ enabled: false, revealed: true });
    expect(window.localStorage.getItem(AUDIO_DEBUG_KEY)).toBeNull();
  });

  it("有効でないときは、何も記録せず、イベントの待ち受けもしない", () => {
    resetAudioDebugForTest(false);
    const audio = fakeAudio();
    const add = vi.spyOn(audio, "addEventListener");
    watchAudioElement(audio as unknown as HTMLAudioElement);
    watchAudioContext(fakeContext() as unknown as AudioContext);
    logAudioDebug("playBgm", "title.mp3");
    expect(add).not.toHaveBeenCalled();
    expect(getAudioDebugEntries()).toHaveLength(0);
  });

  it("あとから有効にすると、すでにある <audio> と AudioContext に、待ち受けを付ける。無効に戻すと、外して、記録も空にする", () => {
    resetAudioDebugForTest(false);
    const audio = fakeAudio();
    const ctx = fakeContext();
    watchAudioElement(audio as unknown as HTMLAudioElement);
    watchAudioContext(ctx as unknown as AudioContext);
    audio.dispatchEvent(new Event("ratechange"));
    expect(getAudioDebugEntries()).toHaveLength(0);

    setAudioDebugEnabled(true);
    expect(window.localStorage.getItem(AUDIO_DEBUG_KEY)).toBe("1");
    audio.dispatchEvent(new Event("ratechange"));
    ctx.dispatchEvent(new Event("statechange"));
    const names = getAudioDebugEntries().map((e) => e.event);
    expect(names).toEqual(expect.arrayContaining(["start", "audio-created", "context-created", "ratechange", "statechange"]));

    setAudioDebugEnabled(false);
    expect(getAudioDebugEntries()).toHaveLength(0); // 記録も空
    expect(window.localStorage.getItem(AUDIO_DEBUG_KEY)).toBeNull();
    audio.dispatchEvent(new Event("ratechange"));
    ctx.dispatchEvent(new Event("statechange"));
    document.dispatchEvent(new Event("visibilitychange"));
    expect(getAudioDebugEntries()).toHaveLength(0); // もう記録しない
    expect(getAudioDebugState().enabled).toBe(false);
  });

  it("クリアすると、記録だけが空になり、有効のまま", () => {
    logAudioDebug("a");
    logAudioDebug("b");
    expect(getAudioDebugEntries()).toHaveLength(2);
    clearAudioDebug();
    expect(getAudioDebugEntries()).toHaveLength(0);
    expect(isAudioDebugEnabled()).toBe(true);
  });

  it("状態が変わると、購読している画面に知らせる", () => {
    const listener = vi.fn();
    const off = subscribeAudioDebug(listener);
    setAudioDebugEnabled(false);
    setAudioDebugEnabled(true);
    expect(listener).toHaveBeenCalledTimes(2);
    off();
    setAudioDebugEnabled(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("ratechange と statechange と visibilitychange を、状態つきで記録する", () => {
    const audio = fakeAudio();
    const ctx = fakeContext();
    watchAudioContext(ctx as unknown as AudioContext);
    watchAudioElement(audio as unknown as HTMLAudioElement);
    audio.playbackRate = 1.1;
    audio.dispatchEvent(new Event("ratechange"));
    ctx.state = "interrupted";
    ctx.dispatchEvent(new Event("statechange"));
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pagehide"));
    window.dispatchEvent(new Event("pageshow"));

    const names = getAudioDebugEntries().map((e) => e.event);
    expect(names).toEqual(expect.arrayContaining(["ratechange", "statechange", "visibilitychange", "pagehide", "pageshow"]));
    const rate = getAudioDebugEntries().find((e) => e.event === "ratechange");
    expect(rate).toMatchObject({ playbackRate: 1.1, defaultPlaybackRate: 1, ctxState: "running", ctxRate: 44100 });
    expect(getAudioDebugEntries().find((e) => e.event === "statechange")).toMatchObject({ ctxState: "interrupted" });
  });

  /** timeupdate を、250ms ごと(実際の間隔)に送る。pos は、1回ごとの再生位置を返す関数 */
  const run = (audio: ReturnType<typeof fakeAudio>, steps: number, posAt: (i: number) => number, startWall = 1000) => {
    for (let i = 0; i <= steps; i++) {
      wall = startWall + i * 250;
      audio.currentTime = posAt(i);
      audio.dispatchEvent(new Event("timeupdate"));
    }
  };

  it("timeupdate: 速さが同じなら(比が1.0)、記録しない。1回ごとのゆらぎ(±3%)があっても、2秒ぶんまとめて測るので、記録しない", () => {
    const audio = fakeAudio();
    watchAudioElement(audio as unknown as HTMLAudioElement);
    // 1回ごとに、再生位置が ±7ms ゆらぐ(実測の、ふつうの鳴り方)
    run(audio, 24, (i) => 10 + i * 0.25 + (i % 2 === 0 ? 0.007 : -0.007));
    expect(getAudioDebugEntries().some((e) => e.event === "timeupdate")).toBe(false);
  });

  it("timeupdate: 速さが変わった(1.2倍)ときは、比を記録する", () => {
    const audio = fakeAudio();
    watchAudioElement(audio as unknown as HTMLAudioElement);
    run(audio, 12, (i) => 10 + i * 0.3); // 250ms で 0.3秒進む = 1.2倍
    const e = getAudioDebugEntries().find((x) => x.event === "timeupdate");
    expect(e?.ratio).toBe(1.2);
  });

  it("timeupdate: ループで巻き戻ったとき・長くあいたとき・一時停止中は、比を計算しない(測り直す)", () => {
    const audio = fakeAudio();
    watchAudioElement(audio as unknown as HTMLAudioElement);
    run(audio, 4, (i) => 80 + i * 0.3); // 1.2倍だが、2秒に届く前に…
    run(audio, 0, () => 0.1, 2100); // ループで巻き戻った(測り直し)
    run(audio, 4, (i) => 0.4 + i * 0.3, 2350); // また、2秒に届く前に…
    run(audio, 0, () => 3, 9000); // 裏に回っていて、長くあいた(測り直し)
    audio.paused = true;
    run(audio, 12, (i) => 3 + i * 0.3, 9250); // 一時停止中は、測らない
    expect(getAudioDebugEntries().some((e) => e.event === "timeupdate")).toBe(false);
  });

  it("記録は500件までで、古いものから消える", () => {
    for (let i = 0; i < 620; i++) logAudioDebug("mark", String(i));
    const list = getAudioDebugEntries();
    expect(list).toHaveLength(500);
    expect(list[list.length - 1].note).toBe("619");
    expect(list[0].note).toBe("120");
  });

  it("テキストにすると、1件1行で、時刻・イベント・状態・再生速度が入る", () => {
    const audio = fakeAudio();
    watchAudioContext(fakeContext("suspended") as unknown as AudioContext);
    watchAudioElement(audio as unknown as HTMLAudioElement);
    logAudioDebug("playBgm", "title.mp3");
    const text = formatAudioDebug();
    expect(text).toMatch(/^audiodebug /);
    expect(text).toMatch(/\d\d:\d\d:\d\d\.\d{3} playBgm ctx=suspended ctxRate=44100 rate=1 defRate=1 note=title\.mp3/);
  });

  it("定期的な処理(setInterval・requestAnimationFrame)は使わない", () => {
    const interval = vi.spyOn(globalThis, "setInterval");
    const raf = vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation(() => 0);
    const audio = fakeAudio();
    watchAudioElement(audio as unknown as HTMLAudioElement);
    watchAudioContext(fakeContext() as unknown as AudioContext);
    audio.dispatchEvent(new Event("timeupdate"));
    expect(interval).not.toHaveBeenCalled();
    expect(raf).not.toHaveBeenCalled();
  });
});
