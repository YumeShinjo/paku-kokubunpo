import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 復習システム(6章)。星のついた問題は「マスコットの好物」で、通常ステージへ別枠(約20%)で混ざる
 * (混入は features/selection/selectQuestions.ts と features/quiz/buildSession.ts が担う)。
 *  - 間違えた問題には自動で星がつく(markWrong)
 *  - 自分で星をつけたり外したりもできる(toggleStar。「お気に入り登録」)
 *  - 正解し直す(克服)と星が外れる(markOvercome)。克服のボーナスは features/quiz/review.ts が付ける
 */
interface ReviewState {
  starredQuestionIds: string[];
  markWrong: (questionId: string) => void;
  markOvercome: (questionId: string) => void;
  toggleStar: (questionId: string) => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      starredQuestionIds: [],
      markWrong: (questionId) =>
        set((s) => ({
          starredQuestionIds: s.starredQuestionIds.includes(questionId)
            ? s.starredQuestionIds
            : [...s.starredQuestionIds, questionId],
        })),
      markOvercome: (questionId) =>
        set((s) => ({
          starredQuestionIds: s.starredQuestionIds.filter((id) => id !== questionId),
        })),
      toggleStar: (questionId) =>
        set((s) => ({
          starredQuestionIds: s.starredQuestionIds.includes(questionId)
            ? s.starredQuestionIds.filter((id) => id !== questionId)
            : [...s.starredQuestionIds, questionId],
        })),
    }),
    { name: "paku-kokubunpo:review" },
  ),
);
