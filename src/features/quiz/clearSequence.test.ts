import { describe, expect, it } from "vitest";
import { CLEAR_SEQUENCE_GAP_MS, planClearSequence } from "./clearSequence";
import type { SeKind } from "@/lib/audio";

const durations: Partial<Record<SeKind, number>> = { clear: 3000, lastBossClear: 1000, growth: 2500, pageUnlock: 1500 };
const dur = (k: SeKind) => durations[k] ?? 500;

describe("planClearSequence(クリア結果の演出の順番と時刻)", () => {
  it("エリアクリアでなければ、達成音だけ", () => {
    const plan = planClearSequence("clear", false, dur);
    expect(plan.steps).toEqual([{ phase: 0, at: 0, se: "clear" }]);
    expect(plan.endAt).toBe(3000);
  });

  it("エリアクリアは、達成音 → 成長音 → ページ解放音の順に、前の音が終わってから間を空けて始まる", () => {
    const plan = planClearSequence("clear", true, dur, 1000);
    expect(plan.steps).toEqual([
      { phase: 0, at: 0, se: "clear" },
      { phase: 1, at: 3000 + 1000, se: "growth" },
      { phase: 2, at: 3000 + 1000 + 2500 + 1000, se: "pageUnlock" },
    ]);
    expect(plan.endAt).toBe(3000 + 1000 + 2500 + 1000 + 1500);
  });

  it("どの音も、前の音が鳴り終わる前に次の音が始まらない(重ならない)", () => {
    for (const clearSe of ["clear", "subBossClear", "lastBossClear"] as const) {
      const plan = planClearSequence(clearSe, true, dur);
      for (let i = 1; i < plan.steps.length; i++) {
        const prev = plan.steps[i - 1];
        expect(plan.steps[i].at, clearSe).toBeGreaterThanOrEqual(prev.at + dur(prev.se) + CLEAR_SEQUENCE_GAP_MS);
      }
    }
  });
});
