import { describe, expect, it } from "vitest";
import type { UnitMeta } from "@/data/units";
import { buildUnitAccuracyRows, UNIT_ACCURACY_WINDOW } from "./unitAccuracy";

const metas: UnitMeta[] = [
  { id: "u1", areaId: "a", label: [{ text: "単元1" }] },
  { id: "u2", areaId: "a", label: [{ text: "単元2" }] },
  { id: "u3", areaId: "b", label: [{ text: "単元3" }] },
];

const T = true;
const F = false;

describe("buildUnitAccuracyRows(単元ごとの直近10問ベース)", () => {
  it("直近の正誤から正答率を計算し、メタ情報の並び順で返す", () => {
    const rows = buildUnitAccuracyRows(
      metas,
      { u1: [T, T, T, T, T, T, T, T, F, F], u2: [F, F, F, T] },
      new Set(["u1", "u2", "u3"]),
    );
    expect(rows.map((r) => r.unitId)).toEqual(["u1", "u2", "u3"]);
    expect(rows[0]).toMatchObject({ correct: 8, total: 10 });
    expect(rows[0].rate).toBeCloseTo(0.8);
    expect(rows[1]).toMatchObject({ correct: 1, total: 4 });
    expect(rows[1].rate).toBeCloseTo(0.25);
  });

  it("10問を超える履歴があっても、直近10問だけで計算する(古い誤答は影響しない)", () => {
    const history = [...Array(20).fill(F), ...Array(10).fill(T)];
    const [row] = buildUnitAccuracyRows(metas.slice(0, 1), { u1: history }, new Set(["u1"]));
    expect(UNIT_ACCURACY_WINDOW).toBe(10);
    expect(row).toMatchObject({ correct: 10, total: 10, rate: 1, weak: false });
  });

  it("直近で崩れた単元は、以前できていても正答率が下がる", () => {
    const history = [...Array(20).fill(T), ...Array(8).fill(F), T, T];
    const [row] = buildUnitAccuracyRows(metas.slice(0, 1), { u1: history }, new Set(["u1"]));
    expect(row).toMatchObject({ correct: 2, total: 10, weak: true });
  });

  it("まだ解いていない単元は rate が null で、にがて扱いにならない", () => {
    const [row] = buildUnitAccuracyRows(metas.slice(0, 1), {}, new Set(["u1"]));
    expect(row.rate).toBeNull();
    expect(row.weak).toBe(false);
  });

  it("出題データがない単元は表示しない", () => {
    const rows = buildUnitAccuracyRows(metas, {}, new Set(["u1"]));
    expect(rows.map((r) => r.unitId)).toEqual(["u1"]);
  });

  it("にがて判定: 3問以上解いて正答率6割未満のときだけ", () => {
    const rows = buildUnitAccuracyRows(
      metas,
      {
        u1: [T, F],
        u2: [F, F, F, F, T],
        u3: [T, T, T, F, F],
      },
      new Set(["u1", "u2", "u3"]),
    );
    expect(rows.map((r) => r.weak)).toEqual([false, true, false]);
  });
});
