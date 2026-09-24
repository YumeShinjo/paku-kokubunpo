import { describe, expect, it } from "vitest";
import { SLEEPY_STAR_THRESHOLD, titleExpression } from "./mood";

describe("タイトルのコトの表情", () => {
  it("星の問題が5問未満のあいだは、通常の表情(指定なし)", () => {
    expect(SLEEPY_STAR_THRESHOLD).toBe(5);
    for (const n of [0, 1, 4]) expect(titleExpression(n), String(n)).toBeUndefined();
  });

  it("5問以上たまると、眠そうな表情", () => {
    for (const n of [5, 6, 30]) expect(titleExpression(n), String(n)).toBe("sleepy");
  });
});
