import { describe, expect, it } from "vitest";
import { getLevelInfo, MAX_LEVEL } from "./levelTable";

describe("経験値レベルテーブル", () => {
  it("経験値0はレベル1で、次のレベルまでの割合は0", () => {
    const info = getLevelInfo(0);
    expect(info.level).toBe(1);
    expect(info.expIntoLevel).toBe(0);
    expect(info.progress).toBe(0);
    expect(info.isMaxLevel).toBe(false);
  });

  it("経験値が増えるほど、必要な経験値も増える(ゆるやかな指数増加)", () => {
    const step1 = getLevelInfo(0).expForNextLevel ?? 0;
    const step10 = getLevelInfo(2000).expForNextLevel ?? 0;
    expect(step10).toBeGreaterThan(step1);
  });

  it("レベルは経験値が増えるほど上がり、下がらない", () => {
    let previousLevel = 1;
    for (let exp = 0; exp <= 5000; exp += 37) {
      const level = getLevelInfo(exp).level;
      expect(level).toBeGreaterThanOrEqual(previousLevel);
      previousLevel = level;
    }
  });

  it("最大レベルに達すると、それ以上は増えず、次のレベルの情報はnull", () => {
    const info = getLevelInfo(10_000_000);
    expect(info.level).toBe(MAX_LEVEL);
    expect(info.isMaxLevel).toBe(true);
    expect(info.expForNextLevel).toBeNull();
    expect(info.progress).toBe(1);
  });

  it("負の経験値・小数の経験値でも壊れない(0扱い・切り捨て)", () => {
    expect(getLevelInfo(-10).level).toBe(1);
    expect(getLevelInfo(5.9).expIntoLevel).toBe(5);
  });
});
