import { describe, expect, it } from "vitest";
import { bossHpMax, bossLabel } from "./bossRules";

describe("bossHpMax", () => {
  it("出題数10問なら6、12問なら8(正解6割でHPが0になる)", () => {
    expect(bossHpMax(10)).toBe(6);
    expect(bossHpMax(12)).toBe(8);
  });

  it("出題を全問解いてもHPが残りうる(出題数未満)ので『もう少し』が成立する", () => {
    for (const n of [2, 5, 10, 12, 20]) {
      expect(bossHpMax(n)).toBeLessThan(n);
    }
  });

  it("最小でもHPは1", () => {
    expect(bossHpMax(1)).toBe(1);
  });

  it("出題数0ならHPも0", () => {
    expect(bossHpMax(0)).toBe(0);
  });
});

describe("bossLabel", () => {
  it("小ボス・ラスボスにだけラベルがあり、通常ステージは null", () => {
    expect(bossLabel("subBoss")).toBe("小ボス");
    expect(bossLabel("lastBoss")).toBe("ラスボス");
    expect(bossLabel("normal")).toBeNull();
  });
});
