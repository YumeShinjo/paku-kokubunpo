import { beforeEach, describe, expect, it } from "vitest";
import { useProgressStore } from "./progressStore";

const LAST_BOSS = "ohzaNoMa-lastboss";
const SUB_BOSS = "ohzaNoMa-subboss";

describe("progressStore.isStageUnlocked(ステージの解放順)", () => {
  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
  });

  it("解放条件のない通常ステージ・小ボスは、最初から挑戦できる", () => {
    const { isStageUnlocked } = useProgressStore.getState();
    expect(isStageUnlocked("prologue-stage1")).toBe(true);
    expect(isStageUnlocked("kotobaNoIchiba-subboss")).toBe(true);
    expect(isStageUnlocked(SUB_BOSS)).toBe(true);
  });

  it("ラスボスは、宰相(小ボス)をクリアするまで挑戦できない", () => {
    expect(useProgressStore.getState().isStageUnlocked(LAST_BOSS)).toBe(false);
  });

  it("通常ステージをクリアしても、小ボスをクリアするまでラスボスは開かない", () => {
    const store = useProgressStore.getState();
    store.markStageCleared("ohzaNoMa-stage1", 60);
    store.markStageCleared("ohzaNoMa-stage2", 60);
    expect(useProgressStore.getState().isStageUnlocked(LAST_BOSS)).toBe(false);
  });

  it("他のエリアの小ボスをクリアしてもラスボスは開かない", () => {
    useProgressStore.getState().markStageCleared("mikakeNoMa-subboss", 80);
    expect(useProgressStore.getState().isStageUnlocked(LAST_BOSS)).toBe(false);
  });

  it("宰相をクリアするとラスボスが開く", () => {
    useProgressStore.getState().markStageCleared(SUB_BOSS, 80);
    expect(useProgressStore.getState().isStageUnlocked(LAST_BOSS)).toBe(true);
  });

  it("存在しないステージは挑戦できない扱い", () => {
    expect(useProgressStore.getState().isStageUnlocked("no-such-stage")).toBe(false);
  });
});
