import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * マスコット成長(6章)。growthStage はクリア済みエリア数と連動させ、
 * ベース画像+アクセサリー画像のレイヤー方式(表示側は features/mascot が担当)で
 * 「成長段階=表示するアクセサリーの組み合わせ」として管理する。
 * アクセサリーはエリアクリアのときだけ増える(7段階)。星の問題の克服では増えない。
 */
interface MascotState {
  growthStage: number;
  growTo: (stage: number) => void;
}

export const useMascotStore = create<MascotState>()(
  persist(
    (set) => ({
      growthStage: 0,
      growTo: (stage) =>
        set((s) => ({ growthStage: Math.max(s.growthStage, stage) })),
    }),
    {
      name: "paku-kokubunpo:mascot",
      // 旧版が保存していた克服ボーナス(bonusAccessoryIds)は使わなくなったので、次の保存から消す
      partialize: (s) => ({ growthStage: s.growthStage }),
    },
  ),
);
