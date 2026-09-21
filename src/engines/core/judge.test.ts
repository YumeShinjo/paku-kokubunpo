import { describe, expect, it } from "vitest";
import { judgeAnswer } from "./judge";
import type {
  AssemblyQuestion,
  ChoiceQuestion,
  SortingQuestion,
} from "@/data/schema";

describe("judgeAnswer", () => {
  it("sorting: 全アイテムが正しいカゴに入っていれば正解", () => {
    const q: SortingQuestion = {
      id: "q1",
      unit: "u",
      engine: "sorting",
      instruction: [{ text: "分けよう" }],
      categories: [
        { id: "doushi", label: [{ text: "動詞" }] },
        { id: "meishi", label: [{ text: "名詞" }] },
      ],
      items: [
        { id: "i1", text: [{ text: "走る" }], correctCategoryId: "doushi" },
        { id: "i2", text: [{ text: "机" }], correctCategoryId: "meishi" },
      ],
    };
    expect(
      judgeAnswer(q, {
        engine: "sorting",
        placements: { i1: "doushi", i2: "meishi" },
      }),
    ).toBe(true);
    expect(
      judgeAnswer(q, {
        engine: "sorting",
        placements: { i1: "meishi", i2: "meishi" },
      }),
    ).toBe(false);
  });

  it("assembly: カードの並びが完全一致で正解", () => {
    const q: AssemblyQuestion = {
      id: "q2",
      unit: "u",
      engine: "assembly",
      mode: "fillBlank",
      instruction: [{ text: "選ぼう" }],
      cards: [
        { id: "a", text: [{ text: "歩か" }] },
        { id: "b", text: [{ text: "歩き" }] },
      ],
      correctOrder: ["a"],
    };
    expect(judgeAnswer(q, { engine: "assembly", order: ["a"] })).toBe(true);
    expect(judgeAnswer(q, { engine: "assembly", order: ["b"] })).toBe(false);
  });

  it("choice: 選んだ選択肢idが一致すれば正解", () => {
    const q: ChoiceQuestion = {
      id: "q3",
      unit: "u",
      engine: "choice",
      prompt: [{ text: "選ぼう" }],
      choices: [
        { id: "a", text: [{ text: "選択肢A" }] },
        { id: "b", text: [{ text: "選択肢B" }] },
      ],
      correctChoiceId: "b",
    };
    expect(judgeAnswer(q, { engine: "choice", choiceId: "b" })).toBe(true);
    expect(judgeAnswer(q, { engine: "choice", choiceId: "a" })).toBe(false);
  });

  it("choice(文中タップ表示): タップした文節のidが正解の文節と一致すれば正解", () => {
    const q: ChoiceQuestion = {
      id: "q4",
      unit: "u",
      engine: "choice",
      display: "tapInSentence",
      prompt: [{ text: "「僕が」に対応する述語をタップしましょう" }],
      choices: [
        { id: "s1", text: [{ text: "僕が" }], given: true },
        { id: "s2", text: [{ text: "公園で" }] },
        { id: "s3", text: [{ text: "走った" }] },
      ],
      correctChoiceId: "s3",
    };
    expect(judgeAnswer(q, { engine: "choice", choiceId: "s3" })).toBe(true);
    expect(judgeAnswer(q, { engine: "choice", choiceId: "s2" })).toBe(false);
  });

  it("engineが不一致の場合はエラーを投げる", () => {
    const q: ChoiceQuestion = {
      id: "q5",
      unit: "u",
      engine: "choice",
      prompt: [{ text: "選ぼう" }],
      choices: [{ id: "a", text: [{ text: "A" }] }],
      correctChoiceId: "a",
    };
    expect(() =>
      judgeAnswer(q, { engine: "sorting", placements: {} }),
    ).toThrow();
  });
});
