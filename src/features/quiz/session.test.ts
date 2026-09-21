import { beforeEach, describe, expect, it } from "vitest";
import type { Question } from "@/data/schema";
import { getQuestionsForStage } from "@/data/questionLoader";
import { useSessionStore, type SavedSession } from "@/app/store/sessionStore";
import { canResume, restoreSession } from "./session";

const stageId = "prologue-stage1";
const questions = getQuestionsForStage(stageId);
const lookup = (id: string): Question | undefined => questions.find((q) => q.id === id);

const saved = (overrides: Partial<SavedSession> = {}): SavedSession => ({
  stageId,
  areaId: "prologue",
  questionIds: questions.map((q) => q.id),
  index: 3,
  correctCount: 2,
  combo: 1,
  maxCombo: 2,
  hp: 0,
  ...overrides,
});

describe("ステージの途中からの再開", () => {
  it("保存した出題の並びと進行状況を、そのまま復元する", () => {
    const restored = restoreSession(saved(), stageId, lookup);
    expect(restored?.questions.map((q) => q.id)).toEqual(questions.map((q) => q.id));
    expect(restored?.progress).toEqual({ index: 3, correctCount: 2, combo: 1, maxCombo: 2, hp: 0 });
  });

  it("ボス戦のHPも復元する", () => {
    expect(restoreSession(saved({ hp: 4 }), stageId, lookup)?.progress.hp).toBe(4);
  });

  it("保存がない / 別のステージの保存 / 問題が見つからない(データ更新後)ときは、最初から遊ぶ(null)", () => {
    expect(restoreSession(null, stageId, lookup)).toBeNull();
    expect(restoreSession(saved({ stageId: "other-stage" }), stageId, lookup)).toBeNull();
    expect(restoreSession(saved({ questionIds: [...questions.map((q) => q.id), "no-such-question"] }), stageId, lookup)).toBeNull();
  });

  it("壊れた保存(位置が範囲外・負の数・小数・問題が空)は使わない", () => {
    expect(restoreSession(saved({ index: questions.length }), stageId, lookup)).toBeNull();
    expect(restoreSession(saved({ index: -1 }), stageId, lookup)).toBeNull();
    expect(restoreSession(saved({ correctCount: 1.5 }), stageId, lookup)).toBeNull();
    expect(restoreSession(saved({ questionIds: [] }), stageId, lookup)).toBeNull();
  });

  it("実際の問題データでも、保存したidから復元できる(既定の検索)", () => {
    expect(restoreSession(saved(), stageId)).not.toBeNull();
    expect(canResume(saved(), stageId)).toBe(true);
    expect(canResume(saved(), "prologue-stage2")).toBe(false);
  });
});

describe("sessionStore", () => {
  beforeEach(() => useSessionStore.setState({ active: null }));

  it("保存できて、クリアで消える。最後に遊んだ1ステージだけを持つ", () => {
    useSessionStore.getState().save(saved());
    expect(useSessionStore.getState().active?.stageId).toBe(stageId);
    useSessionStore.getState().save(saved({ stageId: "kotobaNoIchiba-stage1" }));
    expect(useSessionStore.getState().active?.stageId).toBe("kotobaNoIchiba-stage1");
    useSessionStore.getState().clear();
    expect(useSessionStore.getState().active).toBeNull();
  });
});
