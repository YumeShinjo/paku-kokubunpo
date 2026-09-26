import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/safeStorage";
import { RECENT_LIMIT } from "@/features/selection/selectQuestions";
import { UNIT_ACCURACY_WINDOW } from "@/features/zukan/unitAccuracy";

/**
 * 学習の履歴。どちらも「直近の解答」を保持する仕組みで、同じ recordAnswer で更新する。
 * - recentQuestionIds: 全単元をまとめた直近の問題id(古い順)。出題選定の「直近出題の除外」用(5章)
 * - unitRecent: 単元ごとの直近 UNIT_ACCURACY_WINDOW 問の正誤(古い順)。
 *   ことだまの書(図鑑)の単元別正答率グラフの元データ(6章)
 */
interface StatsState {
  recentQuestionIds: string[];
  unitRecent: Record<string, boolean[]>;
  recordAnswer: (question: { id: string; unit: string }, correct: boolean) => void;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set) => ({
      recentQuestionIds: [],
      unitRecent: {},
      recordAnswer: (question, correct) =>
        set((s) => ({
          recentQuestionIds: [
            ...s.recentQuestionIds.filter((id) => id !== question.id),
            question.id,
          ].slice(-RECENT_LIMIT),
          unitRecent: {
            ...s.unitRecent,
            [question.unit]: [...(s.unitRecent[question.unit] ?? []), correct].slice(
              -UNIT_ACCURACY_WINDOW,
            ),
          },
        })),
    }),
    {
      name: "paku-kokubunpo:stats",
      storage: safeJSONStorage,
      // v0 は累計の unitStats(正答数/解答数)だった。累計からは直近の並びを復元できないので破棄する。
      version: 1,
      migrate: (persisted) => {
        const old = persisted as { recentQuestionIds?: string[] } | undefined;
        return { recentQuestionIds: old?.recentQuestionIds ?? [], unitRecent: {} };
      },
    },
  ),
);
