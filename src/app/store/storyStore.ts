import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 視聴済みストーリーイベントの記録と、ストーリー中に選んだ選択肢。
 * 同じ演出を再訪のたびに繰り返さないための状態で、端末ローカルの進捗保存の一部として
 * persist する(3章: 進捗自動保存)。
 */
interface StoryState {
  seenStoryIds: string[];
  /** 選択肢のあるイベントごとに、選んだ選択肢のキー(例: 王座の間のエンディング分岐)。将来の称号(二つ名)などに使う */
  choices: Record<string, string>;
  hasSeen: (storyId: string) => boolean;
  markSeen: (storyId: string) => void;
  recordChoice: (storyId: string, optionKey: string) => void;
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      seenStoryIds: [],
      choices: {},
      hasSeen: (storyId) => get().seenStoryIds.includes(storyId),
      markSeen: (storyId) =>
        set((s) =>
          s.seenStoryIds.includes(storyId)
            ? s
            : { seenStoryIds: [...s.seenStoryIds, storyId] },
        ),
      recordChoice: (storyId, optionKey) =>
        set((s) => ({ choices: { ...s.choices, [storyId]: optionKey } })),
    }),
    { name: "paku-kokubunpo:story" },
  ),
);
