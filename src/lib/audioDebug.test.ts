import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUDIO_DEBUG_FULL_KEY,
  AUDIO_DEBUG_KEY,
  AUDIO_EXPERIMENT_KEYS,
  clearAudioDebug,
  formatAudioDebug,
  getAudioDebugEntries,
  getAudioDebugState,
  isAudioDebugEnabled,
  isBufferEnabled,
  isExperimentOn,
  logAudioDebug,
  markAudioDebug,
  registerAudioProbe,
  resetAudioDebugForTest,
  revealAudioDebug,
  setAudioDebugEnabled,
  setAudioExperiment,
  setAudioDebugFull,
  subscribeAudioDebug,
  watchAudioContext,
  watchAudioElement,
} from "./audioDebug";

/** <audio> の偽物: イベントを送れて、再生位置・一時停止・再生速度・状態を決められる */
function fakeAudio() {
  const target = new EventTarget();
  return Object.assign(target, {
    currentTime: 0,
    paused: false,
    playbackRate: 1,
    defaultPlaybackRate: 1,
    loop: false,
    duration: NaN,
    readyState: 4,
    networkState: 1,
    currentSrc: "http://localhost/assets/title-abc123.mp3",
    src: "http://localhost/assets/title-abc123.mp3",
  });
}
/** AudioContext の偽物: currentTime(ctx の時計)を自由に進められる。outputLatency・baseLatency は、渡したときだけ持つ */
function fakeContext(state = "running", latency?: { outputLatency: number; baseLatency: number }) {
  const target = new EventTarget();
  return Object.assign(target, { state, sampleRate: 44100, currentTime: 0 }, latency ?? {});
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
    expect(getAudioDebugState()).toEqual({ enabled: false, revealed: false, full: false, rebuild: false, bufferOff: false });
  });

  it("URLに audiodebug=1 を付けて開くと、有効になり、端末に保存される(PWAで、URLなしで起動しても、有効のまま)", () => {
    resetAudioDebugForTest();
    window.history.replaceState({}, "", "/?audiodebug=1");
    expect(isAudioDebugEnabled()).toBe(true);
    expect(getAudioDebugState()).toEqual({ enabled: true, revealed: true, full: false, rebuild: false, bufferOff: false });
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
    expect(getAudioDebugState()).toEqual({ enabled: false, revealed: true, full: false, rebuild: false, bufferOff: false });
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

  /**
   * timeupdate を、250ms ごと(実際の間隔)に送る。audioPos は、1回ごとの audio.currentTime、ctxSpeed は、ctx の時計の速さ
   * (1 なら、実際の時間と同じ。0.977 なら、実際より遅れる)
   */
  const run = (
    audio: ReturnType<typeof fakeAudio>,
    ctx: ReturnType<typeof fakeContext>,
    steps: number,
    audioPos: (i: number) => number,
    ctxSpeed = 1,
    startWall = 1000,
  ) => {
    for (let i = 0; i <= steps; i++) {
      wall = startWall + i * 250;
      audio.currentTime = audioPos(i);
      ctx.currentTime = ((wall - 1000) / 1000) * ctxSpeed;
      audio.dispatchEvent(new Event("timeupdate"));
    }
  };
  const setup = () => {
    const audio = fakeAudio();
    const ctx = fakeContext();
    watchAudioContext(ctx as unknown as AudioContext);
    watchAudioElement(audio as unknown as HTMLAudioElement);
    return { audio, ctx };
  };
  const rows = () => getAudioDebugEntries().filter((e) => e.event === "timeupdate");

  it("timeupdate(ふつうのモード): 3つの時計がそろっていれば、記録しない。1回ごとのゆらぎ(±3%)があっても、2秒ぶんまとめて測るので、記録しない", () => {
    const { audio, ctx } = setup();
    // 1回ごとに、audio.currentTime が ±7ms ゆらぐ(実測の、ふつうの鳴り方)
    run(audio, ctx, 24, (i) => 10 + i * 0.25 + (i % 2 === 0 ? 0.007 : -0.007));
    expect(rows()).toHaveLength(0);
  });

  it("timeupdate(全記録): そろっている窓は、約10秒ごと(窓5つ)に1件へ間引く。間引いた行には、その間の a/w・c/w の最大と最小を添える。「!」は付かない", () => {
    setAudioDebugFull(true);
    const { audio, ctx } = setup();
    // 1回ごとに、audio.currentTime が ±7ms ゆらぐ。30秒(約2秒の窓が15個)
    run(audio, ctx, 120, (i) => 10 + i * 0.25 + (i % 2 === 0 ? 0.007 : -0.007));
    const list = rows();
    expect(list).toHaveLength(3); // 15個の窓 → 5つごとに1件
    for (const e of list) {
      expect(e.bang).toBe(false);
      expect(e.win!.wallMs).toBe(2000);
      expect(e.span).toMatchObject({ windows: 5, ms: 10000 });
      expect(e.span!.awMin).toBeGreaterThan(0.99);
      expect(e.span!.awMax).toBeLessThan(1.01);
      expect(e.span!.awMin).toBeLessThanOrEqual(e.span!.awMax);
      expect(e.span!.cwMin).toBe(1);
      expect(e.span!.cwMax).toBe(1);
    }
    expect(formatAudioDebug()).toMatch(/span=10000ms n=5 a\/w=\[[\d.]+?\.\.[\d.]+\] c\/w=\[1\.\.1\]/);
  });

  it("timeupdate(全記録): ±0.01 以上ずれた窓は、間引かずに記録する(「!」)。間引いた窓のずれも、その行の span の最大・最小に入る", () => {
    setAudioDebugFull(true);
    const { audio, ctx } = setup();
    // ふつうの窓が1つ(1〜3秒)のあと、audio が 1.05 倍の窓が1つ(3〜5秒)
    run(audio, ctx, 8, (i) => 10 + i * 0.25);
    run(audio, ctx, 7, (i) => 12 + (i + 1) * 0.25 * 1.05, 1, 3250);
    const list = rows();
    expect(list).toHaveLength(1);
    expect(list[0].bang).toBe(true);
    expect(list[0].win!.aw).toBe(1.05);
    expect(list[0].span).toMatchObject({ windows: 2, awMin: 1, awMax: 1.05, cwMin: 1, cwMax: 1 });
    // 記録したあとは、まとめ直し(次の行には、ずれた窓は入らない)
    run(audio, ctx, 80, (i) => 14 + (i + 1) * 0.25, 1, 5250);
    const next = rows()[1];
    expect(next.span!.awMax).toBeLessThan(1.01);
  });

  it("出来事(statechange・pause・playing・waiting・seeking・visibilitychange・MARK・rebuild)は、全記録でも、間引かず、すべて記録する", () => {
    setAudioDebugFull(true);
    const { audio, ctx } = setup();
    for (const name of ["pause", "playing", "waiting", "seeking"]) audio.dispatchEvent(new Event(name));
    ctx.dispatchEvent(new Event("statechange"));
    document.dispatchEvent(new Event("visibilitychange"));
    markAudioDebug();
    logAudioDebug("rebuild", "test");
    const names = getAudioDebugEntries().map((e) => e.event);
    for (const n of ["pause", "playing", "waiting", "seeking", "statechange", "visibilitychange", "MARK", "rebuild"]) expect(names, n).toContain(n);
  });

  it("timeupdate: audio の時計だけが速い(1.2倍)と、a/w と a/c がずれて、「!」が付く。c/w は 1.0", () => {
    const { audio, ctx } = setup();
    run(audio, ctx, 12, (i) => 10 + i * 0.3); // 250ms で 0.3秒進む = 1.2倍
    const e = rows()[0];
    expect(e.win).toMatchObject({ aw: 1.2, cw: 1, ac: 1.2 });
    expect(e.bang).toBe(true);
  });

  it("timeupdate: ctx の時計だけが遅れる(0.977)と、c/w と a/c がずれる(audio/wall は 1.0 のままなので、今までの記録では見えなかった)", () => {
    const { audio, ctx } = setup();
    run(audio, ctx, 12, (i) => 10 + i * 0.25, 0.977);
    const e = rows()[0];
    expect(e.win!.aw).toBe(1);
    expect(e.win!.cw).toBe(0.977);
    expect(e.win!.ac).toBe(1.024);
    expect(e.bang).toBe(true);
  });

  it("しきい値: ±0.01 以上で「!」。ふつうのモードの記録は ±0.02 以上。1.5%のずれは、全記録のときだけ記録され、「!」が付く", () => {
    const small = (i: number) => 10 + i * 0.25 * 1.015;
    {
      const { audio, ctx } = setup();
      run(audio, ctx, 12, small);
      expect(rows()).toHaveLength(0); // ふつうのモードでは、記録しない
    }
    resetAudioDebugForTest(true);
    wall = 1000;
    setAudioDebugFull(true);
    const { audio, ctx } = setup();
    run(audio, ctx, 12, small);
    expect(rows()[0].win!.aw).toBe(1.015);
    expect(rows()[0].bang).toBe(true);
  });

  it("窓をまたいだ印: statechange(止まる・動き出す)・一時停止・裏に回る/戻る をまたいだ窓には、crossed が付く。次の窓には付かない", () => {
    setAudioDebugFull(true);
    const { audio, ctx } = setup();
    run(audio, ctx, 3, (i) => 10 + i * 0.25, 0.95); // 窓の途中(ctx がずれていて、全記録でも、記録される窓にする)
    ctx.state = "interrupted";
    ctx.dispatchEvent(new Event("statechange"));
    run(audio, ctx, 12, (i) => 10 + (i + 4) * 0.25, 0.95, 2000);
    const list = rows();
    expect(list[0].win!.crossed).toBe(true);
    expect(list[list.length - 1].win!.crossed).toBe(false);

    // 一時停止・裏に回る/戻る(それぞれ、まっさらな状態から)
    for (const name of ["pause", "visibilitychange", "pagehide", "pageshow"]) {
      resetAudioDebugForTest(true);
      wall = 1000;
      setAudioDebugFull(true);
      const second = setup();
      run(second.audio, second.ctx, 3, (i) => 10 + i * 0.25, 0.95); // 窓の途中(1000〜1750ms)
      if (name === "pause") second.audio.dispatchEvent(new Event("pause"));
      else if (name === "visibilitychange") document.dispatchEvent(new Event("visibilitychange"));
      else window.dispatchEvent(new Event(name));
      run(second.audio, second.ctx, 12, (i) => 10 + (i + 4) * 0.25, 0.95, 2000);
      expect(rows()[0].win!.crossed, name).toBe(true);
    }
  });

  it("ループで巻き戻っても(loop・曲の長さがわかる)、曲の長さを足して続けるので、比はずれず、窓をまたいだ印も付かない。ループ以外の巻き戻しは、印が付く", () => {
    setAudioDebugFull(true);
    const { audio, ctx } = setup();
    audio.loop = true;
    audio.duration = 86;
    run(audio, ctx, 12, (i) => (84.5 + i * 0.25) % 86, 0.95); // 窓のとちゅうで、86秒の曲の終わりから先頭へ戻る(ctx をずらして、記録される窓にする)
    expect(rows()[0].win).toMatchObject({ aw: 1, crossed: false, looped: true }); // 「ループ」の印が付く
    expect(formatAudioDebug()).toMatch(/ ループ/);

    resetAudioDebugForTest(true);
    wall = 1000;
    setAudioDebugFull(true);
    const second = setup();
    run(second.audio, second.ctx, 12, (i) => (i === 4 ? 3 : 10 + i * 0.25), 0.95); // loop でないのに巻き戻った(シークなど)
    expect(rows()[0].win).toMatchObject({ crossed: true, looped: false });
  });

  it("各行に、曲の名前・paused・readyState・networkState を記録する。ハッシュ付きのファイル名も、そのまま。無音の準備用の曲は「(無音)」", () => {
    const { audio } = setup();
    audio.paused = true;
    audio.readyState = 3;
    audio.networkState = 2;
    audio.dispatchEvent(new Event("ratechange"));
    expect(getAudioDebugEntries().find((e) => e.event === "ratechange")).toMatchObject({
      bgm: "title-abc123.mp3",
      paused: true,
      readyState: 3,
      networkState: 2,
    });
    audio.currentSrc = "";
    audio.src = "data:audio/wav;base64,AAAA";
    audio.dispatchEvent(new Event("ratechange"));
    expect(getAudioDebugEntries().filter((e) => e.event === "ratechange").pop()!.bgm).toBe("(無音)");
  });

  it("outputLatency と baseLatency は、対応していれば記録し、未対応(Safariなど)なら省略する", () => {
    const audio = fakeAudio();
    const ctx = fakeContext("running", { outputLatency: 0.045, baseLatency: 0.01 });
    watchAudioContext(ctx as unknown as AudioContext);
    watchAudioElement(audio as unknown as HTMLAudioElement);
    audio.dispatchEvent(new Event("ratechange"));
    expect(getAudioDebugEntries().find((e) => e.event === "ratechange")).toMatchObject({ outputLatency: 0.045, baseLatency: 0.01 });
    expect(formatAudioDebug()).toMatch(/outLat=0\.045 baseLat=0\.01/);

    resetAudioDebugForTest(true);
    const plain = setup();
    plain.audio.dispatchEvent(new Event("ratechange"));
    const e = getAudioDebugEntries().find((x) => x.event === "ratechange")!;
    expect("outputLatency" in e).toBe(false);
    expect(formatAudioDebug()).not.toContain("outLat=");
  });

  it("「いま高い」(MARK): 押した瞬間の、wall・audio.currentTime・ctx.currentTime・各比・状態・曲の名前を記録する。有効でなければ記録しない", () => {
    const { audio, ctx } = setup();
    run(audio, ctx, 12, (i) => 10 + i * 0.25); // 窓が1つ終わる
    wall = 4000;
    audio.currentTime = 10.75;
    ctx.currentTime = 3.0;
    expect(markAudioDebug()).toBe(true);
    const mark = getAudioDebugEntries().find((e) => e.event === "MARK")!;
    expect(mark).toMatchObject({ ctxState: "running", ctxRate: 44100, bgm: "title-abc123.mp3" });
    expect(mark.mark).toMatchObject({ wallNow: 4000, audioTime: 10.75, ctxTime: 3 });
    expect(mark.mark!.current).toMatchObject({ aw: 1, cw: 1, ac: 1 });
    expect(mark.mark!.current!.wallMs).toBe(1000);
    const text = formatAudioDebug();
    expect(text).toMatch(/MARK ctx=running ctxRate=44100 .*bgm=title-abc123\.mp3 .*wall=4000 audioT=10\.75 ctxT=3 now:\[win=1000ms .*a\/w=1 c\/w=1 a\/c=1\]/);

    setAudioDebugEnabled(false);
    expect(markAudioDebug()).toBe(false);
    expect(getAudioDebugEntries()).toHaveLength(0);
  });

  it("全記録の切り替えは、端末に保存される。無効に戻しても、全記録の設定は残る", () => {
    expect(getAudioDebugState().full).toBe(false);
    setAudioDebugFull(true);
    expect(getAudioDebugState().full).toBe(true);
    expect(window.localStorage.getItem(AUDIO_DEBUG_FULL_KEY)).toBe("1");
    setAudioDebugEnabled(false);
    expect(getAudioDebugState().full).toBe(true);
    setAudioDebugFull(false);
    expect(window.localStorage.getItem(AUDIO_DEBUG_FULL_KEY)).toBeNull();
  });

  it("ログの書式(例): 「!」・時刻・イベント・状態・出力の遅れ・窓の測定・span が、1行にそろう", () => {
    setAudioDebugFull(true);
    const audio = fakeAudio();
    const ctx = fakeContext("running", { outputLatency: 0.012, baseLatency: 0.005 });
    watchAudioContext(ctx as unknown as AudioContext);
    watchAudioElement(audio as unknown as HTMLAudioElement);
    run(audio, ctx, 8, (i) => 10 + i * 0.25, 0.977); // ctx だけが 0.977 倍
    const row = formatAudioDebug().split("\n").find((l) => l.includes(" timeupdate "))!;
    expect(row).toMatch(
      /^! \d\d:\d\d:\d\d\.\d{3} timeupdate ctx=running ctxRate=44100 rate=1 defRate=1 bgm=title-abc123\.mp3 paused=false ready=4 net=1 session=n\/a outLat=0\.012 baseLat=0\.005 win=2000ms audio=2000ms ctx=1954ms a\/w=1 c\/w=0\.977 a\/c=1\.024 span=2000ms n=1 a\/w=\[1\.\.1\] c\/w=\[0\.977\.\.0\.977\]$/,
    );
  });

  it("記録は2000件までで、古いものから消える", () => {
    for (let i = 0; i < 2100; i++) logAudioDebug("mark", String(i));
    const list = getAudioDebugEntries();
    expect(list).toHaveLength(2000);
    expect(list[list.length - 1].note).toBe("2099");
    expect(list[0].note).toBe("100");
  });

  it("テキストにすると、1件1行で、時刻・イベント・状態・再生速度が入る", () => {
    const audio = fakeAudio();
    watchAudioContext(fakeContext("suspended") as unknown as AudioContext);
    watchAudioElement(audio as unknown as HTMLAudioElement);
    logAudioDebug("playBgm", "title.mp3");
    const text = formatAudioDebug();
    expect(text).toMatch(/^audiodebug /);
    expect(text).toMatch(/\d\d:\d\d:\d\d\.\d{3} playBgm ctx=suspended ctxRate=44100 rate=1 defRate=1 bgm=title-abc123\.mp3 paused=false ready=4 net=1 session=n\/a note=title\.mp3/);
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
  it("デバッグ用のスイッチ: A(作り直す)は、ふだんオフ。B無効も、ふだんオフ(=短い曲は AudioBuffer)。保存される。Aは、ログが無効なあいだは働かない。B無効は、ログが無効でも働く", () => {
    expect(getAudioDebugState()).toMatchObject({ rebuild: false, bufferOff: false });
    expect(isExperimentOn("rebuild")).toBe(false);
    expect(isBufferEnabled()).toBe(true);
    setAudioExperiment("rebuild", true);
    setAudioExperiment("bufferOff", true);
    expect(window.localStorage.getItem(AUDIO_EXPERIMENT_KEYS.rebuild)).toBe("1");
    expect(window.localStorage.getItem(AUDIO_EXPERIMENT_KEYS.bufferOff)).toBe("1");
    expect(isExperimentOn("rebuild")).toBe(true);
    expect(isBufferEnabled()).toBe(false);
    setAudioDebugEnabled(false); // ログを切ると、A は働かない。B無効は、不具合の逃げ道なので、働き続ける
    expect(isExperimentOn("rebuild")).toBe(false);
    expect(isBufferEnabled()).toBe(false);
    expect(getAudioDebugState()).toMatchObject({ rebuild: true, bufferOff: true });
    setAudioDebugEnabled(true);
    expect(isExperimentOn("rebuild")).toBe(true);
    setAudioExperiment("bufferOff", false);
    expect(window.localStorage.getItem(AUDIO_EXPERIMENT_KEYS.bufferOff)).toBeNull();
    expect(isBufferEnabled()).toBe(true);
  });

  it("MARK の行に、スイッチA・Bの状態・再生方式・最後の rebuild の時刻・buffer のときの曲の中の位置を足す", () => {
    setAudioExperiment("rebuild", true);
    registerAudioProbe(() => ({ method: "buffer", lastRebuildAt: Date.UTC(2026, 9, 15, 12, 34, 56, 789), bufferPosition: 12.345 }));
    setup();
    markAudioDebug();
    const text = formatAudioDebug();
    expect(text).toMatch(/MARK .*A=on B=on method=buffer lastRebuild=12:34:56\.789 bufferPos=12\.345/);
    expect(text).toMatch(/now:\[-\] last:\[-\] lastTick:\[-\] A=on B=on/); // buffer 方式のときは、audio の時計の窓は出さない
    registerAudioProbe(null);
    clearAudioDebug();
    markAudioDebug();
    expect(formatAudioDebug()).toMatch(/A=on B=on method=audio lastRebuild=-$/m);
  });
  describe("実験B(AudioBuffer)のとき: ダミーの <audio> の記録をやめて、ctx の時計だけで、約10秒ごとに buffer-tick を記録する", () => {
    /** 実験Bで鳴らしている状態にする(曲の中の位置は、ctx の時計に合わせて進む) */
    const bufferSetup = (ctxSpeed = 1) => {
      const { audio, ctx } = setup();
      registerAudioProbe(() => ({ method: "buffer", lastRebuildAt: null, bufferPosition: Math.round(((ctx.currentTime % 85.94) * 1000)) / 1000 }));
      // 無音ダミーの <audio>(1秒のループ): 250ms ごとに timeupdate、1秒ごとに seeking
      const run = (steps: number, startWall = 1000) => {
        for (let i = 0; i <= steps; i++) {
          wall = startWall + i * 250;
          ctx.currentTime = ((wall - 1000) / 1000) * ctxSpeed;
          audio.currentTime = (i * 0.25) % 1;
          if (i % 4 === 0) audio.dispatchEvent(new Event("seeking"));
          if (i % 4 === 0) audio.dispatchEvent(new Event("waiting"));
          if (i % 4 === 0) audio.dispatchEvent(new Event("playing"));
          audio.dispatchEvent(new Event("timeupdate"));
        }
      };
      return { audio, ctx, run };
    };
    const names = () => getAudioDebugEntries().map((e) => e.event);

    it("ダミーの timeupdate・seeking・waiting・playing は、ログに出さない(pause は、ミュートなどで止めたときなので、記録する)(a/w の窓も、「!」の行も、作らない)", () => {
      setAudioDebugFull(true);
      const { run } = bufferSetup();
      run(400); // 100秒
      expect(names()).not.toContain("timeupdate");
      expect(names()).not.toContain("seeking");
      expect(names()).not.toContain("waiting");
      expect(names()).not.toContain("playing");
      expect(getAudioDebugEntries().some((e) => e.bang && e.event !== "buffer-tick")).toBe(false);
    });

    it("pause(ミュートなどで、ダミーを止めたとき)は、Bのあいだも、記録する", () => {
      setAudioDebugFull(true);
      const { audio } = bufferSetup();
      audio.dispatchEvent(new Event("pause"));
      expect(names()).toContain("pause");
    });

    it("約10秒ごとに1件、buffer-tick を記録する(全記録)。ctx/wall・ctx・曲の中の位置・ctx.state・session が入る。「!」は付かない", () => {
      setAudioDebugFull(true);
      const { run } = bufferSetup();
      run(400); // 100秒 → 約10件
      const ticks = getAudioDebugEntries().filter((e) => e.event === "buffer-tick");
      expect(ticks).toHaveLength(10);
      for (const t of ticks) {
        expect(t.tick).toMatchObject({ wallMs: 10000, ctxMs: 10000, cw: 1, crossed: false });
        expect(t.bang).toBe(false);
        expect(t.ctxState).toBe("running");
        expect(t.session).toBe("n/a");
      }
      expect(ticks[1].tick!.bufferPos).toBe(20); // ctx の時計 20 秒(曲は 85.94 秒でループ)
      const text = formatAudioDebug();
      expect(text).toMatch(/buffer-tick ctx=running .*session=n\/a tick=10000ms ctx=10000ms c\/w=1 bufferPos=10$/m);
    });

    it("ctx/wall が 1.0 から ±0.01 以上ずれた tick には「!」が付く(ふつうのモードでも、±0.02 以上ずれたものは記録する)", () => {
      const { run } = bufferSetup(0.977);
      run(44); // 11秒
      const t = getAudioDebugEntries().find((e) => e.event === "buffer-tick")!;
      expect(t.tick!.cw).toBe(0.977);
      expect(t.bang).toBe(true);
      expect(formatAudioDebug()).toMatch(/^! .*buffer-tick .*c\/w=0\.977/m);
    });

    it("ふつうのモード(全記録でない)では、そろっている tick は記録しない", () => {
      const { run } = bufferSetup();
      run(400);
      expect(names()).not.toContain("buffer-tick");
    });

    it("止まる・動き出す(statechange)をまたいだ tick には「窓をまたいだ」が付く", () => {
      setAudioDebugFull(true);
      const { run, ctx } = bufferSetup();
      run(20); // 5秒
      ctx.dispatchEvent(new Event("statechange"));
      run(40, 6000); // 6秒〜16秒
      const first = getAudioDebugEntries().find((e) => e.event === "buffer-tick")!;
      expect(first.tick!.crossed).toBe(true);
    });

    it("約6分(1440回の timeupdate)で、約36件。ダミー由来の行で、リングが埋まらない", () => {
      setAudioDebugFull(true);
      const { run } = bufferSetup();
      run(1440); // 360秒
      expect(getAudioDebugEntries().filter((e) => e.event === "buffer-tick")).toHaveLength(36);
      expect(getAudioDebugEntries().length).toBeLessThan(60);
    });

    it("MARK の行に、直前の tick(ctx/wall・bufferPos)が入る", () => {
      setAudioDebugFull(true);
      const { run, ctx } = bufferSetup();
      run(50); // 12.5秒 → tick が1件
      ctx.currentTime = 14;
      markAudioDebug();
      const text = formatAudioDebug();
      expect(text).toMatch(/MARK .*now:\[-\] last:\[-\] lastTick:\[tick=10000ms ctx=10000ms c\/w=1 bufferPos=10\] A=off B=on method=buffer/);
    });

    it("<audio> 方式に戻ったら(method=audio)、ふつうの窓の記録に戻る", () => {
      setAudioDebugFull(true);
      const { audio, ctx } = setup();
      let method = "buffer";
      registerAudioProbe(() => ({ method, lastRebuildAt: null, bufferPosition: null }));
      run(audio, ctx, 12, (i) => (i * 0.25) % 1, 0.95); // buffer のあいだ: 窓は記録しない
      expect(names()).not.toContain("timeupdate");
      method = "audio"; // fallback で、<audio> 方式に戻った
      run(audio, ctx, 12, (i) => 10 + i * 0.25, 0.95, 5000);
      run(audio, ctx, 12, (i) => 13 + i * 0.25, 0.95, 8000);
      expect(names()).toContain("timeupdate");
    });
  });
});
