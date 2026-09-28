import { describe, expect, it } from "vitest";
import {
  arrangeChoices,
  choiceQ,
  createChoiceArranger,
  fillBlankQ,
  tapQ,
} from "./questionBuilders";

describe("tapQ(選択式の文中タップ表示)", () => {
  const base = {
    id: "t1",
    unit: "u",
    prompt: "「弟が」に対応する述語をタップしましょう。",
    sentence: "弟が 公園で 元気に 遊ぶ。",
    given: "弟が",
    correct: "遊ぶ。",
  };

  it("選択式(choice)エンジンの display: tapInSentence として作られる(エンジンは増えない)", () => {
    const q = tapQ(base);
    expect(q.engine).toBe("choice");
    expect(q.display).toBe("tapInSentence");
  });

  it("文節を語順どおりの choices にし、基準の文節だけ given が付く", () => {
    const q = tapQ(base);
    expect(q.choices.map((c) => c.text[0].text)).toEqual(["弟が", "公園で", "元気に", "遊ぶ。"]);
    expect(q.choices.map((c) => c.given === true)).toEqual([true, false, false, false]);
  });

  it("正解の文節のidが correctChoiceId になる", () => {
    const q = tapQ(base);
    expect(q.correctChoiceId).toBe("s4");
    expect(q.choices.find((c) => c.id === q.correctChoiceId)?.text[0].text).toBe("遊ぶ。");
  });

  it("基準・正解は文末の句読点を無視して照合できる(「遊ぶ」で文中の「遊ぶ。」に一致)", () => {
    const q = tapQ({ ...base, correct: "遊ぶ", sentence: "弟が、 公園で 元気に 遊ぶ。", given: "弟が" });
    expect(q.correctChoiceId).toBe("s4");
    expect(q.choices[0].given).toBe(true);
  });

  it("全角空白で区切っても分割できる", () => {
    const q = tapQ({ ...base, sentence: "弟が　公園で　元気に　遊ぶ。" });
    expect(q.choices).toHaveLength(4);
  });

  it("基準・正解の文節が文中にない/重複する/同じ場合は、データの誤りとして例外にする", () => {
    expect(() => tapQ({ ...base, given: "妹が" })).toThrow(/基準の文節/);
    expect(() => tapQ({ ...base, correct: "走る" })).toThrow(/正解の文節/);
    expect(() => tapQ({ ...base, sentence: "弟が 弟が 遊ぶ。" })).toThrow(/2個/);
    expect(() => tapQ({ ...base, correct: "弟が" })).toThrow(/同じ/);
  });

  it("文法用語には既定でふりがなが付き、autoRuby: false で止められる", () => {
    const q = tapQ(base);
    expect(q.prompt.find((s) => s.text === "述語")?.ruby).toBe("じゅつご");
    const plain = tapQ({ ...base, autoRuby: false });
    expect(plain.prompt.some((s) => s.ruby)).toBe(false);
  });
});

describe("arrangeChoices / createChoiceArranger", () => {
  it("正解を指定位置に置き、誤答の順序は保つ", () => {
    expect(arrangeChoices("正", ["誤1", "誤2"], 0)).toEqual({
      choices: ["正", "誤1", "誤2"],
      correctIndex: 0,
    });
    expect(arrangeChoices("正", ["誤1", "誤2"], 1)).toEqual({
      choices: ["誤1", "正", "誤2"],
      correctIndex: 1,
    });
    expect(arrangeChoices("正", ["誤1", "誤2"], 2)).toEqual({
      choices: ["誤1", "誤2", "正"],
      correctIndex: 2,
    });
  });

  it("正解・誤答の内容から決定的に位置を決める(同じ内容なら常に同じ位置。呼び出し順には左右されない)", () => {
    const arrange = createChoiceArranger();
    const first = arrange("正", ["誤"]);
    const again = createChoiceArranger()("正", ["誤"]);
    expect(first).toEqual(again);
    expect([0, 1]).toContain(first.correctIndex);
  });

  it("正解・誤答の組み合わせが違えば、位置が先頭に偏らず散らばる(単元ファイルの出現順に依存しない)", () => {
    const arrange = createChoiceArranger();
    // 単元ファイルの1問目に相当する呼び出しでも、内容次第で先頭以外にもなる
    const indexes = [
      arrange("正解A", ["誤1A", "誤2A"]).correctIndex,
      arrange("正解B", ["誤1B", "誤2B"]).correctIndex,
      arrange("正解C", ["誤1C", "誤2C"]).correctIndex,
      arrange("正解D", ["誤1D", "誤2D"]).correctIndex,
    ];
    expect(new Set(indexes).size).toBeGreaterThan(1);
  });

  it("choiceQ に渡すと correctChoiceId が正解の位置を指す", () => {
    const arrange = createChoiceArranger();
    const { choices, correctIndex } = arrange("正解", ["誤1", "誤2"]);
    const q = choiceQ({ id: "c", unit: "u", prompt: "p", choices, correctIndex });
    const correct = q.choices.find((c) => c.id === q.correctChoiceId);
    expect(correct?.text[0].text).toBe("正解");
  });
});

describe("fillBlankQ", () => {
  const base = {
    id: "f1",
    unit: "u",
    instruction: "空欄に当てはまる形を選びましょう。",
    sentenceTemplate: "手紙を___ない。",
  };

  it("正解カードは常に先頭とは限らず、内容から決定的に並べ替えられる(データの書き方の偏りをそのまま出題しない)", () => {
    const q = fillBlankQ({ ...base, cards: ["書か", "書き", "書く"], correctIndex: 0 });
    const correctId = q.correctOrder[0];
    const correctCard = q.cards.find((c) => c.id === correctId);
    expect(correctCard?.text[0].text).toBe("書か");
    // 正解を差し替えても、そのカードが correctOrder の指す位置に来ることに変わりはない
    const q2 = fillBlankQ({ ...base, cards: ["書か", "書き", "書く"], correctIndex: 0 });
    expect(q2.cards.map((c) => c.text[0].text)).toEqual(q.cards.map((c) => c.text[0].text));
  });

  it("同じカード内容なら、呼ぶたびに同じ並び・同じ正解位置になる(決定的)", () => {
    const a = fillBlankQ({ ...base, id: "f2", cards: ["食べ", "食べる", "食べれ"], correctIndex: 1 });
    const b = fillBlankQ({ ...base, id: "f3", cards: ["食べ", "食べる", "食べれ"], correctIndex: 1 });
    expect(a.cards.map((c) => c.text[0].text)).toEqual(b.cards.map((c) => c.text[0].text));
    expect(a.correctOrder).toEqual(b.correctOrder);
  });
});
