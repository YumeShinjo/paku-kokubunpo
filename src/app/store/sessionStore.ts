import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/safeStorage";

/**
 * 途中まで遊んだステージの状態(3章: 途中離脱しても、すぐ再開できるようにする)。
 * 端末ローカルに保存する。保存するのは「最後に遊んでいた1ステージ」だけ(別のステージを始めたら置き換わる)。
 * 出題の並び(問題id)ごと保存するので、再開しても同じ問題の続きから遊べる。
 */
export interface SavedSession {
  stageId: string;
  areaId: string;
  /** そのステージで出す問題のid(出題順) */
  questionIds: string[];
  /** 次に解く問題の位置(0始まり) */
  index: number;
  correctCount: number;
  combo: number;
  maxCombo: number;
  /** ボス戦のHP(通常ステージでは 0) */
  hp: number;
  /** ボス戦のプレイヤーのライフ(通常ステージでは省略) */
  lives?: number;
}

interface SessionState {
  active: SavedSession | null;
  save: (session: SavedSession) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      active: null,
      save: (session) => set({ active: session }),
      clear: () => set({ active: null }),
    }),
    { name: "paku-kokubunpo:session", storage: safeJSONStorage },
  ),
);
