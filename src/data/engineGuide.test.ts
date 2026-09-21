import { describe, expect, it } from "vitest";
import { getAllQuestions } from "./questionLoader";
import { engineGuides, guideKeyOf, guideKeys } from "./engineGuide";

describe("操作ガイド", () => {
  it("出題形式ごと(仕分け・穴埋め・選択式・文中タップ)の4つ、それぞれ手順が1つ以上ある", () => {
    expect([...guideKeys].sort()).toEqual(["assembly", "choice", "sorting", "tapInSentence"]);
    for (const key of guideKeys) {
      expect(engineGuides[key].steps.length, key).toBeGreaterThan(0);
      expect(engineGuides[key].title.length, key).toBeGreaterThan(0);
    }
  });

  it("全問題が、実在するガイドのキーに対応する(足し忘れ検出)", () => {
    for (const q of getAllQuestions()) {
      expect(guideKeys, q.id).toContain(guideKeyOf(q));
    }
  });

  it("文中タップの問題だけが tapInSentence、それ以外の選択式は choice になる", () => {
    for (const q of getAllQuestions()) {
      if (q.engine === "choice") {
        expect(guideKeyOf(q), q.id).toBe(q.display === "tapInSentence" ? "tapInSentence" : "choice");
      }
    }
  });
});
