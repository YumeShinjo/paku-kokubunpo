import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * マスコット成長(6章)。growthStage はクリア済みエリア数と連動させ、
 * ベース画像+アクセサリー画像のレイヤー方式(表示側は features/mascot が担当)で
 * 「成長段階=表示するアクセサリーの組み合わせ」として管理する。
 * bonusAccessoryIds は復習克服ボーナス(星の問題を正解し直すと増える)。
 */
interface MascotState {
  growthStage: number;
  bonusAccessoryIds: string[];
  growTo: (stage: number) => void;
  addBonusAccessory: (accessoryId: string) => void;
}

export const useMascotStore = create<MascotState>()(
  persist(
    (set) => ({
      growthStage: 0,
      bonusAccessoryIds: [],
      growTo: (stage) =>
        set((s) => ({ growthStage: Math.max(s.growthStage, stage) })),
      addBonusAccessory: (accessoryId) =>
        set((s) => ({
          bonusAccessoryIds: s.bonusAccessoryIds.includes(accessoryId)
            ? s.bonusAccessoryIds
            : [...s.bonusAccessoryIds, accessoryId],
        })),
    }),
    { name: "paku-kokubunpo:mascot" },
  ),
);
