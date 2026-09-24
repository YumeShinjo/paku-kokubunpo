import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * ランキング参加の状態(8章)。端末ローカルに保存する(アカウント不要)。
 * 得点そのものは progressStore.totalScore(累計得点)で、ここでは「参加中のクラス」と
 * 「サーバーへ送信済みの得点」だけを持つ。totalScore > lastSyncedScore の間は「未送信の得点がある」状態で、
 * オフラインで貯めた得点は、通信できるようになったときに自動で送られる(9章)。
 * 主人公のアイコン(profileStore)も、サーバーへ送信済みのものを syncedIcon に覚えておき、違っていれば同じ仕組みで送る。
 */
interface RankingState {
  classCode: string | null;
  nickname: string | null;
  lastSyncedScore: number;
  /** サーバーへ送信済みのアイコンの id。まだ送っていない(古い版から更新した直後など)ときは null */
  syncedIcon: string | null;
  /** 参加する。すでに参加中のクラスで呼べば、ニックネームの変更になる */
  join: (classCode: string, nickname: string, syncedScore: number, icon: string) => void;
  leave: () => void;
  markSynced: (score: number, icon?: string) => void;
}

export const useRankingStore = create<RankingState>()(
  persist(
    (set) => ({
      classCode: null,
      nickname: null,
      lastSyncedScore: 0,
      syncedIcon: null,
      join: (classCode, nickname, syncedScore, icon) =>
        set((s) => ({
          classCode,
          nickname,
          // 同じクラスのままの変更(ニックネームの変更)では、送信済みの得点を減らさない
          lastSyncedScore: s.classCode === classCode ? Math.max(s.lastSyncedScore, syncedScore) : syncedScore,
          syncedIcon: icon,
        })),
      leave: () => set({ classCode: null, nickname: null, lastSyncedScore: 0, syncedIcon: null }),
      // 送信済みの得点は減らさない(順番が前後して古い結果が返ってきても戻らないように)
      markSynced: (score, icon) =>
        set((s) => ({ lastSyncedScore: Math.max(s.lastSyncedScore, score), syncedIcon: icon ?? s.syncedIcon })),
    }),
    { name: "paku-kokubunpo:ranking" },
  ),
);
