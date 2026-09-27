import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/safeStorage";

/**
 * 経験値(クリア画面の演出強化)。端末ローカルに保存し、見た目上の成長演出だけに使う
 * (進行度・難易度・解放条件には影響しない)。レベルはここでは持たず、data/levelTable.ts で
 * totalExp からその都度計算する。
 * サーバー(Firestore)には、ランキングの得点と同じ考え方(features/exp/expSync.ts)で、
 * 匿名認証のuidに紐づけて累計値だけを保存する。totalExp > lastSyncedExp の間は「未送信の分がある」状態で、
 * オフラインで貯めた分は、通信できるようになったときに自動で送られる。
 */
interface ExpState {
  totalExp: number;
  /** 前回サーバーへ送れた累計値(未送信分があるかの判定に使う。ranking の lastSyncedScore と同じ考え方) */
  lastSyncedExp: number;
  addExp: (amount: number) => void;
  markSynced: (exp: number) => void;
}

export const useExpStore = create<ExpState>()(
  persist(
    (set) => ({
      totalExp: 0,
      lastSyncedExp: 0,
      addExp: (amount) => set((s) => ({ totalExp: s.totalExp + Math.max(0, Math.floor(amount)) })),
      // 送信済みの累計は減らさない(順番が前後して古い結果が返ってきても戻らないように)
      markSynced: (exp) => set((s) => ({ lastSyncedExp: Math.max(s.lastSyncedExp, exp) })),
    }),
    { name: "paku-kokubunpo:exp", storage: safeJSONStorage },
  ),
);
