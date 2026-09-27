import { describe, expect, it } from "vitest";
import { subBossIntroStoryId, subBossClearStoryId } from "@/features/story/storyIds";
import { isSubBossPurifiedIn, subBossAreaOf } from "./bosses";

describe("小ボスの立ち絵の出し分け(浄化前/浄化後)", () => {
  it("戦う前(subBossIntroStoryId)は、あとで撃破していても常に浄化前の姿のまま", () => {
    const introId = subBossIntroStoryId("kotobaNoIchiba");
    expect(isSubBossPurifiedIn(introId, "kotobaNoIchiba", true)).toBe(false);
    expect(isSubBossPurifiedIn(introId, "kotobaNoIchiba", false)).toBe(false);
  });

  it("戦う前以外の台詞は、そのステージが撃破済みなら浄化後の姿", () => {
    const clearId = subBossClearStoryId("kotobaNoIchiba");
    expect(isSubBossPurifiedIn(clearId, "kotobaNoIchiba", true)).toBe(true);
    expect(isSubBossPurifiedIn(clearId, "kotobaNoIchiba", false)).toBe(false);
  });

  it("未撃破なら、どの台詞でも浄化前の姿", () => {
    expect(isSubBossPurifiedIn("kotobaNoIchiba-truth", "kotobaNoIchiba", false)).toBe(false);
  });
});

describe("小ボスの話者名からエリアidを引く(subBossAreaOf)", () => {
  it("小ボスの名前なら、そのエリアidを返す", () => {
    expect(subBossAreaOf("メイ")).toBe("kotobaNoIchiba");
  });

  it("小ボス以外の話者・未指定は undefined", () => {
    expect(subBossAreaOf("コト")).toBeUndefined();
    expect(subBossAreaOf(undefined)).toBeUndefined();
  });
});
