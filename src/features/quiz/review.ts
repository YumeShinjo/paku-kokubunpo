import { useMascotStore } from "@/app/store/mascotStore";
import { useReviewStore } from "@/app/store/reviewStore";

export interface ReviewOutcome {
  /** 正解して、星のついていた問題を克服した */
  overcame: boolean;
  /** 克服したことでアクセサリーのボーナスが増えた(同じ問題の2回目以降の克服では増えない) */
  bonusGained: boolean;
}

/** 克服ボーナスのアクセサリーid。問題ごとに1つ(同じ問題で何度も稼げないように) */
export const overcomeAccessoryId = (questionId: string) => `overcome-${questionId}`;

/**
 * 1問の解答結果を、復習システム(6章)に反映する。
 *  - 不正解: 星がつく
 *  - 正解: 星がついていれば外れ(克服)、その問題で初めての克服ならマスコットにアクセサリーがボーナスで増える
 */
export function recordReviewResult(questionId: string, correct: boolean): ReviewOutcome {
  const review = useReviewStore.getState();
  if (!correct) {
    review.markWrong(questionId);
    return { overcame: false, bonusGained: false };
  }
  const wasStarred = review.starredQuestionIds.includes(questionId);
  review.markOvercome(questionId);
  if (!wasStarred) return { overcame: false, bonusGained: false };

  const mascot = useMascotStore.getState();
  const accessoryId = overcomeAccessoryId(questionId);
  const bonusGained = !mascot.bonusAccessoryIds.includes(accessoryId);
  if (bonusGained) mascot.addBonusAccessory(accessoryId);
  return { overcame: true, bonusGained };
}
