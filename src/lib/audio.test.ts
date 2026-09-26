import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { duckBgm, unlockPlayback, playSe, playBgm, setBgmStarter, stopBgm } from "./audio";
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

  it("導入曲つきの指定は、導入曲を1回だけ鳴らし、終わったらループ曲をくり返す", () => {
    unlockPlayback();
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    play.mockClear();
    playBgm("/assets/audio/explore.mp3", "/assets/audio/explore-intro.mp3");
    expect(play).toHaveBeenCalledTimes(1);
    // 同じループ曲の指定は、導入曲の再生中でも再生し直さない
    playBgm("/assets/audio/explore.mp3", "/assets/audio/explore-intro.mp3");
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("解禁前の playBgm は何もしない(例外にならない)", () => {
    expect(() => playBgm("/assets/audio/bgm/title.mp3")).not.toThrow();
  });

  describe("BGMの音量(iOSでは <audio> の volume が効かないため、GainNode が使えない環境=jsdomでは要素の volume で代用)", () => {
    // BGMの基準音量(audio.ts の BGM_BASE_GAIN)。スライダーの値にかけて鳴らす
    const BASE = 0.4;

    function trackVolume() {
      const set = vi.spyOn(window.HTMLMediaElement.prototype, "volume", "set");
      unlockPlayback();
      playBgm("/assets/audio/bgm-vol.mp3");
      return set;
    }

    it("スライダーを動かすと、基準音量をかけた値がBGMに反映される", () => {
      const set = trackVolume();
      useSettingsStore.getState().setBgmVolume(0.5);
      expect(set).toHaveBeenLastCalledWith(0.5 * BASE);
    });

    it("BGMの基準音量は、スライダーが最大でも効果音より小さい", () => {
      const set = trackVolume();
      useSettingsStore.getState().setBgmVolume(1);
      expect(set).toHaveBeenLastCalledWith(BASE);
      expect(BASE).toBeLessThan(1);
    });

    it("ミュートで0になり、解除すると元の音量に戻り、止まっていたBGMは鳴らし直す", () => {
      const set = trackVolume();
      const play = vi.mocked(window.HTMLMediaElement.prototype.play);
      useSettingsStore.getState().setMuted(true);
      expect(set).toHaveBeenLastCalledWith(0);
      play.mockClear();
      useSettingsStore.getState().setMuted(false);
      expect(set).toHaveBeenLastCalledWith(0.7 * BASE);
      expect(play).toHaveBeenCalledTimes(1); // jsdomでは要素が止まった状態のまま。解除で再生を促す
    });

    it("ミュートにすると、音量0ではなく、BGMを実際に一時停止(pause)する。解除すると、再生を再開する", () => {
      trackVolume();
      const proto = window.HTMLMediaElement.prototype;
      const pause = vi.mocked(proto.pause);
      const play = vi.mocked(proto.play);
      pause.mockClear();
      useSettingsStore.getState().setMuted(true);
      expect(pause).toHaveBeenCalled();
      play.mockClear();
      useSettingsStore.getState().setMuted(false);
      expect(play).toHaveBeenCalled();
    });

    it("ミュート中は、曲を切り替えても、再生を始めない(止めたまま)", () => {
      trackVolume();
      useSettingsStore.getState().setMuted(true);
      const play = vi.mocked(window.HTMLMediaElement.prototype.play);
      play.mockClear();
      playBgm("/assets/audio/bgm-muted.mp3");
      expect(play).not.toHaveBeenCalled();
    });

    it("ミュート中に曲が切り替わっても、解除後に新しい曲が鳴る", () => {
      trackVolume();
      useSettingsStore.getState().setMuted(true);
      playBgm("/assets/audio/bgm-vol2.mp3");
      const play = vi.mocked(window.HTMLMediaElement.prototype.play);
      play.mockClear();
      useSettingsStore.getState().setMuted(false);
      expect(play).toHaveBeenCalled();
    });

    it("ダッキング: 指定の時間だけBGMを下げ、過ぎたら元の音量に戻る。ミュート中は0のまま", () => {
      vi.useFakeTimers();
      try {
        const set = trackVolume();
        duckBgm(1000);
        const ducked = set.mock.calls.at(-1)?.[0] as number;
        expect(ducked).toBeGreaterThan(0);
        expect(ducked).toBeLessThan(0.7 * BASE * 0.2);
        vi.advanceTimersByTime(1001);
        expect(set).toHaveBeenLastCalledWith(0.7 * BASE);
        useSettingsStore.getState().setMuted(true);
        duckBgm(500);
        expect(set).toHaveBeenLastCalledWith(0);
        vi.advanceTimersByTime(501);
        expect(set).toHaveBeenLastCalledWith(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it("ダッキングを続けて呼んでも、いちばん遅い終わりまで下げたままにする", () => {
      vi.useFakeTimers();
      try {
        const set = trackVolume();
        duckBgm(2000);
        duckBgm(300); // 短い呼び出しで、長いほうを打ち切らない
        vi.advanceTimersByTime(1000);
        expect((set.mock.calls.at(-1)?.[0] as number) < 0.7 * BASE * 0.2).toBe(true);
        vi.advanceTimersByTime(1001);
        expect(set).toHaveBeenLastCalledWith(0.7 * BASE);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("解禁とバックグラウンド(iOS実機の不具合の再発防止)", () => {
    function setVisibility(state: "visible" | "hidden") {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
      document.dispatchEvent(new Event("visibilitychange"));
    }

    afterEach(() => {
      setBgmStarter(null);
      setVisibility("visible");
    });

    it("解禁のタップの中で、いまの場面のBGMを始める(別の効果音が鳴るまで待たない)", () => {
      const starter = vi.fn(() => playBgm("/assets/audio/bgm-start.mp3"));
      setBgmStarter(starter);
      const play = vi.mocked(window.HTMLMediaElement.prototype.play);
      play.mockClear();
      unlockPlayback();
      expect(starter).toHaveBeenCalledTimes(1);
      // 無音のプライミング再生 + 実際の曲の再生
      expect(play.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("解禁前の操作で再生がブロックされて止まったままの曲は、次の解禁で鳴らし直す", () => {
      unlockPlayback(); // 1回目(iOSでは pointerdown など、有効な操作にならない)
      playBgm("/assets/audio/bgm-blocked.mp3"); // 再生を試みるが、要素は止まったまま
      const play = vi.mocked(window.HTMLMediaElement.prototype.play);
      play.mockClear();
      unlockPlayback(); // 2回目(click)。同じ曲の指定でも、止まっていれば鳴らし直す
      expect(play).toHaveBeenCalled();
    });

    it("バックグラウンドに回るとBGMを止め、戻ると鳴らし直す", () => {
      unlockPlayback();
      playBgm("/assets/audio/bgm-bg.mp3");
      const pause = vi.mocked(window.HTMLMediaElement.prototype.pause);
      const play = vi.mocked(window.HTMLMediaElement.prototype.play);
      pause.mockClear();
      setVisibility("hidden");
      expect(pause).toHaveBeenCalled();
      play.mockClear();
      setVisibility("visible");
      expect(play).toHaveBeenCalled();
    });

    it("見えていないあいだに曲が切り替わっても、鳴らさない(戻ったときに鳴らす)", () => {
      unlockPlayback();
      setVisibility("hidden");
      const play = vi.mocked(window.HTMLMediaElement.prototype.play);
      play.mockClear();
      playBgm("/assets/audio/bgm-hidden.mp3");
      expect(play).not.toHaveBeenCalled();
      setVisibility("visible");
      expect(play).toHaveBeenCalled();
    });
  });
});
