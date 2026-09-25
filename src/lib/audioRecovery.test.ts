import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "@/app/store/settingsStore";
import { playBgm, playSe, shutdownAudio, unlockPlayback } from "./audio";

/**
 * 画面の読み込み直しのあとなどに、iOS(Safari)の AudioContext が "suspended" ではなく "interrupted" で始まる/なることがある。
 * そのままだと BGM も効果音も無音になるので、解禁のときと、その後の画面タップで、止まった状態から動かし直す。
 * jsdom には AudioContext がないので、状態を自由に決められる偽物で確かめる。
 */
class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: string = "suspended";
  currentTime = 0;
  destination = {};
  resume = vi.fn(async () => {
    this.state = "running";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });
  addEventListener = vi.fn();
  createGain = () => ({
    gain: { value: 1, setValueAtTime: vi.fn(), cancelScheduledValues: vi.fn(), setTargetAtTime: vi.fn() },
    connect: () => ({ connect: () => undefined }),
  });
  createMediaElementSource = () => ({ connect: () => ({ connect: () => undefined }) });
  createBufferSource = () => ({ buffer: null, connect: () => ({ connect: () => undefined }), start: vi.fn() });
  decodeAudioData = vi.fn(async () => ({ duration: 1 }));
  constructor(initial = FakeAudioContext.initialState) {
    this.state = initial;
    FakeAudioContext.instances.push(this);
  }
  static initialState = "suspended";
}

const latest = () => FakeAudioContext.instances[FakeAudioContext.instances.length - 1];

describe("音声の再開(iOSの interrupted への対応)と、初期化前の後始末", () => {
  beforeEach(() => {
    FakeAudioContext.instances = [];
    FakeAudioContext.initialState = "suspended";
    (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(8) })));
    useSettingsStore.setState({ bgmVolume: 0.7, seVolume: 0.8, muted: false, audioUnlocked: false });
  });

  afterEach(() => {
    shutdownAudio();
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("解禁のとき、AudioContext が suspended なら再開する", () => {
    unlockPlayback();
    expect(latest().resume).toHaveBeenCalled();
  });

  it("解禁のとき、AudioContext が interrupted(iOS)でも再開する(suspended だけを見ていると、無音のままになる)", () => {
    FakeAudioContext.initialState = "interrupted";
    unlockPlayback();
    expect(latest().resume).toHaveBeenCalled();
  });

  it("すでに running なら、再開を呼び直さない", () => {
    FakeAudioContext.initialState = "running";
    unlockPlayback();
    expect(latest().resume).not.toHaveBeenCalled();
  });

  it("解禁のあと、また止まった(interrupted)状態でも、画面をタップすると再開する", () => {
    FakeAudioContext.initialState = "running";
    unlockPlayback();
    const ctx = latest();
    ctx.state = "interrupted";
    ctx.resume.mockClear();
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(ctx.resume).toHaveBeenCalled();
  });

  it("解禁前のタップでは、再開しない(自動再生の制限に逆らわない)", () => {
    FakeAudioContext.initialState = "running";
    unlockPlayback();
    const ctx = latest();
    useSettingsStore.setState({ audioUnlocked: false });
    ctx.state = "suspended";
    ctx.resume.mockClear();
    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(ctx.resume).not.toHaveBeenCalled();
  });

  it("効果音を鳴らそうとしたとき止まっていたら、再開を試みる(そのタップの中で動かしておく)", () => {
    FakeAudioContext.initialState = "interrupted";
    unlockPlayback();
    const ctx = latest();
    ctx.state = "interrupted";
    ctx.resume.mockClear();
    playSe("tap");
    expect(ctx.resume).toHaveBeenCalled();
  });

  it("音の後始末(shutdownAudio): BGMを止め、AudioContext を閉じる。次に解禁すると、新しい AudioContext が作られる", () => {
    FakeAudioContext.initialState = "running";
    unlockPlayback();
    playBgm("/assets/audio/bgm/title.mp3");
    const first = latest();
    const pause = vi.mocked(window.HTMLMediaElement.prototype.pause);
    pause.mockClear();
    shutdownAudio();
    expect(pause).toHaveBeenCalled();
    expect(first.close).toHaveBeenCalled();
    unlockPlayback();
    expect(FakeAudioContext.instances).toHaveLength(2);
    expect(latest()).not.toBe(first);
  });

  it("後始末のあとでも、同じ曲を指定すれば、また鳴らせる(古い状態を引きずらない)", () => {
    FakeAudioContext.initialState = "running";
    unlockPlayback();
    playBgm("/assets/audio/bgm/title.mp3");
    shutdownAudio();
    unlockPlayback();
    const play = vi.mocked(window.HTMLMediaElement.prototype.play);
    play.mockClear();
    playBgm("/assets/audio/bgm/title.mp3"); // 同じ曲でも、後始末で「再生中の曲」の記録が消えているので、鳴らし直す
    expect(play).toHaveBeenCalled();
  });
});
