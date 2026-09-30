import { describe, expect, it } from "vitest";
import { layoutPortraits } from "./portraitLayout";
import { PORTRAIT_FACING, facingOfMascot, facingOfSpeaker } from "@/data/story/characterFacing";
import { areas } from "@/data/areas";
import { MULTI_SCALE, MULTI_SCALE_ADJUST, multiScaleFor } from "@/data/story/portraitScale";
import { readFileSync } from "node:fs";

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

describe("複数人の場面での縮小(scale)", () => {
  it("1人だけの場面は、どの立ち絵も 1 倍(今のまま)", () => {
    expect(layoutPortraits({ ...base, speaker: "レル", showBoss: true }).scale).toEqual({ boss: 1 });
    expect(layoutPortraits({ ...base, speaker: "ヴェルバルト", showKing: true }).scale).toEqual({ king: 1 });
    expect(layoutPortraits({ ...base, speaker: "コト", showMascot: true }).scale).toEqual({ mascot: 1 });
    expect(layoutPortraits({ ...base, speaker: undefined, showMascot: true, mascotForm: "true" }).scale).toEqual({ mascot: 1 });
  });

  it("立ち絵が1人も出ない場面には、scale が付かない", () => {
    expect(layoutPortraits({ ...base, speaker: "店主" }).scale).toBeUndefined();
  });

  it("2人以上の場面は、全員を縮める(1人のときの約75〜80%を基準に、キャラごとの補正を掛ける)", () => {
    expect(MULTI_SCALE).toBeGreaterThanOrEqual(0.75);
    expect(MULTI_SCALE).toBeLessThanOrEqual(0.8);
    const pair = layoutPortraits({ ...base, speaker: "ヴェルバルト", showKing: true, showMascot: true, mascotForm: "true" });
    expect(pair.scale?.king).toBeCloseTo(multiScaleFor("ヴェルバルト"));
    expect(pair.scale?.mascot).toBeCloseTo(multiScaleFor("コレット"));
    const bossPair = layoutPortraits({ ...base, speaker: "メイ", showBoss: true, showMascot: true });
    expect(bossPair.scale?.boss).toBeCloseTo(MULTI_SCALE);
    expect(bossPair.scale?.mascot).toBeCloseTo(MULTI_SCALE);
    for (const value of Object.values(pair.scale ?? {})) expect(value).toBeLessThan(1);
  });

  it("キャラ別の補正は、キーで指定できる。補正のないキャラは、基準の倍率のまま", () => {
    expect(multiScaleFor("レル")).toBeCloseTo(MULTI_SCALE);
    expect(multiScaleFor("コレット")).toBeCloseTo(MULTI_SCALE * (MULTI_SCALE_ADJUST["コレット"] ?? 1));
    expect(MULTI_SCALE_ADJUST["コレット"]).toBeLessThan(1);
  });

  it("王様とコレットが並ぶ場面で、コレットの見た目の高さが、王様を超えない", () => {
    // 立ち絵の画像に対する、キャラクター本体(透過でない部分)の高さの割合。画像を測った値(どちらも512px四方の画像)
    const KING_BODY = 444 / 512;
    const COLETTE_BODY = 440 / 512;
    const css = readFileSync("src/styles/global.css", "utf-8");
    const rem = (pattern: RegExp) => Number(css.match(pattern)?.[1]);
    const kingBox = rem(/\.story-king \{[^}]*max-height: ([\d.]+)rem/);
    const coletteBox = rem(/\.story-character \.mascot-true \{[^}]*--mascot-size: ([\d.]+)rem/);
    expect(kingBox).toBeGreaterThan(0);
    expect(coletteBox).toBeGreaterThan(0);
    // 1人のときは、コレットを特に大きく見せている(この設計は、変えない)
    expect(coletteBox * COLETTE_BODY).toBeGreaterThan(kingBox * KING_BODY);
    // 2人のときは、王様のほうが大きい
    const king = kingBox * KING_BODY * multiScaleFor("ヴェルバルト");
    const colette = coletteBox * COLETTE_BODY * multiScaleFor("コレット");
    expect(colette).toBeLessThan(king);
  });
});
