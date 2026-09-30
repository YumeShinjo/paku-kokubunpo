import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/safeStorage";

/**
 * 言の葉の森(ことわざ・故事成語のミニゲーム)の記録。本編の進捗・ランキングの累計正解数とは、まったく別に持つ。
 *  - collectedIds: 初めて正解した問題のid(「集めた葉」)。一度集めたら、あとで間違えても減らない
 *  - missedIds: まちがえた問題のid。正解すると外れる(次のラウンドで優先して出す)
 * 端末(localStorage の paku-kokubunpo:kotonoha)にだけ保存する。引き継ぎコードには含めない。
 * 「データを初期化」は、paku-kokubunpo: で始まるキーを全部消すので、このキーも消える。
 */
interface KotonohaState {
  collectedIds: string[];
  missedIds: string[];
  /** 1問の結果を記録する。その問題の葉を、はじめて集めたときは true を返す */
  recordResult: (questionId: string, correct: boolean) => boolean;
}

export const useKotonohaStore = create<KotonohaState>()(
  persist(
    (set, get) => ({
      collectedIds: [],
      missedIds: [],
      recordResult: (questionId, correct) => {
        const { collectedIds, missedIds } = get();
        if (correct) {
          const isNew = !collectedIds.includes(questionId);
          set({
            collectedIds: isNew ? [...collectedIds, questionId] : collectedIds,
            missedIds: missedIds.filter((id) => id !== questionId),
          });
          return isNew;
        }
        if (!missedIds.includes(questionId)) set({ missedIds: [...missedIds, questionId] });
        return false;
      },
    }),
    { name: "paku-kokubunpo:kotonoha", storage: safeJSONStorage },
  ),
);
