import { describe, expect, it } from "vitest";
import { areas } from "./areas";
import { getAllQuestions, getQuestionsForArea } from "./questionLoader";
import { getStage, getStagesForArea, splitEvenly, stageQuestionCount } from "./stages";

const ALL_AREA_IDS = areas.map((a) => a.id);
const normalStages = (areaId: string) =>
  getStagesForArea(areaId).filter((s) => s.type === "normal");
const subBossOf = (areaId: string) =>
  getStagesForArea(areaId).find((s) => s.type === "subBoss");

describe("splitEvenly", () => {
  it("上限以下の最小のステージ数に、できるだけ均等に分ける", () => {
    expect(splitEvenly([...Array(23).keys()], 10).map((c) => c.length)).toEqual([8, 8, 7]);
    expect(splitEvenly([...Array(22).keys()], 10).map((c) => c.length)).toEqual([8, 7, 7]);
    expect(splitEvenly([...Array(18).keys()], 10).map((c) => c.length)).toEqual([9, 9]);
    expect(splitEvenly([...Array(11).keys()], 10).map((c) => c.length)).toEqual([6, 5]);
    expect(splitEvenly([...Array(12).keys()], 10).map((c) => c.length)).toEqual([6, 6]);
  });

  it("上限以下ならそのまま1ステージ、空なら空", () => {
    expect(splitEvenly([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
    expect(splitEvenly([], 10)).toEqual([]);
  });

  it("順序を保ち、要素を落とさない", () => {
    const items = [...Array(37).keys()];
    expect(splitEvenly(items, 10).flat()).toEqual(items);
  });
});

describe("getStagesForArea(全エリア共通)", () => {
  it("全8エリアにステージがある", () => {
    for (const id of ALL_AREA_IDS) {
      expect(getStagesForArea(id).length, id).toBeGreaterThan(0);
    }
  });

  it("通常ステージは10問以下で、問題数の少ないエリアでも極端に小さくならない(5問以上)", () => {
    for (const id of ALL_AREA_IDS) {
      for (const stage of normalStages(id)) {
        expect(stage.questionIds.length, `${stage.id}`).toBeLessThanOrEqual(10);
        expect(stage.questionIds.length, `${stage.id}`).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("通常ステージの問題idを合計すると、そのエリアの全問題と一致する(過不足・重複なし)", () => {
    for (const id of ALL_AREA_IDS) {
      const normalIds = normalStages(id).flatMap((s) => s.questionIds);
      const areaIds = getQuestionsForArea(id).map((q) => q.id);
      expect(new Set(normalIds), id).toEqual(new Set(areaIds));
      expect(normalIds.length, id).toBe(areaIds.length);
    }
  });

  it("全ステージidはアプリ全体で一意である", () => {
    const allIds = ALL_AREA_IDS.flatMap((id) => getStagesForArea(id)).map((s) => s.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});

describe("エリアごとのステージ構成", () => {
  it("prologueは2ステージ、小ボスなし(3章)", () => {
    const stages = getStagesForArea("prologue");
    expect(stages).toHaveLength(2);
    expect(stages.every((s) => s.type === "normal")).toBe(true);
  });

  it("kotobaNoIchibaは5通常ステージ+小ボス、sugatakaeNoKajibaは6通常ステージ+小ボス", () => {
    expect(normalStages("kotobaNoIchiba")).toHaveLength(5);
    expect(normalStages("sugatakaeNoKajiba")).toHaveLength(6);
    expect(subBossOf("kotobaNoIchiba")).toBeDefined();
    expect(subBossOf("sugatakaeNoKajiba")).toBeDefined();
  });

  it("残り5エリアの通常ステージ数(問題数から均等分割)", () => {
    expect(normalStages("namerakaNoTaki").map((s) => s.questionIds.length)).toEqual([8, 7, 7]);
    expect(normalStages("tsunagiNoHashi").map((s) => s.questionIds.length)).toEqual([9, 9]);
    expect(normalStages("kizunaNoMa").map((s) => s.questionIds.length)).toEqual([8, 8, 7]);
    expect(normalStages("mikakeNoMa").map((s) => s.questionIds.length)).toEqual([8, 7, 7]);
    expect(normalStages("ohzaNoMa").map((s) => s.questionIds.length)).toEqual([10, 10, 10]);
  });

  it("小ボスは、小ボスを持つ全エリアに1つずつある(序章を除く)", () => {
    for (const area of areas) {
      const subBosses = getStagesForArea(area.id).filter((s) => s.type === "subBoss");
      expect(subBosses, area.id).toHaveLength(area.subBoss ? 1 : 0);
    }
  });
});

describe("小ボスの表示名", () => {
  it("役職・名前の形で、STORY.md のキャラクター名と一致する", () => {
    const titles = Object.fromEntries(
      ["kotobaNoIchiba", "sugatakaeNoKajiba", "namerakaNoTaki", "tsunagiNoHashi", "kizunaNoMa", "mikakeNoMa", "ohzaNoMa"].map(
        (id) => [id, subBossOf(id)!.title],
      ),
    );
    expect(titles).toEqual({
      kotobaNoIchiba: "侍女見習い・メイ",
      sugatakaeNoKajiba: "鍛冶見習い・レル",
      namerakaNoTaki: "文官・オンヴィン",
      tsunagiNoHashi: "メイド長・ジョゼット",
      kizunaNoMa: "騎士団長・ネジラルド",
      mikakeNoMa: "大臣・サイラス",
      ohzaNoMa: "宰相・ニジュヴェール",
    });
  });
});

describe("小ボス", () => {
  const bossAreas = ALL_AREA_IDS.filter((id) => subBossOf(id));

  it("プールは、そのエリアの通常ステージの全問題である(出題は毎回ここから層化抽出)", () => {
    for (const id of bossAreas) {
      const normalIds = normalStages(id).flatMap((s) => s.questionIds);
      const pool = subBossOf(id)!.questionIds;
      expect(new Set(pool), id).toEqual(new Set(normalIds));
      expect(pool.length, id).toBe(normalIds.length);
    }
  });

  it("出題数(pickCount)は15問(通常ステージの8〜10問より多い)。プールが15問未満のエリアはプール全問", () => {
    for (const id of bossAreas) {
      const boss = subBossOf(id)!;
      expect(boss.pickCount!, id).toBe(Math.min(15, boss.questionIds.length));
      expect(boss.pickCount!, id).toBeGreaterThan(10); // 通常ステージの最大(10問)より多い
      expect(stageQuestionCount(boss)).toBe(boss.pickCount);
    }
  });

  it("小ボスのエリアは、プールが15問以上あるので、すべて15問出題", () => {
    for (const id of bossAreas) {
      expect(subBossOf(id)!.questionIds.length, id).toBeGreaterThanOrEqual(15);
      expect(subBossOf(id)!.pickCount, id).toBe(15);
    }
  });
});

describe("ラスボス(王座の間)", () => {
  const lastBosses = ALL_AREA_IDS.flatMap((id) => getStagesForArea(id)).filter(
    (s) => s.type === "lastBoss",
  );

  it("ラスボスがいるのは王座の間だけで、小ボスの後ろに並ぶ", () => {
    expect(lastBosses.map((s) => s.areaId)).toEqual(["ohzaNoMa"]);
    const types = getStagesForArea("ohzaNoMa").map((s) => s.type);
    expect(types).toEqual(["normal", "normal", "normal", "subBoss", "lastBoss"]);
  });

  it("プールは全エリアの全問題で、全エリアの単元から複合出題される(3章)", () => {
    const boss = lastBosses[0];
    expect(new Set(boss.questionIds)).toEqual(new Set(getAllQuestions().map((q) => q.id)));
    expect(boss.pickCount).toBe(16);
    expect(stageQuestionCount(boss)).toBe(16);
  });

  it("タイトルはラスボス名(王様)。小ボスは役職・名前(宰相・ニジュヴェール)", () => {
    expect(lastBosses[0].title).toBe("王様");
    expect(subBossOf("ohzaNoMa")!.title).toBe("宰相・ニジュヴェール");
  });

  it("ラスボスは同じエリアの小ボスをクリアするまで挑戦できない(解放条件)", () => {
    expect(lastBosses[0].requires).toEqual([subBossOf("ohzaNoMa")!.id]);
  });

  it("解放条件: 通常ステージは条件なし、小ボスは同じエリアの通常ステージすべて、ラスボスは宰相(小ボス)。条件のステージはすべて実在する", () => {
    const all = ALL_AREA_IDS.flatMap((id) => getStagesForArea(id));
    for (const stage of all) {
      const sameArea = getStagesForArea(stage.areaId);
      if (stage.type === "normal") expect(stage.requires, stage.id).toBeUndefined();
      if (stage.type === "subBoss") {
        const normalIds = sameArea.filter((s) => s.type === "normal").map((s) => s.id);
        expect([...(stage.requires ?? [])].sort(), stage.id).toEqual([...normalIds].sort());
      }
      if (stage.type === "lastBoss") expect(stage.requires, stage.id).toEqual([`${stage.areaId}-subboss`]);
      for (const required of stage.requires ?? []) {
        expect(getStage(required), `${stage.id} の条件 ${required}`).toBeDefined();
        expect(getStage(required)!.areaId, `${stage.id} の条件は同じエリアのステージ`).toBe(stage.areaId);
      }
    }
  });
});

describe("通常ステージ", () => {
  it("pickCount を持たず、出題数=プール全件", () => {
    for (const stage of getStagesForArea("prologue")) {
      expect(stage.pickCount).toBeUndefined();
      expect(stageQuestionCount(stage)).toBe(stage.questionIds.length);
    }
  });
});

describe("getStage", () => {
  it("idからステージを解決できる", () => {
    expect(getStage("prologue-stage1")?.title).toBe("文節の区切り");
    expect(getStage("ohzaNoMa-lastboss")?.type).toBe("lastBoss");
  });

  it("存在しないidはundefinedを返す", () => {
    expect(getStage("no-such-stage")).toBeUndefined();
  });
});
