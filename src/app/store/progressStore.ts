import { create } from "zustand";
import { persist } from "zustand/middleware";
import { playableAreas } from "@/data/areas";
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
  /**
   * 挑戦できるステージか。エリアが解放されていて(isAreaUnlocked)、かつ解放条件(Stage.requires)を満たしていること。
   *  - 小ボスは、そのエリアの通常ステージをすべてクリアしてから
   *  - ラスボス(王座の間)は、宰相(小ボス)を倒してから
   */
  isStageUnlocked: (stageId: string) => boolean;
  /**
   * エリアに入れるか。エリアは進行順(序章→1→2→…→7)の固定順でしか進めない。
   * 最初のエリア(序章)は常に入れる。それ以外は、1つ前のエリアの「関門」をクリアしたときだけ入れる。
   */
  isAreaUnlocked: (areaId: string) => boolean;
  /** 次のエリアを開く関門をクリアしたか。小ボスのいるエリアは小ボスの撃破、いないエリア(序章)は全ステージのクリア */
  isAreaGateCleared: (areaId: string) => boolean;
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
        if (!get().isAreaUnlocked(stage.areaId)) return false;
        return (stage.requires ?? []).every((id) => get().isStageCleared(id));
      },
      isAreaUnlocked: (areaId) => {
        const order = [...playableAreas].sort((a, b) => a.order - b.order);
        const index = order.findIndex((a) => a.id === areaId);
        if (index < 0) return false; // 存在しない・未実装のエリアには入れない
        return index === 0 || get().isAreaGateCleared(order[index - 1].id);
      },
      isAreaGateCleared: (areaId) => {
        const stages = getStagesForArea(areaId);
        const boss = stages.find((s) => s.type === "subBoss");
        if (boss) return get().isStageCleared(boss.id);
        return stages.length > 0 && stages.every((s) => get().isStageCleared(s.id));
      },
      isAreaCleared: (areaId) => {
        const stages = getStagesForArea(areaId);
        return stages.length > 0 && stages.every((s) => get().isStageCleared(s.id));
      },
    }),
    { name: "paku-kokubunpo:progress" },
  ),
);
