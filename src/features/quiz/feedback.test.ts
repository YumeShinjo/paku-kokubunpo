import { describe, expect, it } from "vitest";
import { feedbackMessages } from "@/data/feedbackMessages";
import { comboLabel, CORRECT_EFFECTS, pickDifferent, pickMessage } from "./feedback";

describe("pickDifferent", () => {
  it("2つ以上の候補があるとき、直前と同じものを連続して返さない", () => {
    for (let i = 0; i < 300; i++) {
      expect(pickDifferent(["a", "b", "c"], "b")).not.toBe("b");
    }
  });

  it("候補が1つなら、直前と同じでもそれを返す", () => {
    expect(pickDifferent(["only"], "only")).toBe("only");
  });

  it("直前がなければ全候補から選ぶ(乱数の両端で先頭・末尾が選べる)", () => {
    expect(pickDifferent(["a", "b", "c"], undefined, () => 0)).toBe("a");
    expect(pickDifferent(["a", "b", "c"], undefined, () => 0.999)).toBe("c");
  });
});

describe("フィードバックの文言・演出のバリエーション(3章)", () => {
  it("正解演出は2〜3パターン用意されている", () => {
    expect(CORRECT_EFFECTS.length).toBeGreaterThanOrEqual(2);
    expect(CORRECT_EFFECTS.length).toBeLessThanOrEqual(3);
  });

  it("どの種類の文言も複数(3つ以上)あり、重複がない", () => {
    for (const list of Object.values(feedbackMessages)) {
      expect(list.length).toBeGreaterThanOrEqual(3);
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it("pickMessage は指定した種類の文言から選び、直前と同じ文言を連続させない", () => {
    let previous: string | undefined;
    for (let i = 0; i < 300; i++) {
      const message = pickMessage("correct", previous);
      expect(feedbackMessages.correct as readonly string[]).toContain(message);
      expect(message).not.toBe(previous);
      previous = message;
    }
  });
});

describe("comboLabel", () => {
  it("1連続以下は表示しない", () => {
    expect(comboLabel(0)).toBeNull();
    expect(comboLabel(1)).toBeNull();
  });

  it("2連続から表示する", () => {
    expect(comboLabel(2)).toBe("2れんぞく!");
    expect(comboLabel(10)).toBe("10れんぞく!");
  });
});
