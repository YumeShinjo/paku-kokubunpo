import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 音量・ミュート設定(7章: アカウント不要のローカル設定、端末に保存)。
 * audioUnlocked は9章のモバイル音声自動再生制約対応用のフラグ。
 * タイトル画面などでの最初の1タップ後に true にし、以降BGM/SEの再生を解禁する。
 */
interface SettingsState {
  bgmVolume: number; // 0-1
  seVolume: number; // 0-1
  muted: boolean;
  audioUnlocked: boolean;
  setBgmVolume: (v: number) => void;
  setSeVolume: (v: number) => void;
  setMuted: (muted: boolean) => void;
  unlockAudio: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      bgmVolume: 0.7,
      seVolume: 0.8,
      muted: false,
      audioUnlocked: false,
      setBgmVolume: (v) => set({ bgmVolume: v }),
      setSeVolume: (v) => set({ seVolume: v }),
      setMuted: (muted) => set({ muted }),
      unlockAudio: () => set({ audioUnlocked: true }),
    }),
    {
      name: "paku-kokubunpo:settings",
      // audioUnlocked はセッションごとに再度解禁が必要なブラウザもあるため永続化しない
      partialize: (s) => ({
        bgmVolume: s.bgmVolume,
        seVolume: s.seVolume,
        muted: s.muted,
      }),
    },
  ),
);
