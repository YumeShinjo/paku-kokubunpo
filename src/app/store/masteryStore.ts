import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/safeStorage";

/**
 * 全問題のうち、一度でも正解したことのある問題のユニーク数(進捗表示。クリア画面の演出強化)。
 * 経験値・レベルの代わりに、素直な「累計正解数/全問題数」で進み具合を見せる
 * (進行度・難易度・解放条件には影響しない)。
 * 同じ問題に周回プレイで再度正解しても、2重には数えない(Set相当。配列は表示・保存の都合上そのまま持つ)。
 * サーバー(Firestore)には、ランキングと同じ匿名認証ユーザーに紐づけて、件数だけを同期する
 * (features/mastery/masterySync.ts)。
 */
interface MasteryState {
  correctQuestionIds: string[];
  /** 前回サーバーへ送れた件数(未送信分があるかの判定に使う。ranking の lastSyncedScore と同じ考え方) */
  lastSyncedCount: number;
  /** 正解した問題を記録する(すでに記録済みなら何もしない) */
  recordCorrect: (questionId: string) => void;
  markSynced: (count: number) => void;
}

export const useMasteryStore = create<MasteryState>()(
  persist(
    (set, get) => ({
      correctQuestionIds: [],
      lastSyncedCount: 0,
      recordCorrect: (questionId) => {
        if (get().correctQuestionIds.includes(questionId)) return;
        set((s) => ({ correctQuestionIds: [...s.correctQuestionIds, questionId] }));
      },
      // 送信済みの件数は減らさない(順番が前後して古い結果が返ってきても戻らないように)
      markSynced: (count) => set((s) => ({ lastSyncedCount: Math.max(s.lastSyncedCount, count) })),
    }),
    { name: "paku-kokubunpo:mastery", storage: safeJSONStorage },
  ),
);
