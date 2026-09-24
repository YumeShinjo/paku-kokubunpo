import { useReviewStore } from "@/app/store/reviewStore";

export interface ReviewOutcome {
  /** 正解して、星のついていた問題を克服した */
  overcame: boolean;
}

/**
 * 1問の解答結果を、復習システム(6章)に反映する。
 *  - 不正解: 星がつく
 *  - 正解: 星がついていれば外れる(克服)。克服したときは、呼び出し側が克服ボーナス音を鳴らす。
 *    正答率(図鑑)には、克服も含めて、解答のたびに statsStore が反映する。
 *    マスコットのアクセサリーは、克服では増えない(アクセサリーはエリアクリアのときだけ付く。6章)。
 */
export function recordReviewResult(questionId: string, correct: boolean): ReviewOutcome {
  const review = useReviewStore.getState();
  if (!correct) {
    review.markWrong(questionId);
    return { overcame: false };
  }
  const wasStarred = review.starredQuestionIds.includes(questionId);
  review.markOvercome(questionId);
  return { overcame: wasStarred };
}
