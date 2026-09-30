import { describe, expect, it } from "vitest";
import { ACCESSORY_BOUNDS, ACCESSORY_CANVAS, accessoryCrop } from "./accessoryBounds";
import { MASCOT_ACCESSORY_STAGES } from "@/assets/registry";
import { playableAreas } from "./areas";

describe("成長アクセサリーの切り出し", () => {
  it("1〜7の全段階に、範囲が定義されていて、キャンバスの中に収まっている", () => {
    for (let stage = 1; stage <= MASCOT_ACCESSORY_STAGES; stage++) {
      const b = ACCESSORY_BOUNDS[stage];
      expect(b, `stage ${stage}`).toBeDefined();
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.top).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(ACCESSORY_CANVAS);
      expect(b.bottom).toBeLessThanOrEqual(ACCESSORY_CANVAS);
      expect(b.right).toBeGreaterThan(b.left);
      expect(b.bottom).toBeGreaterThan(b.top);
    }
  });

  it("切り出した絵は、枠の中(0〜100%)に、中央に収まる(幅は枠より大きく拡大される)", () => {
    for (let stage = 1; stage <= MASCOT_ACCESSORY_STAGES; stage++) {
      const crop = accessoryCrop(stage)!;
      expect(crop.width).toBeGreaterThan(100);
      const b = ACCESSORY_BOUNDS[stage];
      const scale = crop.width / 100 / ACCESSORY_CANVAS; // 枠に対する、画像1pxあたりの割合
      const left = crop.left / 100 + b.left * scale;
      const right = crop.left / 100 + b.right * scale;
      const top = crop.top / 100 + b.top * scale;
      const bottom = crop.top / 100 + b.bottom * scale;
      for (const v of [left, right, top, bottom]) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThan(1);
      }
      expect((left + right) / 2).toBeCloseTo(0.5, 5);
      expect((top + bottom) / 2).toBeCloseTo(0.5, 5);
    }
  });

  it("エリアの order(1〜7)が、アクセサリーの段階と対応している(序章=0 にはない)", () => {
    const orders = playableAreas.map((a) => a.order).filter((o) => o > 0);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(accessoryCrop(0)).toBeUndefined();
  });
});
