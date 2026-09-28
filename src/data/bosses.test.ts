import { describe, expect, it } from "vitest";
import {
  areaClearStoryId,
  introStoryId,
  lastBossClearStoryId,
  lastBossIntroStoryId,
  subBossIntroStoryId,
  subBossClearStoryId,
  truthStoryId,
} from "@/features/story/storyIds";
import { areaBackgroundName, areaPurifyGateStageId, isSubBossPurifiedIn, subBossAreaOf } from "./bosses";

describe("小ボスの立ち絵の出し分け(浄化前/浄化後)", () => {
  it("戦う前(subBossIntroStoryId)は、あとで撃破していても常に浄化前の姿のまま", () => {
    const introId = subBossIntroStoryId("kotobaNoIchiba");
    expect(isSubBossPurifiedIn(introId, "kotobaNoIchiba", true)).toBe(false);
    expect(isSubBossPurifiedIn(introId, "kotobaNoIchiba", false)).toBe(false);
  });

  it("エリア初回訪問(introStoryId)で小ボスが話すときも、あとで撃破していても常に浄化前の姿のまま(思い出の再生対策)", () => {
    const introId = introStoryId("kotobaNoIchiba");
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

describe("エリアの浄化の関門(areaPurifyGateStageId)", () => {
  it("王座の間だけラスボス(王様)、それ以外は小ボスが関門", () => {
    expect(areaPurifyGateStageId("kotobaNoIchiba")).toBe("kotobaNoIchiba-subboss");
    expect(areaPurifyGateStageId("ohzaNoMa")).toBe("ohzaNoMa-lastboss");
  });
});

describe("エリアの背景の出し分け(浄化前/浄化後。areaBackgroundName)", () => {
  it("関門を撃破していなければ荒れた背景、撃破していれば通常の背景(eventIdなし=いまの状況)", () => {
    expect(areaBackgroundName("kotobaNoIchiba", false)).toBe("kotobaNoIchiba-corrupted");
    expect(areaBackgroundName("kotobaNoIchiba", true)).toBe("kotobaNoIchiba");
  });

  it("序章は小ボスがおらず、浄化の概念がないので常に通常の背景", () => {
    expect(areaBackgroundName("prologue", false)).toBe("prologue");
    expect(areaBackgroundName("prologue", true)).toBe("prologue");
  });

  it("戦う前(intro・subboss-intro)は、あとで撃破していても、思い出の再生では常に荒れた背景のまま", () => {
    expect(areaBackgroundName("kotobaNoIchiba", true, introStoryId("kotobaNoIchiba"))).toBe(
      "kotobaNoIchiba-corrupted",
    );
    expect(areaBackgroundName("kotobaNoIchiba", true, subBossIntroStoryId("kotobaNoIchiba"))).toBe(
      "kotobaNoIchiba-corrupted",
    );
  });

  it("小ボス撃破後・エリアクリアの場面は、撃破済みなら通常の背景", () => {
    expect(areaBackgroundName("kotobaNoIchiba", true, subBossClearStoryId("kotobaNoIchiba"))).toBe(
      "kotobaNoIchiba",
    );
    expect(areaBackgroundName("kotobaNoIchiba", true, areaClearStoryId("kotobaNoIchiba"))).toBe(
      "kotobaNoIchiba",
    );
  });

  it("王座の間だけ、宰相撃破後〜ラスボス前(真相究明・ラスボス前を含む)も、王様を倒すまでは荒れた背景のまま", () => {
    expect(areaBackgroundName("ohzaNoMa", true, subBossClearStoryId("ohzaNoMa"))).toBe("ohzaNoMa-corrupted");
    expect(areaBackgroundName("ohzaNoMa", true, truthStoryId("ohzaNoMa"))).toBe("ohzaNoMa-corrupted");
    expect(areaBackgroundName("ohzaNoMa", true, lastBossIntroStoryId("ohzaNoMa"))).toBe("ohzaNoMa-corrupted");
  });

  it("王座の間は、ラスボス撃破後の場面から通常の背景になる", () => {
    expect(areaBackgroundName("ohzaNoMa", true, lastBossClearStoryId("ohzaNoMa"))).toBe("ohzaNoMa");
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
