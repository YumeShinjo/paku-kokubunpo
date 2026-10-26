import { beforeEach, describe, expect, it } from "vitest";
import { areas } from "@/data/areas";
import { getStoryEvent } from "@/data/story/events";
import { subBossAssistStoryId } from "@/features/story/storyIds";
import { ASSIST_AFTER_LOSSES, BOSS_LIFE_BONUS_MAX, BOSS_LIVES, bossLivesFor } from "@/features/quiz/bossRules";
import { useProgressStore } from "./progressStore";

const reset = () => useProgressStore.setState({ clearedStageIds: [], totalScore: 0, bossLosses: {}, assistedStageIds: [] });

describe("ボス戦の負けた回数・助けてもらったクリア(進行の保存)", () => {
  beforeEach(reset);

  it("ライフ: 5から、負けるたびに+1、最大+4(=9)", () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(bossLivesFor)).toEqual([5, 6, 7, 8, 9, 9, 9]);
    expect(BOSS_LIVES).toBe(5);
    expect(BOSS_LIFE_BONUS_MAX).toBe(4);
    expect(ASSIST_AFTER_LOSSES).toBe(2);
  });

  it("負けた回数は、ステージごとに数える。クリアすると、そのボスの分だけ消える", () => {
    const s = useProgressStore.getState();
    expect(s.recordBossLoss("a-subboss")).toBe(1);
    expect(s.recordBossLoss("a-subboss")).toBe(2);
    expect(s.recordBossLoss("b-subboss")).toBe(1);
    useProgressStore.getState().markStageCleared("a-subboss", 50);
    expect(useProgressStore.getState().bossLosses).toEqual({ "b-subboss": 1 });
  });

  it("助けてもらったクリア: クリア扱いで、得点は足さない。自力でクリアすると、印が消えて、通常のクリアになる", () => {
    useProgressStore.setState({ totalScore: 30 });
    useProgressStore.getState().markStageAssisted("x-subboss");
    expect(useProgressStore.getState().isStageCleared("x-subboss")).toBe(true);
    expect(useProgressStore.getState().isStageAssisted("x-subboss")).toBe(true);
    expect(useProgressStore.getState().totalScore).toBe(30);
    useProgressStore.getState().markStageCleared("x-subboss", 100);
    expect(useProgressStore.getState().isStageAssisted("x-subboss")).toBe(false);
    expect(useProgressStore.getState().isStageCleared("x-subboss")).toBe(true);
    expect(useProgressStore.getState().totalScore).toBe(130);
    expect(useProgressStore.getState().clearedStageIds.filter((id) => id === "x-subboss")).toHaveLength(1);
  });

  it("以前の保存データ(この2つの項目がない・壊れている)は、空として読み込む。クリア済みのデータは、そのまま", async () => {
    const { persist } = useProgressStore;
    localStorage.setItem("paku-kokubunpo:progress", JSON.stringify({ state: { clearedStageIds: ["a", "b"], totalScore: 40 }, version: 0 }));
    await persist.rehydrate();
    let s = useProgressStore.getState();
    expect(s.clearedStageIds).toEqual(["a", "b"]);
    expect(s.totalScore).toBe(40);
    expect(s.bossLosses).toEqual({});
    expect(s.assistedStageIds).toEqual([]);
    localStorage.setItem(
      "paku-kokubunpo:progress",
      JSON.stringify({ state: { clearedStageIds: ["a"], totalScore: 1, bossLosses: { ok: 3, bad: -1, str: "x", big: 5000 }, assistedStageIds: ["q", 7, null] }, version: 0 }),
    );
    await persist.rehydrate();
    s = useProgressStore.getState();
    expect(s.bossLosses).toEqual({ ok: 3 });
    expect(s.assistedStageIds).toEqual(["q"]);
  });
});

describe("「先へすすむ」の場面(コトの助太刀)", () => {
  const bossAreas = areas.filter((a) => a.subBossName !== undefined);

  it("小ボスのいる7エリアすべてに、同じ4行の場面がある。ボスの行は「……！」。ネタバレ禁止語を含まない", () => {
    expect(bossAreas).toHaveLength(7);
    for (const area of bossAreas) {
      const event = getStoryEvent(subBossAssistStoryId(area.id))!;
      expect(event, area.id).toBeDefined();
      const plain = event.lines.map((l) => `${l.speaker ?? ""}:${l.text.map((s) => s.text).join("")}`);
      expect(plain).toEqual([
        "コト:だいじょうぶ！ あとは コトに まかせて！",
        "コト:ことばの力を ぜんぶ こめて……えいっ！",
        `${area.subBossName}:……！`,
        "コト:やった！ もとにもどったよ。いっしょに がんばってくれて ありがとう！",
      ]);
      for (const word of ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"]) expect(plain.join(""), word).not.toContain(word);
    }
  });
});
