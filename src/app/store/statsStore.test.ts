import { beforeEach, describe, expect, it } from "vitest";
import { RECENT_LIMIT } from "@/features/selection/selectQuestions";
import { UNIT_ACCURACY_WINDOW } from "@/features/zukan/unitAccuracy";
import { useStatsStore } from "./statsStore";

describe("statsStore.recordAnswer", () => {
  beforeEach(() => {
    useStatsStore.setState({ unitRecent: {}, recentQuestionIds: [] });
  });

  it("単元ごとに正誤を古い順で積み上げる", () => {
    const { recordAnswer } = useStatsStore.getState();
    recordAnswer({ id: "q1", unit: "u1" }, true);
    recordAnswer({ id: "q2", unit: "u1" }, false);
    recordAnswer({ id: "q3", unit: "u2" }, true);
    expect(useStatsStore.getState().unitRecent).toEqual({
      u1: [true, false],
      u2: [true],
    });
  });

  it("単元ごとの履歴は直近 UNIT_ACCURACY_WINDOW(10)問までで、古いものから押し出される", () => {
    const { recordAnswer } = useStatsStore.getState();
    // 最初の5問は不正解、その後10問は正解 → 直近10問は全て正解になる
    for (let i = 0; i < 5; i++) recordAnswer({ id: `q${i}`, unit: "u" }, false);
    for (let i = 5; i < 15; i++) recordAnswer({ id: `q${i}`, unit: "u" }, true);
    const results = useStatsStore.getState().unitRecent.u;
    expect(UNIT_ACCURACY_WINDOW).toBe(10);
    expect(results).toHaveLength(10);
    expect(results.every(Boolean)).toBe(true);
  });

  it("ある単元の履歴は、他の単元の解答では押し出されない", () => {
    const { recordAnswer } = useStatsStore.getState();
    recordAnswer({ id: "a1", unit: "a" }, false);
    for (let i = 0; i < 30; i++) recordAnswer({ id: `b${i}`, unit: "b" }, true);
    expect(useStatsStore.getState().unitRecent.a).toEqual([false]);
  });

  it("直近出題(問題id)は古い順で、同じ問題を再度解くと末尾(最新)へ移り重複しない", () => {
    const { recordAnswer } = useStatsStore.getState();
    recordAnswer({ id: "q1", unit: "u" }, true);
    recordAnswer({ id: "q2", unit: "u" }, true);
    recordAnswer({ id: "q1", unit: "u" }, false);
    expect(useStatsStore.getState().recentQuestionIds).toEqual(["q2", "q1"]);
  });

  it("直近出題は RECENT_LIMIT 件までで、古いものから押し出される", () => {
    const { recordAnswer } = useStatsStore.getState();
    for (let i = 1; i <= RECENT_LIMIT + 5; i++) {
      recordAnswer({ id: `q${i}`, unit: "u" }, true);
    }
    const recent = useStatsStore.getState().recentQuestionIds;
    expect(recent).toHaveLength(RECENT_LIMIT);
    expect(recent[0]).toBe("q6");
    expect(recent[recent.length - 1]).toBe(`q${RECENT_LIMIT + 5}`);
  });
});
