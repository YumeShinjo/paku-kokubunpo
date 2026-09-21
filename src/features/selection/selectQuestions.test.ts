import { describe, expect, it } from "vitest";
import type { ChoiceQuestion, Question } from "@/data/schema";
import {
  arrangeAvoidingRuns,
  MAX_SAME_UNIT_RUN,
  selectQuestions,
  stratifiedPick,
  type Rng,
} from "./selectQuestions";

/** 再現性のある擬似乱数(mulberry32) */
function seeded(seed: number): Rng {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function q(id: string, unit: string): ChoiceQuestion {
  return {
    id,
    unit,
    engine: "choice",
    prompt: [{ text: id }],
    choices: [{ id: "a", text: [{ text: "a" }] }],
    correctChoiceId: "a",
  };
}

function makePool(unitSizes: Record<string, number>): Question[] {
  return Object.entries(unitSizes).flatMap(([unit, size]) =>
    Array.from({ length: size }, (_, i) => q(`${unit}-${i + 1}`, unit)),
  );
}

function countByUnit(questions: readonly Question[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const item of questions) result[item.unit] = (result[item.unit] ?? 0) + 1;
  return result;
}

function longestRun(items: readonly { unit: string }[]): number {
  let longest = 0;
  let run = 0;
  let last: string | null = null;
  for (const item of items) {
    run = item.unit === last ? run + 1 : 1;
    last = item.unit;
    longest = Math.max(longest, run);
  }
  return longest;
}

describe("stratifiedPick(層化抽出)", () => {
  it("単元数で割り切れる件数は、単元ごとに均等になる", () => {
    const pool = makePool({ a: 10, b: 10, c: 10 });
    for (let seed = 1; seed <= 30; seed++) {
      const picked = stratifiedPick(pool, 9, [], seeded(seed));
      expect(countByUnit(picked)).toEqual({ a: 3, b: 3, c: 3 });
    }
  });

  it("割り切れない場合も、単元間の差は1問以内に収まる", () => {
    const pool = makePool({ a: 10, b: 10, c: 10 });
    for (let seed = 1; seed <= 30; seed++) {
      const counts = Object.values(countByUnit(stratifiedPick(pool, 10, [], seeded(seed))));
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });

  it("候補が少ない単元の分は、他の単元へ回る", () => {
    const pool = makePool({ a: 1, b: 10 });
    const picked = stratifiedPick(pool, 6, [], seeded(1));
    expect(countByUnit(picked)).toEqual({ a: 1, b: 5 });
  });

  it("件数がプール以上なら全件を返す", () => {
    const pool = makePool({ a: 3, b: 2 });
    expect(stratifiedPick(pool, 5, [], seeded(1))).toHaveLength(5);
    expect(stratifiedPick(pool, 99, [], seeded(1))).toHaveLength(5);
  });

  it("重複して選ばれない", () => {
    const pool = makePool({ a: 8, b: 8, c: 8 });
    const ids = stratifiedPick(pool, 15, [], seeded(7)).map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("stratifiedPick(直近出題の除外)", () => {
  it("直近に出した問題は、他に候補があるかぎり選ばれない", () => {
    const pool = makePool({ a: 10 });
    const recent = pool.slice(0, 5).map((x) => x.id);
    for (let seed = 1; seed <= 30; seed++) {
      const picked = stratifiedPick(pool, 5, recent, seeded(seed));
      expect(picked.some((x) => recent.includes(x.id))).toBe(false);
    }
  });

  it("新しい問題が足りない場合だけ、直近のうち古いものから再利用する", () => {
    const pool = makePool({ a: 5 });
    const recentOldToNew = ["a-3", "a-1", "a-5", "a-2", "a-4"];
    const picked = stratifiedPick(pool, 3, recentOldToNew, seeded(1)).map((x) => x.id);
    expect(picked.sort()).toEqual(["a-1", "a-3", "a-5"]);
  });
});

describe("arrangeAvoidingRuns(同一単元の連続回避)", () => {
  it("並べ替えても要素は増減しない", () => {
    const items = makePool({ a: 4, b: 3, c: 2 });
    const arranged = arrangeAvoidingRuns(items, MAX_SAME_UNIT_RUN, seeded(3));
    expect(arranged.map((x) => x.id).sort()).toEqual(items.map((x) => x.id).sort());
  });

  it("並べ切れる入力なら、どんな乱数でも同一単元が3問以上連続しない", () => {
    const cases: Record<string, number>[] = [
      { a: 5, b: 5 },
      { a: 10, b: 5, c: 5 },
      { a: 6, b: 3 },
      { a: 15, b: 15, c: 15, d: 15 },
      { a: 5, b: 5, c: 5, d: 5, e: 5, f: 5 },
      { a: 7, b: 1, c: 1, d: 1 },
    ];
    for (const sizes of cases) {
      const items = makePool(sizes);
      for (let seed = 1; seed <= 200; seed++) {
        const arranged = arrangeAvoidingRuns(items, MAX_SAME_UNIT_RUN, seeded(seed));
        expect(longestRun(arranged)).toBeLessThanOrEqual(MAX_SAME_UNIT_RUN);
      }
    }
  });

  it("単元が1つしかないなど不可能な入力でも、例外を出さず全件を返す", () => {
    const items = makePool({ a: 6 });
    expect(arrangeAvoidingRuns(items, MAX_SAME_UNIT_RUN, seeded(1))).toHaveLength(6);
  });

  it("1単元が多すぎて避けきれない場合も、違反は最小限に留まる", () => {
    const items = makePool({ a: 8, b: 1 });
    const arranged = arrangeAvoidingRuns(items, MAX_SAME_UNIT_RUN, seeded(1));
    expect(arranged).toHaveLength(9);
  });
});

describe("selectQuestions(統合)", () => {
  it("単元が偏らず、3問以上連続もしない", () => {
    const pool = makePool({ a: 12, b: 12, c: 12 });
    for (let seed = 1; seed <= 50; seed++) {
      const selected = selectQuestions({
        pool,
        count: 9,
        recentIds: [],
        rng: seeded(seed),
      });
      expect(countByUnit(selected)).toEqual({ a: 3, b: 3, c: 3 });
      expect(longestRun(selected)).toBeLessThanOrEqual(MAX_SAME_UNIT_RUN);
    }
  });

  it("復習(星)の問題は通常枠とは別に約20%が加わり、通常枠と重複しない", () => {
    const pool = makePool({ a: 10, b: 10 });
    const starred = makePool({ x: 5 }).map((s, i) => ({ ...s, id: `star-${i}` }));
    const selected = selectQuestions({
      pool,
      count: 10,
      recentIds: [],
      starred,
      rng: seeded(5),
    });
    const starIds = selected.filter((x) => x.id.startsWith("star-"));
    expect(starIds).toHaveLength(2);
    expect(selected).toHaveLength(12);
    expect(new Set(selected.map((x) => x.id)).size).toBe(12);
  });

  it("星の問題が通常枠にすでに含まれている場合は、二重に足さない", () => {
    const pool = makePool({ a: 5 });
    const selected = selectQuestions({
      pool,
      count: 5,
      recentIds: [],
      starred: pool.slice(0, 2),
      rng: seeded(1),
    });
    expect(selected).toHaveLength(5);
  });

  it("星の問題は直近出題の除外対象外(直近に出していても復習枠に入れる)", () => {
    const pool = makePool({ a: 10 });
    const starred = [q("star-1", "z")];
    const selected = selectQuestions({
      pool,
      count: 5,
      recentIds: ["star-1"],
      starred,
      rng: seeded(1),
    });
    expect(selected.some((x) => x.id === "star-1")).toBe(true);
  });

  it("星の問題がなければ通常枠だけを返す", () => {
    const pool = makePool({ a: 5, b: 5 });
    expect(
      selectQuestions({ pool, count: 6, recentIds: [], rng: seeded(1) }),
    ).toHaveLength(6);
  });
});
