import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/safeStorage";
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
  /**
   * ボス戦(小ボス・ラスボス)で負けた回数(ステージid → 回数)。負けるたびに、次の挑戦のライフが1ふえる(最大+4。bossRules.ts)。
   * クリアすると、そのボスの回数は消える。以前の保存データ(この項目がない)は、空として読む
   */
  bossLosses: Record<string, number>;
  /** 「助けてもらった」クリアのステージid(小ボスのみ)。clearedStageIds にも入る。あとで自力で勝つと、ここから外れる */
  assistedStageIds: string[];
  markStageCleared: (stageId: string, scoreGained: number) => void;
  /** ボス戦に負けた回数を1つふやす。ふやしたあとの回数を返す */
  recordBossLoss: (stageId: string) => number;
  /** 「助けてもらった」クリアにする(クリア扱い。得点は足さない) */
  markStageAssisted: (stageId: string) => void;
  isStageAssisted: (stageId: string) => boolean;
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
      bossLosses: {},
      assistedStageIds: [],
      // 自力でクリアしたとき: 助けてもらった印を消して、通常のクリアに上書きする。負けた回数も消す
      markStageCleared: (stageId, scoreGained) =>
        set((s) => ({
          clearedStageIds: s.clearedStageIds.includes(stageId)
            ? s.clearedStageIds
            : [...s.clearedStageIds, stageId],
          totalScore: s.totalScore + scoreGained,
          assistedStageIds: s.assistedStageIds.filter((id) => id !== stageId),
          bossLosses: Object.fromEntries(Object.entries(s.bossLosses).filter(([id]) => id !== stageId)),
        })),
      recordBossLoss: (stageId) => {
        const next = (get().bossLosses[stageId] ?? 0) + 1;
        set((s) => ({ bossLosses: { ...s.bossLosses, [stageId]: next } }));
        return next;
      },
      markStageAssisted: (stageId) =>
        set((s) => ({
          clearedStageIds: s.clearedStageIds.includes(stageId) ? s.clearedStageIds : [...s.clearedStageIds, stageId],
          assistedStageIds: s.assistedStageIds.includes(stageId) ? s.assistedStageIds : [...s.assistedStageIds, stageId],
          bossLosses: Object.fromEntries(Object.entries(s.bossLosses).filter(([id]) => id !== stageId)),
        })),
      isStageAssisted: (stageId) => get().assistedStageIds.includes(stageId),
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
    {
      name: "paku-kokubunpo:progress",
      storage: safeJSONStorage,
      // 以前の保存データには、bossLosses・assistedStageIds がない。ないときは空、壊れた値のときも空として読む
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProgressState>;
        const losses: Record<string, number> = {};
        if (p.bossLosses && typeof p.bossLosses === "object") {
          for (const [id, n] of Object.entries(p.bossLosses)) if (Number.isInteger(n) && n > 0 && n < 1000) losses[id] = n;
        }
        const assisted = Array.isArray(p.assistedStageIds) ? p.assistedStageIds.filter((id): id is string => typeof id === "string") : [];
        return { ...current, ...p, bossLosses: losses, assistedStageIds: assisted };
      },
    },
  ),
);
