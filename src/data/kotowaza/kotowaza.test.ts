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
    expect(plain(q.yuraiLine)).toBe("みすてる ひとも、たすける ひとも。");
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
