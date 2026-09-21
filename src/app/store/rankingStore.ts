import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * ランキング参加の状態(8章)。端末ローカルに保存する(アカウント不要)。
 * 得点そのものは progressStore.totalScore(累計得点)で、ここでは「参加中のクラス」と
 * 「サーバーへ送信済みの得点」だけを持つ。totalScore > lastSyncedScore の間は「未送信の得点がある」状態で、
 * オフラインで貯めた得点は、通信できるようになったときに自動で送られる(9章)。
 */
interface RankingState {
  classCode: string | null;
  nickname: string | null;
  lastSyncedScore: number;
  join: (classCode: string, nickname: string, syncedScore: number) => void;
  leave: () => void;
  markSynced: (score: number) => void;
}

export const useRankingStore = create<RankingState>()(
  persist(
    (set) => ({
      classCode: null,
      nickname: null,
      lastSyncedScore: 0,
      join: (classCode, nickname, syncedScore) => set({ classCode, nickname, lastSyncedScore: syncedScore }),
      leave: () => set({ classCode: null, nickname: null, lastSyncedScore: 0 }),
      // 送信済みの得点は減らさない(順番が前後して古い結果が返ってきても戻らないように)
      markSynced: (score) => set((s) => ({ lastSyncedScore: Math.max(s.lastSyncedScore, score) })),
    }),
    { name: "paku-kokubunpo:ranking" },
  ),
);
