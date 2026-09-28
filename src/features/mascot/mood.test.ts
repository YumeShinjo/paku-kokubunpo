import { describe, expect, it } from "vitest";
import { SLEEPY_STAR_THRESHOLD, titleExpression } from "./mood";

describe("タイトルのコトの表情", () => {
  it("星の問題が0問なら、通常の表情(指定なし)", () => {
    expect(titleExpression(0)).toBeUndefined();
  });

  it("星の問題が1問以上5問未満のあいだは、挑戦意欲(hungry)の表情", () => {
    expect(SLEEPY_STAR_THRESHOLD).toBe(5);
    for (const n of [1, 2, 4]) expect(titleExpression(n), String(n)).toBe("hungry");
  });

  it("5問以上たまると、眠そうな表情", () => {
    for (const n of [5, 6, 30]) expect(titleExpression(n), String(n)).toBe("sleepy");
  });
});
