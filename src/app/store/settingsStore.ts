import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/safeStorage";

/**
 * 音量・ミュート設定(7章: アカウント不要のローカル設定、端末に保存)。
 * audioUnlocked は9章のモバイル音声自動再生制約対応用のフラグ。
 * タイトル画面などでの最初の1タップ後に true にし、以降BGM/SEの再生を解禁する。
 */
/** 文字の大きさ(せってい・アクセシビリティ対応)。「標準」を基準に、全体を一律で拡大・縮小する */
export const TEXT_SIZES = ["small", "standard", "large"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

interface SettingsState {
  bgmVolume: number; // 0-1
  seVolume: number; // 0-1
  muted: boolean;
  audioUnlocked: boolean;
  textSize: TextSize;
  setBgmVolume: (v: number) => void;
  setSeVolume: (v: number) => void;
  setMuted: (muted: boolean) => void;
  unlockAudio: () => void;
  setTextSize: (size: TextSize) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      bgmVolume: 0.7,
      seVolume: 0.8,
      muted: false,
      audioUnlocked: false,
      textSize: "standard",
      setBgmVolume: (v) => set({ bgmVolume: v }),
      setSeVolume: (v) => set({ seVolume: v }),
      setMuted: (muted) => set({ muted }),
      unlockAudio: () => set({ audioUnlocked: true }),
      setTextSize: (textSize) => set({ textSize }),
    }),
    {
      name: "paku-kokubunpo:settings",
      storage: safeJSONStorage,
      // audioUnlocked はセッションごとに再度解禁が必要なブラウザもあるため永続化しない
      partialize: (s) => ({
        bgmVolume: s.bgmVolume,
        seVolume: s.seVolume,
        muted: s.muted,
        textSize: s.textSize,
      }),
      // 保存内容に知らない値(壊れた保存・将来のデータ)が入っていたら、標準に戻す
      merge: (persisted, current) => {
        const saved = (persisted as { textSize?: unknown } | undefined)?.textSize;
        return {
          ...current,
          ...(persisted as object),
          textSize: TEXT_SIZES.includes(saved as TextSize) ? (saved as TextSize) : current.textSize,
        };
      },
    },
  ),
);
