import type { Question } from "@/data/schema";

/**
 * 出題選定ロジック(5章): 完全ランダムではなく、以下を組み合わせて出題セットを作る。
 *  1. 層化抽出: 単元ごとに候補を均等に確保する
 *  2. 直近出題の除外: 直近 RECENT_LIMIT 問は、他に候補があるかぎり再選定しない
 *  3. 連続回避: 同一単元の問題が MAX_SAME_UNIT_RUN 問を超えて連続しないよう並べる
 *  4. 復習(星)問題は上記の抽出枠とは別枠で、REVIEW_RATIO 程度を混ぜ込む(6章)
 * 状態を持たない純粋関数として実装し、乱数は注入できる(テスト用)。
 */

export const RECENT_LIMIT = 20;
export const MAX_SAME_UNIT_RUN = 2;
export const REVIEW_RATIO = 0.2;

export type Rng = () => number;

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 層化抽出+直近除外。
 * recentIds は古い順(末尾が最新)。単元の順番を乱数で決めたうえで、単元を1問ずつ巡回して
 * 取っていくので、count が単元数で割り切れなくても偏らず、候補が足りない単元は自然に他へ回る。
 * 単元内では「直近に出していない問題」を優先し、足りない場合だけ古い順に再利用する。
 */
export function stratifiedPick(
  pool: readonly Question[],
  count: number,
  recentIds: readonly string[],
  rng: Rng,
): Question[] {
  if (count >= pool.length) return [...pool];
  if (count <= 0) return [];

  const recentRank = new Map(recentIds.map((id, i) => [id, i]));
  const groups = new Map<string, Question[]>();
  for (const q of pool) {
    const group = groups.get(q.unit);
    if (group) group.push(q);
    else groups.set(q.unit, [q]);
  }

  const queues = new Map<string, Question[]>();
  for (const [unit, members] of groups) {
    const fresh = shuffle(
      members.filter((q) => !recentRank.has(q.id)),
      rng,
    );
    const stale = members
      .filter((q) => recentRank.has(q.id))
      .sort((a, b) => recentRank.get(a.id)! - recentRank.get(b.id)!);
    queues.set(unit, [...fresh, ...stale]);
  }

  const unitOrder = shuffle([...queues.keys()], rng);
  const picked: Question[] = [];
  while (picked.length < count) {
    let progressed = false;
    for (const unit of unitOrder) {
      if (picked.length >= count) break;
      const next = queues.get(unit)!.shift();
      if (next) {
        picked.push(next);
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  return picked;
}

/** 残りの単元別個数から、tail(直前の単元とその連続数)を踏まえて制約を守って並べ切れるか。 */
function canArrange(
  counts: ReadonlyMap<string, number>,
  total: number,
  lastUnit: string | null,
  run: number,
  maxRun: number,
): boolean {
  for (const [unit, count] of counts) {
    if (count === 0) continue;
    const others = total - count;
    const capacity = maxRun * (others + 1) - (unit === lastUnit ? run : 0);
    if (count > capacity) return false;
  }
  return true;
}

/**
 * 同一単元が maxRun 問を超えて連続しないように並べ替える。
 * 毎回「置いても残りが並べ切れる」候補からランダムに選ぶので、最後に同じ単元だけが残る
 * 行き止まりを避けられる。そもそも不可能な入力(1単元しかない等)では、違反を最小限に留める。
 */
export function arrangeAvoidingRuns<T extends { unit: string }>(
  items: readonly T[],
  maxRun: number,
  rng: Rng,
): T[] {
  const remaining = shuffle(items, rng);
  const counts = new Map<string, number>();
  for (const item of remaining) counts.set(item.unit, (counts.get(item.unit) ?? 0) + 1);

  const result: T[] = [];
  let lastUnit: string | null = null;
  let run = 0;

  while (remaining.length > 0) {
    const total = remaining.length;
    const allowed: number[] = [];
    remaining.forEach((item, i) => {
      if (!(item.unit === lastUnit && run >= maxRun)) allowed.push(i);
    });

    const good = allowed.filter((i) => {
      const unit = remaining[i].unit;
      const next = new Map(counts);
      next.set(unit, next.get(unit)! - 1);
      return canArrange(next, total - 1, unit, unit === lastUnit ? run + 1 : 1, maxRun);
    });

    let candidates = good;
    if (candidates.length === 0) {
      const source = allowed.length > 0 ? allowed : remaining.map((_, i) => i);
      const maxCount = Math.max(...source.map((i) => counts.get(remaining[i].unit)!));
      candidates = source.filter((i) => counts.get(remaining[i].unit)! === maxCount);
    }

    const index = candidates[Math.floor(rng() * candidates.length)];
    const [chosen] = remaining.splice(index, 1);
    counts.set(chosen.unit, counts.get(chosen.unit)! - 1);
    run = chosen.unit === lastUnit ? run + 1 : 1;
    lastUnit = chosen.unit;
    result.push(chosen);
  }
  return result;
}

export interface SelectInput {
  /** 出題候補のプール */
  pool: readonly Question[];
  /** 通常枠で出題する問題数(復習枠は別) */
  count: number;
  /** 直近に出題した問題id。古い順(末尾が最新) */
  recentIds: readonly string[];
  /** 復習(星)の候補。抽出ルール・直近除外の対象外で、別枠として混ぜる */
  starred?: readonly Question[];
  reviewRatio?: number;
  rng?: Rng;
}

export function selectQuestions(input: SelectInput): Question[] {
  const rng = input.rng ?? Math.random;
  const base = stratifiedPick(input.pool, input.count, input.recentIds, rng);

  const baseIds = new Set(base.map((q) => q.id));
  const reviewCandidates = (input.starred ?? []).filter((q) => !baseIds.has(q.id));
  const reviewCount =
    reviewCandidates.length === 0
      ? 0
      : Math.min(
          reviewCandidates.length,
          Math.max(1, Math.round(base.length * (input.reviewRatio ?? REVIEW_RATIO))),
        );
  const review = shuffle(reviewCandidates, rng).slice(0, reviewCount);

  return arrangeAvoidingRuns([...base, ...review], MAX_SAME_UNIT_RUN, rng);
}
