import { feedbackMessages, type FeedbackMessageKind } from "@/data/feedbackMessages";
import type { Rng } from "@/features/selection/selectQuestions";

/** 正解演出のパターン(3章: 2〜3パターンをランダムに出し、毎回同じ演出にしない)。CSS側に対応するクラスがある。 */
export const CORRECT_EFFECTS = ["pop", "sparkle", "shine"] as const;
export type CorrectEffect = (typeof CORRECT_EFFECTS)[number];

/** 候補から1つ選ぶ。2つ以上あるときは、直前と同じものを連続して選ばない。 */
export function pickDifferent<T>(
  items: readonly T[],
  previous: T | undefined,
  rng: Rng = Math.random,
): T {
  const candidates = items.length > 1 ? items.filter((item) => item !== previous) : items;
  return candidates[Math.floor(rng() * candidates.length)];
}

export function pickMessage(
  kind: FeedbackMessageKind,
  previous: string | undefined,
  rng: Rng = Math.random,
): string {
  return pickDifferent<string>(feedbackMessages[kind], previous, rng);
}

/** 連続正解のコンボ表示に使う文言。2連続未満は表示しない(画面を止めず、小さく伸びていく演出)。 */
export function comboLabel(combo: number): string | null {
  if (combo < 2) return null;
  return `${combo}連続[れんぞく]!`;
}
