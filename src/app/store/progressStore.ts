import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getStage, getStagesForArea } from "@/data/stages";

/**
 * ステージ進行状況(3章: クリアごとに達成演出+進捗自動保存、途中離脱してもすぐ再開できる)。
 * totalScore(累計得点)はランキング(8章)の得点になる。ランキングへの送信は features/ranking/scoreSync.ts が担い、
 * オフラインで貯めた分は通信できるときに自動で送られる(9章)。
 */
interface ProgressState {
  clearedStageIds: string[];
  totalScore: number;
  markStageCleared: (stageId: string, scoreGained: number) => void;
  isStageCleared: (stageId: string) => boolean;
  /** 解放条件(Stage.requires)を満たしていて、挑戦できるステージか。条件のないステージは常に true */
  isStageUnlocked: (stageId: string) => boolean;
  /** そのエリアの全ステージ(小ボス含む)がクリア済みか。マスコット成長判定に使う(6章)。 */
  isAreaCleared: (areaId: string) => boolean;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      clearedStageIds: [],
      totalScore: 0,
      markStageCleared: (stageId, scoreGained) =>
        set((s) => ({
          clearedStageIds: s.clearedStageIds.includes(stageId)
            ? s.clearedStageIds
            : [...s.clearedStageIds, stageId],
          totalScore: s.totalScore + scoreGained,
        })),
      isStageCleared: (stageId) => get().clearedStageIds.includes(stageId),
      isStageUnlocked: (stageId) => {
        const stage = getStage(stageId);
        if (!stage) return false;
        return (stage.requires ?? []).every((id) => get().isStageCleared(id));
      },
      isAreaCleared: (areaId) => {
        const stages = getStagesForArea(areaId);
        return stages.length > 0 && stages.every((s) => get().isStageCleared(s.id));
      },
    }),
    { name: "paku-kokubunpo:progress" },
  ),
);
