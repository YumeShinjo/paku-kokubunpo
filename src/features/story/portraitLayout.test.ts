import { describe, expect, it } from "vitest";
import { layoutPortraits } from "./portraitLayout";
import { PORTRAIT_FACING, facingOfMascot, facingOfSpeaker } from "@/data/story/characterFacing";
import { areas } from "@/data/areas";

const base = { showKing: false, showBoss: false, showMascot: false };

describe("顔の向きのデータ(characterFacing)", () => {
  it("顔が右向きなのは、メイ・ジョゼット・ニジュヴェール。それ以外は左向き", () => {
    const right = Object.entries(PORTRAIT_FACING)
      .filter(([, f]) => f === "right")
      .map(([name]) => name)
      .sort();
    expect(right).toEqual(["ジョゼット", "ニジュヴェール", "メイ"].sort());
  });

  it("すべての小ボスと王様、マスコットの立ち絵に、顔の向きが定義されている", () => {
    for (const area of areas) {
      if (area.subBossName) expect(facingOfSpeaker(area.subBossName), area.subBossName).toBeDefined();
    }
    expect(facingOfSpeaker("ヴェルバルト")).toBeDefined();
    expect(facingOfSpeaker("王(乱れに飲まれた姿)")).toBe(facingOfSpeaker("ヴェルバルト"));
    expect(facingOfMascot(undefined)).toBeDefined();
    expect(facingOfMascot("true")).toBeDefined();
  });
});

describe("立ち絵の左右配置(layoutPortraits)", () => {
  it("右向きのキャラクターは画面の左、左向きのキャラクターは画面の右に置く", () => {
    expect(layoutPortraits({ ...base, speaker: "メイ", showBoss: true }).boss).toBe("left");
    expect(layoutPortraits({ ...base, speaker: "ジョゼット", showBoss: true }).boss).toBe("left");
    expect(layoutPortraits({ ...base, speaker: "ニジュヴェール", showBoss: true }).boss).toBe("left");
    expect(layoutPortraits({ ...base, speaker: "レル", showBoss: true }).boss).toBe("right");
    expect(layoutPortraits({ ...base, speaker: "サイラス", showBoss: true }).boss).toBe("right");
    expect(layoutPortraits({ ...base, speaker: "ヴェルバルト", showKing: true }).king).toBe("right");
  });

  it("マスコット(コト・コレット)だけのときは、顔の向きから決まる", () => {
    expect(layoutPortraits({ ...base, speaker: "コト", showMascot: true }).mascot).toBe("right");
    expect(layoutPortraits({ ...base, speaker: undefined, showMascot: true, mascotForm: "true" }).mascot).toBe("right");
  });

  it("override があれば、主役の立ち絵はその側に置く", () => {
    expect(layoutPortraits({ ...base, speaker: "コト", showMascot: true, override: "left" }).mascot).toBe("left");
  });

  it("王様とマスコットが同じ場面にいるときは、反対側に置く(重ならない)", () => {
    const layout = layoutPortraits({
      ...base,
      speaker: "ヴェルバルト",
      showKing: true,
      showMascot: true,
      mascotForm: "true",
    });
    expect(layout.king).toBe("right");
    expect(layout.mascot).toBe("left");
    const boss = layoutPortraits({ ...base, speaker: "メイ", showBoss: true, showMascot: true });
    expect(boss.boss).toBe("left");
    expect(boss.mascot).toBe("right");
  });

  it("出さない立ち絵には、位置を付けない", () => {
    expect(layoutPortraits({ ...base, speaker: "店主" })).toEqual({});
  });
});
