import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "@/app/store/settingsStore";
import { playBgm, shutdownAudio, unlockPlayback } from "./audio";

/**
 * このアプリは、BGMの再生速度(playbackRate)を、どこでも変えていない。
 * 念のため、再生を始めるたびに、再生速度が 1 になっているかを見て、1 以外なら戻す(ピッチが変わって聞こえるのを防ぐ)。
 */
describe("BGMの再生速度は、再生を始めるたびに 1 に戻す", () => {
  let audios: HTMLMediaElement[] = [];
  beforeEach(() => {
    audios = [];
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) {
      audios.push(this);
      return Promise.resolve();
    });
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    useSettingsStore.setState({ bgmVolume: 0.7, seVolume: 0.8, muted: false, audioUnlocked: false });
  });
  afterEach(() => {
    shutdownAudio();
    vi.restoreAllMocks();
  });

  it("再生速度が 1 以外になっていても、曲を鳴らすときに 1 に戻る", () => {
    unlockPlayback();
    const audio = audios[0];
    expect(audio).toBeDefined();
    audio.defaultPlaybackRate = 1.25;
    audio.playbackRate = 1.25;
    playBgm("/audio/bgm/title.mp3");
    expect(audio.playbackRate).toBe(1);
    expect(audio.defaultPlaybackRate).toBe(1);
  });

  it("ふだん(1のまま)は、何も書き換えない", () => {
    unlockPlayback();
    const audio = audios[0];
    // playbackRate への書き込みの回数を数える(読み出しは、もとのまま)
    const proto = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype, "playbackRate");
    const writes = vi.fn();
    Object.defineProperty(audio, "playbackRate", {
      configurable: true,
      get: () => proto?.get?.call(audio) as number,
      set: (value: number) => {
        writes(value);
        proto?.set?.call(audio, value);
      },
    });
    playBgm("/audio/bgm/title.mp3");
    expect(audio.playbackRate).toBe(1);
    expect(writes).not.toHaveBeenCalled();
  });
});
