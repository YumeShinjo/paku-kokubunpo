import { beforeEach, describe, expect, it } from "vitest";
import { playableAreas } from "@/data/areas";
import { getStagesForArea } from "@/data/stages";
import { useMascotStore } from "./mascotStore";
import { useProgressStore } from "./progressStore";

const LAST_BOSS = "ohzaNoMa-lastboss";
const SUB_BOSS = "ohzaNoMa-subboss";

const areas = [...playableAreas].sort((a, b) => a.order - b.order);
const normals = (areaId: string) => getStagesForArea(areaId).filter((s) => s.type === "normal");
const subBossOf = (areaId: string) => getStagesForArea(areaId).find((s) => s.type === "subBoss");

const state = () => useProgressStore.getState();
const clear = (...ids: string[]) => ids.forEach((id) => state().markStageCleared(id, 10));
const clearNormals = (areaId: string) => clear(...normals(areaId).map((s) => s.id));
/** そのエリアを、ゲームの順序どおりに(通常ステージ→小ボス)クリアする。王座の間は、さらにラスボスまで */
function clearArea(areaId: string) {
  clearNormals(areaId);
  const boss = subBossOf(areaId);
  if (boss) clear(boss.id);
  if (areaId === "ohzaNoMa") clear(LAST_BOSS);
}

describe("エリアの固定順(序章→1→2→…→7)", () => {
  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
  });

  it("最初のエリア(序章)だけが、最初から入れる。ほかのエリアは、最初はすべて入れない", () => {
    expect(state().isAreaUnlocked(areas[0].id)).toBe(true);
    for (const area of areas.slice(1)) expect(state().isAreaUnlocked(area.id), area.id).toBe(false);
  });

  it("入れないエリアのステージは、通常ステージ・小ボスとも、すべて挑戦できない(自由な順番で先へ進めない)", () => {
    for (const area of areas.slice(1)) {
      for (const stage of getStagesForArea(area.id)) {
        expect(state().isStageUnlocked(stage.id), stage.id).toBe(false);
      }
    }
  });

  it("エリアN+1は、エリアNの小ボスを倒すまで入れない。通常ステージを全部クリアしただけでは開かない", () => {
    for (let i = 0; i < areas.length - 1; i++) {
      const [current, next] = [areas[i], areas[i + 1]];
      clearNormals(current.id);
      if (subBossOf(current.id)) {
        expect(state().isAreaUnlocked(next.id), `${current.id} の通常ステージだけでは ${next.id} は開かない`).toBe(false);
        clear(subBossOf(current.id)!.id);
      }
      expect(state().isAreaUnlocked(next.id), `${current.id} を越えたら ${next.id} が開く`).toBe(true);
      // その次のエリアは、まだ入れない(2つ先へは飛べない)
      if (areas[i + 2]) expect(state().isAreaUnlocked(areas[i + 2].id), `${areas[i + 2].id}`).toBe(false);
    }
  });

  it("序章(小ボスなし)は、2つのステージをすべてクリアすると、ことばの市場が開く(片方だけでは開かない)", () => {
    const [first, second] = normals("prologue");
    clear(first.id);
    expect(state().isAreaUnlocked("kotobaNoIchiba")).toBe(false);
    clear(second.id);
    expect(state().isAreaUnlocked("kotobaNoIchiba")).toBe(true);
  });

  it("次のエリアの通常ステージを先にクリア済みにしても(古い保存データなど)、前のエリアを越えるまで入れない", () => {
    clear(...normals("sugatakaeNoKajiba").map((s) => s.id));
    expect(state().isAreaUnlocked("sugatakaeNoKajiba")).toBe(false);
    expect(state().isStageUnlocked(normals("sugatakaeNoKajiba")[0].id)).toBe(false);
  });

  it("存在しない・未実装のエリアには入れない", () => {
    expect(state().isAreaUnlocked("no-such-area")).toBe(false);
  });
});

describe("エリア内: 小ボスは、通常ステージをすべてクリアしてから", () => {
  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
    clearArea("prologue"); // ことばの市場まで入れる状態にしておく
  });

  it("開放されたエリアでも、小ボスは最初は挑戦できない。通常ステージは最初から挑戦できる", () => {
    for (const stage of normals("kotobaNoIchiba")) expect(state().isStageUnlocked(stage.id), stage.id).toBe(true);
    expect(state().isStageUnlocked(subBossOf("kotobaNoIchiba")!.id)).toBe(false);
  });

  it("通常ステージを1つでも残していると、小ボスは開かない。全部クリアすると開く", () => {
    const list = normals("kotobaNoIchiba");
    clear(...list.slice(0, -1).map((s) => s.id));
    expect(state().isStageUnlocked(subBossOf("kotobaNoIchiba")!.id)).toBe(false);
    clear(list[list.length - 1].id);
    expect(state().isStageUnlocked(subBossOf("kotobaNoIchiba")!.id)).toBe(true);
  });

  it("通常ステージはどの順でもクリアできる(エリア内の通常ステージ同士に順序はない)", () => {
    const list = normals("kotobaNoIchiba");
    expect(state().isStageUnlocked(list[list.length - 1].id)).toBe(true);
  });
});

describe("progressStore.isStageUnlocked(王座の間の宰相→ラスボス)", () => {
  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
    // 王座の間の1つ前(見分けの間)まで、順にクリアして、王座の間に入れる状態にする
    for (const area of areas.filter((a) => a.order < 7)) clearArea(area.id);
  });

  it("王座の間では、通常ステージ→宰相(小ボス)→ラスボス、の順にしか進めない", () => {
    expect(state().isAreaUnlocked("ohzaNoMa")).toBe(true);
    expect(state().isStageUnlocked(SUB_BOSS)).toBe(false);
    expect(state().isStageUnlocked(LAST_BOSS)).toBe(false);
    clearNormals("ohzaNoMa");
    expect(state().isStageUnlocked(SUB_BOSS)).toBe(true);
    expect(state().isStageUnlocked(LAST_BOSS)).toBe(false); // 宰相を倒すまで
    clear(SUB_BOSS);
    expect(state().isStageUnlocked(LAST_BOSS)).toBe(true);
  });

  it("他のエリアの小ボスをクリア済みでも、宰相を倒すまでラスボスは開かない", () => {
    expect(state().isStageCleared("mikakeNoMa-subboss")).toBe(true);
    expect(state().isStageUnlocked(LAST_BOSS)).toBe(false);
  });
});

describe("progressStore.isStageUnlocked(その他)", () => {
  it("存在しないステージは挑戦できない扱い", () => {
    expect(useProgressStore.getState().isStageUnlocked("no-such-stage")).toBe(false);
  });
});

/**
 * 成長アクセサリーは、エリアクリア(小ボス撃破。王座の間はラスボス撃破)のときだけ付き、固定順の結果、常に①→⑦の順になる。
 * ステージ画面のクリア処理と同じ判定(isAreaCleared のとき growTo(エリアの順番+1))を、順にたどって確かめる。
 */
describe("成長アクセサリーの付与順(①→⑦)", () => {
  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
    useMascotStore.setState({ growthStage: 0 });
  });

  /** ステージをクリアしたときの処理(StageScreen.handleComplete と同じ規則) */
  function completeStage(stageId: string, areaId: string) {
    expect(state().isStageUnlocked(stageId), `${stageId} は挑戦できる状態でクリアされる`).toBe(true);
    state().markStageCleared(stageId, 10);
    if (state().isAreaCleared(areaId)) {
      const order = areas.find((a) => a.id === areaId)!.order;
      useMascotStore.getState().growTo(order + 1);
    }
  }

  it("通常ステージを全部クリアしただけでは付かず、小ボスを倒した瞬間に付く", () => {
    for (const s of normals("prologue")) completeStage(s.id, "prologue");
    expect(useMascotStore.getState().growthStage).toBe(1); // 序章のクリア
    for (const s of normals("kotobaNoIchiba")) completeStage(s.id, "kotobaNoIchiba");
    expect(useMascotStore.getState().growthStage).toBe(1); // まだ小ボスを倒していない
    completeStage(subBossOf("kotobaNoIchiba")!.id, "kotobaNoIchiba");
    expect(useMascotStore.getState().growthStage).toBe(2); // 小ボスを倒して、アクセサリー①
  });

  it("固定順に全エリアを進めると、成長は序章から順に、1つずつ増えていく(飛ばない・戻らない)", () => {
    const seen: number[] = [];
    for (const area of areas) {
      const before = useMascotStore.getState().growthStage;
      for (const s of normals(area.id)) completeStage(s.id, area.id);
      const boss = subBossOf(area.id);
      if (boss) completeStage(boss.id, area.id);
      if (area.id === "ohzaNoMa") completeStage(LAST_BOSS, area.id);
      const after = useMascotStore.getState().growthStage;
      expect(after, `${area.id}`).toBe(before + 1);
      seen.push(after);
    }
    expect(seen).toEqual(areas.map((_, i) => i + 1));
    // 最後(王座の間)の成長=アクセサリー⑦(王冠のかけら)は、ラスボスを倒したときに付く
    expect(useMascotStore.getState().growthStage).toBe(areas.length);
  });

  it("王座の間は、宰相を倒しただけでは成長せず(アクセサリー⑦は付かず)、ラスボスを倒したときに付く", () => {
    for (const area of areas.filter((a) => a.order < 7)) {
      for (const s of normals(area.id)) completeStage(s.id, area.id);
      const boss = subBossOf(area.id);
      if (boss) completeStage(boss.id, area.id);
    }
    const before = useMascotStore.getState().growthStage;
    for (const s of normals("ohzaNoMa")) completeStage(s.id, "ohzaNoMa");
    completeStage(SUB_BOSS, "ohzaNoMa");
    expect(useMascotStore.getState().growthStage).toBe(before);
    completeStage(LAST_BOSS, "ohzaNoMa");
    expect(useMascotStore.getState().growthStage).toBe(before + 1);
  });
});
