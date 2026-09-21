import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GuideKey } from "@/data/engineGuide";

/**
 * 操作ガイド(初回プレイのみ表示)の既読管理。端末ローカルに保存する。
 * 設定画面から resetGuides() で「もう一度見る」ことができる。
 */
interface TutorialState {
  seenGuides: GuideKey[];
  markSeen: (key: GuideKey) => void;
  resetGuides: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      seenGuides: [],
      markSeen: (key) =>
        set((s) => (s.seenGuides.includes(key) ? s : { seenGuides: [...s.seenGuides, key] })),
      resetGuides: () => set({ seenGuides: [] }),
    }),
    { name: "paku-kokubunpo:tutorial" },
  ),
);
