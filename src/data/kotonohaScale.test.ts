import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  feetFromBottom,
  KOTO_FEET_ORIGIN_PERCENT,
  KOTO_FEET_SHIFT_PERCENT,
  KOTO_SCALE,
  KOTONOHA_BBOX,
  KOTONOHA_CANVAS,
  kotoToYuraiHeightRatio,
} from "./kotonohaScale";

describe("言の葉の森: ユライとコトの大きさ・足元", () => {
  it("実測した不透明な領域は、512×512のキャンバスの内側にあり、ユライは幅296・高さ438、コトは幅375・高さ433", () => {
    for (const bbox of Object.values(KOTONOHA_BBOX)) {
      expect(bbox.left).toBeGreaterThanOrEqual(0);
      expect(bbox.top).toBeGreaterThanOrEqual(0);
      expect(bbox.right).toBeLessThanOrEqual(KOTONOHA_CANVAS);
      expect(bbox.bottom).toBeLessThanOrEqual(KOTONOHA_CANVAS);
    }
    const size = (b: { left: number; right: number; top: number; bottom: number }) => [b.right - b.left, b.bottom - b.top];
    expect(size(KOTONOHA_BBOX.yurai)).toEqual([296, 438]);
    expect(size(KOTONOHA_BBOX.koto)).toEqual([375, 433]);
  });

  it("コトは、ユライの相棒の小さな生き物に見える大きさ: 見た目の高さの比が 0.65〜0.75。横幅は、ユライより広くならない", () => {
    expect(KOTO_SCALE).toBeLessThan(1);
    const ratio = kotoToYuraiHeightRatio();
    expect(ratio).toBeGreaterThanOrEqual(0.65);
    expect(ratio).toBeLessThanOrEqual(0.75);
    // 倍率を掛けない(同じ枠に、そのまま並べる)と、コトのほうが横に広く、大きく見える。掛けた後は、ユライより狭い
    const width = (b: { left: number; right: number }) => b.right - b.left;
    expect(width(KOTONOHA_BBOX.koto)).toBeGreaterThan(width(KOTONOHA_BBOX.yurai));
    expect(width(KOTONOHA_BBOX.koto) * KOTO_SCALE).toBeLessThan(width(KOTONOHA_BBOX.yurai));
    expect(kotoToYuraiHeightRatio(1)).toBeLessThan(1.0);
    expect(kotoToYuraiHeightRatio(1)).toBeGreaterThan(0.95); // 枠の大きさのままだと、ほぼ同じ高さ(だから、大きく見えていた)
  });

  it("足元: 足元を原点に縮めても動かない。ユライとの足元の差(3px/512)の分だけ、コトを下げて、そろえる", () => {
    expect(KOTO_FEET_ORIGIN_PERCENT).toBeCloseTo((KOTONOHA_BBOX.koto.bottom / KOTONOHA_CANVAS) * 100, 5);
    // 枠の下端からの足元の距離(割合)の差 = ずらす量
    const diff = (feetFromBottom("koto") - feetFromBottom("yurai")) * 100;
    expect(KOTO_FEET_SHIFT_PERCENT).toBeCloseTo(diff, 5);
    // 縮めたあと、ずらしたあとのコトの足元(枠の上端からの%)は、ユライの足元と一致する
    const kotoFeet = KOTO_FEET_ORIGIN_PERCENT + KOTO_FEET_SHIFT_PERCENT;
    expect(kotoFeet).toBeCloseTo((KOTONOHA_BBOX.yurai.bottom / KOTONOHA_CANVAS) * 100, 5);
  });

  it("CSS: コトの枠は、ユライと同じ大きさ(--yurai-size)で、足元を原点に縮める。本編のストーリーのコトの大きさ(15rem)は変えない", () => {
    const css = readFileSync("src/styles/global.css", "utf-8");
    expect(css).toMatch(/\.kotonoha-scene \.mascot \{[^}]*--mascot-size: var\(--yurai-size\);/);
    expect(css).toMatch(/\.kotonoha-scene \.mascot \{[^}]*transform-origin: 50% var\(--koto-feet-origin/);
    expect(css).toMatch(/\.kotonoha-scene \.mascot \{[^}]*scale\(var\(--koto-scale/);
    expect(css).toMatch(/\.story-character \.mascot \{\s*--mascot-size: 15rem;/);
  });
});
