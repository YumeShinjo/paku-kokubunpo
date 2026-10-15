import { describe, expect, it } from "vitest";
import { getAllIdiomQuestions, kojiQuestions, kotowazaQuestions } from "./index";
import type { IdiomQuestion } from "./types";
import type { RubyText } from "@/data/schema";

const plain = (text: RubyText | undefined): string => (text ?? []).map((s) => s.text).join("");
const HIRAGANA = /^[ぁ-ゖー]+$/u;
const HAN = /^\p{Script=Han}+$/u;
/** 文(「。」で終わるまとまり)の数 */
const sentenceCount = (text: string) => (text.match(/。/g) ?? []).length;

const all = getAllIdiomQuestions();

function texts(q: IdiomQuestion): { label: string; value: RubyText | undefined }[] {
  return [
    { label: "sentence", value: q.sentence },
    { label: "answer", value: q.answer },
    { label: "full", value: q.full },
    { label: "meaning", value: q.meaning },
    { label: "origin", value: q.origin },
    { label: "yuraiLine", value: q.yuraiLine },
    ...q.choices.map((c, i) => ({ label: `choices[${i}]`, value: c.text })),
  ];
}

describe("ことわざ・故事成語データ(ミニゲーム)", () => {
  it("ことわざ50問・故事成語30問、計80問", () => {
    expect(kotowazaQuestions).toHaveLength(50);
    expect(kojiQuestions).toHaveLength(30);
    expect(all).toHaveLength(80);
    expect(kotowazaQuestions.every((q) => q.category === "kotowaza")).toBe(true);
    expect(kojiQuestions.every((q) => q.category === "koji")).toBe(true);
  });

  it("id の重複がなく、書式は kotowaza-001 / koji-001 の形", () => {
    const ids = all.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of all) expect(q.id, q.id).toMatch(q.category === "kotowaza" ? /^kotowaza-\d{3}$/ : /^koji-\d{3}$/);
  });

  it("空欄は1か所だけ(sentence の中の ___ )", () => {
    for (const q of all) {
      const blanks = q.sentence.filter((s) => s.text === "___").length;
      expect(blanks, q.id).toBe(1);
      expect(plain(q.sentence).split("___").length - 1, q.id).toBe(1);
    }
  });

  it("choices は3〜4個で、正解の選択肢がちょうど1つ。選択肢どうしは同じ文字にならない", () => {
    for (const q of all) {
      expect(q.choices.length, q.id).toBeGreaterThanOrEqual(3);
      expect(q.choices.length, q.id).toBeLessThanOrEqual(4);
      const answer = plain(q.answer);
      expect(q.choices.filter((c) => plain(c.text) === answer), q.id).toHaveLength(1);
      expect(q.choices.find((c) => c.id === q.correctChoiceId), q.id).toBeDefined();
      expect(plain(q.choices.find((c) => c.id === q.correctChoiceId)!.text), q.id).toBe(answer);
      expect(new Set(q.choices.map((c) => plain(c.text))).size, q.id).toBe(q.choices.length);
      expect(new Set(q.choices.map((c) => c.id)).size, q.id).toBe(q.choices.length);
    }
  });

  it("kotowaza-044(捨てる神あれば___神あり): 誤答は「迎える」「支える」。「助ける」(辞書にある別の言い方)は選択肢に入れず、正解は「拾う」の1つだけ", () => {
    const q = kotowazaQuestions.find((x) => x.id === "kotowaza-044")!;
    const choices = q.choices.map((c) => plain(c.text)).sort();
    expect(choices).toEqual(["拾う", "支える", "迎える"].sort());
    expect(choices).not.toContain("助ける");
    expect(choices).not.toContain("救う");
    expect(plain(q.answer)).toBe("拾う");
    expect(q.choices.filter((c) => c.id === q.correctChoiceId)).toHaveLength(1);
    expect(plain(q.choices.find((c) => c.id === q.correctChoiceId)!.text)).toBe("拾う");
    // 意味・ユライの一言は、そのまま
    expect(plain(q.meaning)).toBe("世の中には、見捨てる人もいれば、助けてくれる人もいるので、くよくよしなくてよいということ。");
    expect(plain(q.yuraiLine)).toBe("みすてる ひとの むこうに、たすける ひとが いる。");
  });

  it("完全な形は、sentence の空欄に answer を入れたものと一致する", () => {
    for (const q of all) {
      expect(plain(q.full), q.id).toBe(plain(q.sentence).replace("___", plain(q.answer)));
      expect(plain(q.full), q.id).not.toContain("___");
    }
  });

  it("読みは、ひらがなだけ", () => {
    for (const q of all) expect(q.reading, q.id).toMatch(HIRAGANA);
  });

  it("yuraiLine は30字以内で、空でない", () => {
    for (const q of all) {
      const n = [...plain(q.yuraiLine)].length;
      expect(n, q.id).toBeGreaterThan(0);
      expect(n, q.id).toBeLessThanOrEqual(30);
    }
  });

  it("意味は1〜2文、由来は1〜3文。故事成語には由来が必ずある", () => {
    for (const q of all) {
      expect(sentenceCount(plain(q.meaning)), `${q.id} meaning`).toBeGreaterThanOrEqual(1);
      expect(sentenceCount(plain(q.meaning)), `${q.id} meaning`).toBeLessThanOrEqual(2);
      if (q.category === "koji") expect(q.origin, `${q.id} origin`).toBeDefined();
      if (q.origin) {
        expect(sentenceCount(plain(q.origin)), `${q.id} origin`).toBeGreaterThanOrEqual(1);
        expect(sentenceCount(plain(q.origin)), `${q.id} origin`).toBeLessThanOrEqual(3);
      }
    }
  });

  it("ふりがなの書式: ルビは漢字だけに付き、ひらがなで、漢字の数より短くならない。書きかけの [ ] が残らない", () => {
    for (const q of all) {
      for (const { label, value } of texts(q)) {
        for (const seg of value ?? []) {
          expect(seg.text, `${q.id} ${label}`).not.toMatch(/[[\]]/);
          if (seg.ruby !== undefined) {
            expect(seg.text, `${q.id} ${label}「${seg.text}」`).toMatch(HAN);
            expect(seg.ruby, `${q.id} ${label}「${seg.text}」`).toMatch(HIRAGANA);
            // 例: 「八起[お]き」のように、ふりがなが漢字の連続の一部にしか付いていない誤りを見つける
            expect(seg.ruby.length, `${q.id} ${label}「${seg.text}」`).toBeGreaterThanOrEqual(seg.text.length);
          }
        }
      }
    }
  });

  it("解説(意味・由来・ユライの一言)は、その問題だけで完結する。他の問題番号への言及はない", () => {
    for (const q of all) {
      for (const text of [q.meaning, q.origin, q.yuraiLine]) {
        expect(plain(text), q.id).not.toMatch(/問\s*[0-9０-９]+/);
        expect(plain(text), q.id).not.toMatch(/(kotowaza|koji)-\d/);
      }
    }
  });

  it("難易度は1〜3で、全体の割合はおよそ 1:2:3 = 4:4:2", () => {
    const count = (d: number, list: IdiomQuestion[]) => list.filter((q) => q.difficulty === d).length;
    for (const q of all) expect([1, 2, 3], q.id).toContain(q.difficulty);
    expect([count(1, kotowazaQuestions), count(2, kotowazaQuestions), count(3, kotowazaQuestions)]).toEqual([20, 20, 10]);
    expect([count(1, kojiQuestions), count(2, kojiQuestions), count(3, kojiQuestions)]).toEqual([12, 12, 6]);
  });

  it("正解の位置が1か所に偏っていない(選択肢を並べ替える仕組みが働いている)", () => {
    const positions = [0, 0, 0, 0];
    for (const q of all) positions[q.choices.findIndex((c) => c.id === q.correctChoiceId)]++;
    for (const n of positions.slice(0, 3)) expect(n).toBeGreaterThan(80 * 0.15);
  });

  it("同じ正解の語が、別の問題に重複していない(完全な形の重複も)", () => {
    const fulls = all.map((q) => plain(q.full));
    expect(new Set(fulls).size).toBe(fulls.length);
  });
});

/**
 * ふりがなの読み合わせ: 表記(full)の中のふりがな(`漢字[よみ]`)の読みが、データの reading(ひらがな)の中に、順番に現れること。
 * 以前、画竜点睛の `竜[りゅう]` が誤りだった(正しくは「がりょうてんせい」の「りょう」)のを、見つけられなかったための再発防止。
 * 機械的に合わない項目は、下の READING_EXCEPTIONS に、理由を書いて入れる(ふりがなの読みを、reading の側の表記に直したもの)。
 */
const READING_EXCEPTIONS: Record<string, { rubies: string[]; reason: string }> = {
  "koji-014": {
    // 完璧: ふりがなは 璧[へき] だが、reading は「かんぺき」(「かん」のあとの「へ」が、発音しやすいように「ぺ」に変わる音の変化)
    rubies: ["かん", "ぺき"],
    reason: "半濁音化(かん+へき→かんぺき)。ふりがな「へき」は、漢字の読みとして正しい。reading は、実際の発音の「ぺき」",
  },
};

/** 表記(full)のふりがな(読み)を、現れる順に取り出す */
const rubiesOf = (q: IdiomQuestion): string[] => q.full.filter((s) => s.ruby).map((s) => s.ruby as string);

/** rubies が、reading の中に、この順で(間をあけてもよい)現れるか。現れなかった最初の読みを返す(すべて現れれば null) */
function firstMissingReading(rubies: string[], reading: string): string | null {
  let from = 0;
  for (const ruby of rubies) {
    const at = reading.indexOf(ruby, from);
    if (at < 0) return ruby;
    from = at + ruby.length;
  }
  return null;
}

describe("ふりがなの読み合わせ(表記のふりがなが、reading に順番に現れる)", () => {
  it("すべての項目で、表記のふりがなの読みが、reading の中に順番に現れる(例外は理由つきで、下に書く)", () => {
    const failures: string[] = [];
    for (const q of all) {
      const exception = READING_EXCEPTIONS[q.id];
      const rubies = exception ? exception.rubies : rubiesOf(q);
      const missing = firstMissingReading(rubies, q.reading);
      if (missing !== null) failures.push(`${q.id}: 「${missing}」が reading「${q.reading}」に順番に現れない(ふりがな: ${rubies.join("・")})`);
    }
    expect(failures).toEqual([]);
  });

  it("画竜点睛(koji-018)は「がりょうてんせい」。ふりがなは、が・りょう・てんせい", () => {
    const q = all.find((x) => x.id === "koji-018")!;
    expect(q.reading).toBe("がりょうてんせい");
    expect(rubiesOf(q)).toEqual(["が", "りょう", "てんせい"]);
    // 正解の選択肢のふりがなも、同じ(表記と選択肢で、食い違わない)
    const correct = q.choices.find((c) => c.id === q.correctChoiceId)!;
    expect(correct.text.map((s) => s.ruby).filter(Boolean)).toEqual(["りょう"]);
  });

  it("登竜門(koji-016)の「竜」は、とうりゅうもんの「りゅう」", () => {
    const q = all.find((x) => x.id === "koji-016")!;
    expect(q.reading).toBe("とうりゅうもん");
    expect(rubiesOf(q)).toEqual(["とう", "りゅう", "もん"]);
  });

  it("確かめ方が働いている: 誤ったふりがな(竜[りゅう])は、「がりょうてんせい」では見つかる", () => {
    expect(firstMissingReading(["が", "りゅう", "てんせい"], "がりょうてんせい")).toBe("りゅう");
    expect(firstMissingReading(["が", "りょう", "てんせい"], "がりょうてんせい")).toBeNull();
    // 順番も見る(読みが逆の順にあるときは、現れたことにしない)
    expect(firstMissingReading(["てんせい", "が"], "がりょうてんせい")).toBe("が");
  });
});

describe("登竜門の由来(koji-016)", () => {
  it("「後漢書」に見える言葉・黄河の急流「竜門」・鯉がのぼりきると竜になる、という説明になっている", () => {
    const q = all.find((x) => x.id === "koji-016")!;
    expect(plain(q.origin)).toBe(
      "中国の「後漢書」に見える言葉。黄河の急流「竜門」を、鯉がのぼりきると竜になる、という伝説から、出世のための難しい関門をいう。",
    );
    expect(q.origin!.filter((s) => s.ruby).map((s) => `${s.text}[${s.ruby}]`)).toEqual(["後漢書[ごかんじょ]", "黄河[こうが]", "鯉[こい]"]);
  });
});
