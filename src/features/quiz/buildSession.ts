import type { Question } from "@/data/schema";
import {
  getQuestionsForArea,
  getQuestionsForStage,
  getQuestionsForUnit,
} from "@/data/questionLoader";
import { getStage } from "@/data/stages";
import { useReviewStore } from "@/app/store/reviewStore";
import { useStatsStore } from "@/app/store/statsStore";
import { selectQuestions } from "@/features/selection/selectQuestions";

/** 自由練習(6章)1回あたりの最大問題数。単元のプールがこれより少なければ全問。 */
export const FREE_PRACTICE_SIZE = 10;

/**
 * ステージ1回分の出題を組み立てる。
 * 呼び出すたびに選び直すので、小ボスの再挑戦では別の問題の組み合わせになる。
 * 復習(星)問題は通常ステージにだけ、そのステージの単元の分を別枠で混ぜる。小ボスは元々エリア全体からの複合出題のため混ぜない(6章)。
 */
export function buildStageSession(stageId: string, areaId: string): Question[] {
  const stage = getStage(stageId);
  if (!stage) return [];

  const pool = getQuestionsForStage(stageId);
  const starredIds = new Set(useReviewStore.getState().starredQuestionIds);
  // 復習(星)は、そのステージの単元の問題だけを混ぜる(例: 序章の「文節の区切り」に、単語の区切りの問題は混ざらない)。
  // 単元をまたいで混ぜると、ステージ選択に出る単元名と、実際に出る問題が食い違って見えるため。
  const stageUnits = new Set(pool.map((q) => q.unit));
  const starred =
    stage.type === "normal"
      ? getQuestionsForArea(areaId).filter((q) => starredIds.has(q.id) && stageUnits.has(q.unit))
      : [];

  return selectQuestions({
    pool,
    count: stage.pickCount ?? pool.length,
    recentIds: useStatsStore.getState().recentQuestionIds,
    starred,
  });
}

/** 自由練習(ストーリー・HPゲージなし): 指定単元の問題プールだけから出題する。 */
export function buildFreePracticeSession(unitId: string): Question[] {
  const pool = getQuestionsForUnit(unitId);
  return selectQuestions({
    pool,
    count: Math.min(FREE_PRACTICE_SIZE, pool.length),
    recentIds: useStatsStore.getState().recentQuestionIds,
  });
}
