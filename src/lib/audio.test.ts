import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { unlockPlayback, playSe, playBgm, stopBgm } from "./audio";
import { useSettingsStore } from "@/app/store/settingsStore";

/**
 * jsdom には AudioContext が存在しないため、実際の音は鳴らない環境での検証になる。
 * ここでは「例外を投げずに安全に動作すること」と「audioUnlockedの状態管理」を確認し、
 * 実際の可聴確認はブラウザでの手動テストに委ねる。
 * HTMLMediaElement.play/pause は jsdom が未実装で警告ログを出すため、テスト中は黙らせる。
 */
describe("audio", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      bgmVolume: 0.7,
      seVolume: 0.8,
      muted: false,
      audioUnlocked: false,
    });
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(
      () => Promise.resolve(),
    );
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    stopBgm();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("unlockPlayback は settingsStore.audioUnlocked を true にする", () => {
    expect(useSettingsStore.getState().audioUnlocked).toBe(false);
    unlockPlayback();
    expect(useSettingsStore.getState().audioUnlocked).toBe(true);
  });

  it("解禁前に playSe を呼んでも例外にならない", () => {
    expect(() => playSe("correct")).not.toThrow();
  });

  it("解禁後に playSe を呼んでも例外にならない(jsdomにAudioContextがないため無音で終わる)", () => {
    unlockPlayback();
    expect(() => playSe("correct")).not.toThrow();
    expect(() => playSe("incorrect")).not.toThrow();
    expect(() => playSe("clear")).not.toThrow();
    expect(() => playSe("subBossClear")).not.toThrow();
    expect(() => playSe("tap")).not.toThrow();
    expect(() => playSe("lastBossClear")).not.toThrow();
    expect(() => playSe("growth")).not.toThrow();
    expect(() => playSe("pageUnlock")).not.toThrow();
    expect(() => playSe("bonus")).not.toThrow();
  });

  it("ミュート中に playSe を呼んでも例外にならない", () => {
    unlockPlayback();
    useSettingsStore.setState({ muted: true });
    expect(() => playSe("correct")).not.toThrow();
  });

  it("playBgm / stopBgm は例外にならない", () => {
    unlockPlayback();
    expect(() => playBgm("/assets/audio/bgm/title.mp3")).not.toThrow();
    expect(() => stopBgm()).not.toThrow();
  });

  it("解禁の中で、BGM用の要素を無音で一度再生しておく(iOSで、あとから曲を差し替えて鳴らせるように)", () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    unlockPlayback();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("同じ曲をもう一度指定しても、再生し直さない(場面が変わっても曲が同じなら途切れない)", () => {
    unlockPlayback();
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    play.mockClear();
    playBgm("/assets/audio/bgm-a.mp3");
    playBgm("/assets/audio/bgm-a.mp3");
    expect(play).toHaveBeenCalledTimes(1);
    playBgm("/assets/audio/bgm-b.mp3");
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("解禁前の playBgm は何もしない(例外にならない)", () => {
    expect(() => playBgm("/assets/audio/bgm/title.mp3")).not.toThrow();
  });
});
