import { describe, expect, it } from "vitest";
import { SLEEPY_STAR_THRESHOLD, splashPose, titleExpression } from "./mood";

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

describe("最初の画面のコトの絵(splashPose)", () => {
  it("星が1つもないときだけ、手を振る専用の絵", () => {
    expect(splashPose(0)).toBe("wave");
  });

  it("星が残っているときは、手を振らず、タイトル画面と同じ表情(hungry / sleepy)", () => {
    for (const n of [1, 4]) expect(splashPose(n), String(n)).toBe("hungry");
    for (const n of [5, 30]) expect(splashPose(n), String(n)).toBe("sleepy");
    for (const n of [1, 3, 5, 12]) expect(splashPose(n)).toBe(titleExpression(n));
  });
});
