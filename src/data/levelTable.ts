/**
 * 経験値・レベル(クリア画面の演出強化)。
 * 見た目上の成長演出だけが目的で、進行度・難易度・解放条件には一切影響しない。
 * レベルは保存せず、累計経験値(expStore.totalExp)から、その都度ここで計算する。
 */
export const MAX_LEVEL = 50;
const BASE_STEP_EXP = 30;
/** ゆるやかな指数増加。1レベル上がるごとに、必要な経験値が約13%ずつ増える */
const GROWTH_RATE = 1.13;

/** レベル(1始まり)から、その次のレベルに上がるのに必要な経験値の量 */
function expStepForLevel(level: number): number {
  return Math.round(BASE_STEP_EXP * GROWTH_RATE ** (level - 1));
}

/** 各レベルに到達するのに必要な累計経験値(THRESHOLDS[0] = レベル1の開始 = 0) */
const THRESHOLDS: number[] = (() => {
  const table = [0];
  for (let level = 1; level < MAX_LEVEL; level++) {
    table.push(table[level - 1] + expStepForLevel(level));
  }
  return table;
})();

export interface LevelInfo {
  level: number;
  totalExp: number;
  /** 現在のレベルに入ってからの経験値 */
  expIntoLevel: number;
  /** 次のレベルまでに必要な経験値。最大レベルのときは null */
  expForNextLevel: number | null;
  /** 次のレベルまでの割合(0〜1)。最大レベルのときは1 */
  progress: number;
  isMaxLevel: boolean;
}

/** 累計経験値から、いまのレベルと、次のレベルまでの進み具合を求める */
export function getLevelInfo(totalExp: number): LevelInfo {
  const exp = Math.max(0, Math.floor(totalExp));
  let level = 1;
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const levelStart = THRESHOLDS[level - 1];
  const expIntoLevel = exp - levelStart;
  const isMaxLevel = level >= MAX_LEVEL;
  if (isMaxLevel) {
    return { level, totalExp: exp, expIntoLevel, expForNextLevel: null, progress: 1, isMaxLevel };
  }
  const expForNextLevel = THRESHOLDS[level] - levelStart;
  return { level, totalExp: exp, expIntoLevel, expForNextLevel, progress: expIntoLevel / expForNextLevel, isMaxLevel };
}
