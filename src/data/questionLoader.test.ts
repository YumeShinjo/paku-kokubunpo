import { describe, expect, it } from "vitest";
import { areas } from "./areas";
import {
  getAllQuestions,
  getAvailableUnitIds,
  getQuestionsForArea,
  getQuestionsForStage,
  getQuestionsForUnit,
} from "./questionLoader";
import type { Question } from "./schema";
import { getUnitMeta, unitMetas } from "./units";
import { autoRuby } from "./furigana";

/**
 * 出題データが仕様通りに組み込まれているかを検証する。
 * 件数は「画面数」(仕分けゲームは複数語で1画面)。MVP3エリアは提供元の集計表(121問)から
 * 品詞分類15問を3バッチに再構成したもの、残り5エリアはFIELDWORK_SUMMARYの下書きに対応する。
 */
const ALL_AREA_IDS = areas.map((a) => a.id);

describe("getQuestionsForArea", () => {
  const expectedCounts: Record<string, number> = {
    prologue: 16, // 文節8+単語8
    kotobaNoIchiba: 33, // 品詞分類3バッチ+自立語付属語15+活用の有無15
    sugatakaeNoKajiba: 60, // 活用の種類・活用形・形容詞・形容動詞 各15
    namerakaNoTaki: 22, // 自動詞他動詞4画面(16語)+可能動詞10+音便8
    tsunagiNoHashi: 18, // 格助詞4+接続助詞5+副助詞3+終助詞3+がの識別3
    kizunaNoMa: 23, // ステージ1の12問+ステージ2の11問
    mikakeNoMa: 22, // 助動詞の意味12+紛らわしい語10
    ohzaNoMa: 30, // 尊敬語7+謙譲語7+丁寧語10+敬語の識別6
  };

  it.each(Object.entries(expectedCounts))("%s は %i 画面", (areaId, count) => {
    expect(getQuestionsForArea(areaId)).toHaveLength(count);
  });

  it("全8エリアに出題データがあり、areas.ts と過不足なく対応している", () => {
    expect(Object.keys(expectedCounts).sort()).toEqual([...ALL_AREA_IDS].sort());
    expect(areas.every((a) => a.implemented)).toBe(true);
  });

  it("全問題idがアプリ全体で一意である", () => {
    const ids = getAllQuestions().map((q: Question) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("choice問題は correctChoiceId が choices に実在し、選択肢は2つ以上ある", () => {
    for (const question of getAllQuestions()) {
      if (question.engine === "choice") {
        const choiceIds = question.choices.map((c) => c.id);
        expect(choiceIds, question.id).toContain(question.correctChoiceId);
        expect(choiceIds.length, question.id).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("文中タップ表示の問題: 基準の文節がちょうど1つあり、正解は基準以外で、タップできる文節が2つ以上ある", () => {
    const taps = getAllQuestions().filter(
      (q) => q.engine === "choice" && q.display === "tapInSentence",
    );
    expect(taps.length).toBe(10); // 絆の間の文中タップ10問
    for (const question of taps) {
      if (question.engine !== "choice") continue;
      const given = question.choices.filter((c) => c.given);
      expect(given, question.id).toHaveLength(1);
      const correct = question.choices.find((c) => c.id === question.correctChoiceId);
      expect(correct?.given, question.id).toBeUndefined();
      expect(question.choices.filter((c) => !c.given).length, question.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("文中タップは絆の間だけで使われ、エンジン種別は3つのまま(独立エンジンは増えない)", () => {
    const engines = new Set(getAllQuestions().map((q) => q.engine));
    expect([...engines].sort()).toEqual(["assembly", "choice", "sorting"]);
    const tapAreas = new Set(
      getAllQuestions()
        .filter((q) => q.engine === "choice" && q.display === "tapInSentence")
        .map((q) => getUnitMeta(q.unit)?.areaId),
    );
    expect([...tapAreas]).toEqual(["kizunaNoMa"]);
  });

  it("assembly問題は correctOrder のカードidが cards に実在し、穴埋めの文に空欄がある", () => {
    for (const question of getAllQuestions()) {
      if (question.engine !== "assembly") continue;
      const cardIds = question.cards.map((c) => c.id);
      for (const id of question.correctOrder) {
        expect(cardIds, question.id).toContain(id);
      }
      if (question.mode === "fillBlank") {
        expect(
          question.sentenceTemplate?.some((seg) => seg.text === "___"),
          `${question.id} の文に空欄(___)がない`,
        ).toBe(true);
      }
    }
  });

  it("sorting問題は各itemのcorrectCategoryIdがcategoriesに実在する", () => {
    for (const question of getAllQuestions()) {
      if (question.engine !== "sorting") continue;
      const categoryIds = question.categories.map((c) => c.id);
      for (const item of question.items) {
        expect(categoryIds, `${question.id}/${item.id}`).toContain(item.correctCategoryId);
      }
    }
  });

  it("すべての問題に解説がある(仕分けゲームは各項目に)", () => {
    for (const question of getAllQuestions()) {
      if (question.engine === "sorting") {
        for (const item of question.items) {
          expect(item.explanation, `${question.id}/${item.id}`).toBeDefined();
        }
      } else {
        expect(question.explanation, question.id).toBeDefined();
      }
    }
  });

  it("解説にプレイヤーに見せない内部メモ(キャラクター名との対応づけなど)が残っていない", () => {
    const explanations = getAllQuestions().flatMap((q) =>
      q.engine === "sorting"
        ? q.items.map((i) => i.explanation)
        : [q.explanation],
    );
    for (const explanation of explanations) {
      const text = (explanation ?? []).map((s) => s.text).join("");
      expect(text).not.toMatch(/ニジュヴェール|直結/);
    }
  });

  it("追加出題データ(2026年9月分)の単元別の問題数", () => {
    const count = (unit: string) => getQuestionsForUnit(unit).length;
    expect(count("jidoushi-tadoushi")).toBe(4); // 画面数(6語+10語=16語)
    const words = getQuestionsForUnit("jidoushi-tadoushi").flatMap((q) => (q.engine === "sorting" ? q.items : []));
    expect(words).toHaveLength(16);
    expect(count("kanou-doushi")).toBe(10);
    expect(count("onbin")).toBe(8);
    expect(count("sonkeigo")).toBe(7);
    expect(count("kenjougo")).toBe(7);
    expect(count("teineigo")).toBe(10);
    expect(count("keigo-shikibetsu")).toBe(6);
  });

  it("丁寧語は新しい単元で、王座の間に属する", () => {
    expect(getUnitMeta("teineigo")?.areaId).toBe("ohzaNoMa");
  });

  it("音便で「だ」に濁る問題(泳ぐ・死ぬ・呼ぶ・読む)は、解説に濁る説明がある", () => {
    for (const id of ["taki-onbin-02", "taki-onbin-05", "taki-onbin-06", "taki-onbin-07"]) {
      const q = getAllQuestions().find((x) => x.id === id)!;
      const text = (q.engine === "sorting" ? [] : (q.explanation ?? [])).map((s) => s.text).join("");
      expect(text, id).toContain("濁る");
    }
  });

  it("音便「読む+た」の解説に、「んた」ではなく「んだ」と濁る説明がある", () => {
    const q = getAllQuestions().find((x) => x.id === "taki-onbin-02")!;
    const text = (q.engine === "sorting" ? [] : (q.explanation ?? [])).map((s) => s.text).join("");
    expect(text).toContain("「んた」ではなく「んだ」と濁る");
  });

  it("辞書にある文法用語は、全エリアの全問題でふりがな付きになっている(付け漏れ検出)", () => {
    const missed: string[] = [];
    const check = (id: string, segs: { text: string; ruby?: string }[] | undefined) => {
      for (const seg of segs ?? []) {
        if (!seg.ruby && autoRuby(seg.text) !== seg.text) missed.push(`${id}: ${seg.text}`);
      }
    };
    for (const q of getAllQuestions()) {
      if (q.engine === "sorting") {
        check(q.id, q.instruction);
        q.categories.forEach((c) => check(q.id, c.label));
        q.items.forEach((i) => check(q.id, i.explanation));
      } else if (q.engine === "assembly") {
        check(q.id, q.instruction);
        check(q.id, q.explanation);
        q.cards.forEach((c) => check(q.id, c.text));
      } else {
        check(q.id, q.prompt);
        check(q.id, q.situation);
        check(q.id, q.explanation);
        q.choices.forEach((c) => check(q.id, c.text));
      }
    }
    expect(missed).toEqual([]);
  });

  it("正解の位置が偏らない(単元内の選択式で、正解が常に同じ番号にならない)", () => {
    const byUnit = new Map<string, Set<number>>();
    for (const question of getAllQuestions()) {
      if (question.engine !== "choice" || question.display === "tapInSentence") continue;
      const index = question.choices.findIndex((c) => c.id === question.correctChoiceId);
      byUnit.set(question.unit, (byUnit.get(question.unit) ?? new Set()).add(index));
    }
    for (const [unit, positions] of byUnit) {
      const size = getAllQuestions().filter((q) => q.unit === unit).length;
      // 5問以上ある単元では、正解位置が複数に散らばっているはず(元データが先頭固定でも並べ替え済み)
      if (size >= 5 && !["bunsetsu-kubun", "tango-kubun"].includes(unit)) {
        expect(positions.size, `${unit} の正解位置が1種類のみ`).toBeGreaterThan(1);
      }
    }
  });

  it("新エリアの文法用語にふりがなが付いている(格助詞・述語・尊敬語・音便)", () => {
    const rubyOf = (q: Question, word: string): string | undefined => {
      const texts =
        q.engine === "choice"
          ? [q.prompt, q.situation ?? [], ...q.choices.map((c) => c.text), q.explanation ?? []]
          : q.engine === "assembly"
            ? [q.instruction, q.explanation ?? []]
            : [q.instruction, ...q.categories.map((c) => c.label)];
      return texts.flat().find((seg) => seg.text === word)?.ruby;
    };
    const find = (id: string) => getAllQuestions().find((q) => q.id === id)!;
    expect(rubyOf(find("hashi-kaku-01"), "格助詞")).toBe("かくじょし");
    expect(rubyOf(find("kizuna-shujutsu-01"), "述語")).toBe("じゅつご");
    expect(rubyOf(find("ohza-shikibetsu-03"), "尊敬語")).toBe("そんけいご");
    expect(rubyOf(find("taki-jitasu-batch-01"), "自動詞")).toBe("じどうし");
  });
});

describe("単元メタ情報(units.ts)", () => {
  it("出題データに登場するすべての単元に、表示名とエリアが登録されている(足し忘れ検出)", () => {
    for (const unitId of getAvailableUnitIds()) {
      expect(getUnitMeta(unitId), `単元 ${unitId} が units.ts にない`).toBeDefined();
    }
  });

  it("units.ts の単元idは重複しない", () => {
    const ids = unitMetas.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("units.ts で指定したエリアと、その単元の問題が属するエリアが一致する", () => {
    for (const meta of unitMetas) {
      const inArea = getQuestionsForArea(meta.areaId).filter((q) => q.unit === meta.id);
      expect(inArea.length, `${meta.id} は ${meta.areaId} に問題がない`).toBeGreaterThan(0);
    }
  });

  it("getQuestionsForUnit は指定単元の問題だけを返す", () => {
    const questions = getQuestionsForUnit("hinshi-bunrui");
    expect(questions.length).toBe(3);
    expect(questions.every((q) => q.unit === "hinshi-bunrui")).toBe(true);
    expect(getQuestionsForUnit("no-such-unit")).toEqual([]);
  });
});

describe("getQuestionsForStage", () => {
  it("存在しないstageIdには空配列を返す", () => {
    expect(getQuestionsForStage("no-such-stage")).toEqual([]);
  });

  it("prologue-stage1 は8問を解決できる", () => {
    expect(getQuestionsForStage("prologue-stage1")).toHaveLength(8);
  });

  it("小ボスステージは通常ステージの問題からのみ構成される", () => {
    const subBossQuestions = getQuestionsForStage("kotobaNoIchiba-subboss");
    const areaQuestionIds = new Set(
      getQuestionsForArea("kotobaNoIchiba").map((q) => q.id),
    );
    expect(subBossQuestions.length).toBeGreaterThan(0);
    for (const q of subBossQuestions) {
      expect(areaQuestionIds.has(q.id)).toBe(true);
    }
  });
});
