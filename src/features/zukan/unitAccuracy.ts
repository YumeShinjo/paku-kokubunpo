import type { RubyText } from "@/data/schema";
import type { UnitMeta } from "@/data/units";

/** 単元別正答率の対象とする、単元ごとの直近の解答数(6章) */
export const UNIT_ACCURACY_WINDOW = 10;

/** ことだまの書(6章)の単元別正答率グラフ1行分。 */
export interface UnitAccuracyRow {
  unitId: string;
  areaId: string;
  label: RubyText;
  /** 直近の解答(最大 UNIT_ACCURACY_WINDOW 問)のうち正解だった数 */
  correct: number;
  /** 直近の解答数(最大 UNIT_ACCURACY_WINDOW) */
  total: number;
  /** 0〜1。まだ1問も解いていない単元は null */
  rate: number | null;
  /** 「にがて」の目印を出すか */
  weak: boolean;
}

/** これ未満の正答率で、かつ WEAK_MIN_ATTEMPTS 問以上解いていれば「にがて」とする */
export const WEAK_RATE = 0.6;
export const WEAK_MIN_ATTEMPTS = 3;

/**
 * 単元ごとの「直近10問」の正誤履歴(古い順)から正答率の行を作る。
 * 累計ではなく直近ベースなので、克服すればすぐ棒が伸び、逆に最近つまずいた単元はすぐ目立つ。
 */
export function buildUnitAccuracyRows(
  metas: readonly UnitMeta[],
  recentResults: Readonly<Record<string, readonly boolean[]>>,
  availableUnitIds: ReadonlySet<string>,
): UnitAccuracyRow[] {
  return metas
    .filter((meta) => availableUnitIds.has(meta.id))
    .map((meta) => {
      const results = (recentResults[meta.id] ?? []).slice(-UNIT_ACCURACY_WINDOW);
      const correct = results.filter(Boolean).length;
      const total = results.length;
      const rate = total === 0 ? null : correct / total;
      return {
        unitId: meta.id,
        areaId: meta.areaId,
        label: meta.label,
        correct,
        total,
        rate,
        weak: rate !== null && total >= WEAK_MIN_ATTEMPTS && rate < WEAK_RATE,
      };
    });
}
