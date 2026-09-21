import { describe, expect, it } from "vitest";
import { areas } from "./areas";
import { findPartOfSpeech, partsOfSpeech } from "./partOfSpeech";
import { getZukanPage, zukanPages } from "./zukanPages";
import { getAllQuestions } from "./questionLoader";

describe("ことだまの書のページ", () => {
  it("全エリアに、1ページずつある(エリアクリアごとに増える)", () => {
    expect(zukanPages.map((p) => p.areaId).sort()).toEqual(areas.map((a) => a.id).sort());
    for (const area of areas) expect(getZukanPage(area.id), area.id).toBeDefined();
  });

  it("各ページには導入と、1つ以上の用語があり、用語・説明が空でなく、用語は重複しない", () => {
    for (const page of zukanPages) {
      expect(page.intro.length, page.areaId).toBeGreaterThan(0);
      expect(page.entries.length, page.areaId).toBeGreaterThan(0);
      const terms = page.entries.map((e) => e.term);
      expect(new Set(terms).size, `${page.areaId} の用語が重複`).toBe(terms.length);
      for (const entry of page.entries) {
        expect(entry.term.trim(), page.areaId).not.toBe("");
        expect(entry.meaning.trim(), entry.term).not.toBe("");
        for (const word of entry.example ?? []) {
          expect(word.text.trim(), `${entry.term} の例に空の語`).not.toBe("");
          if (word.pos) expect(findPartOfSpeech(word.pos), `${entry.term}: 未知の品詞 ${word.pos}`).toBeDefined();
        }
      }
    }
  });

  it("ことばの市場のページに、品詞10種すべての説明がある", () => {
    const page = getZukanPage("kotobaNoIchiba")!;
    for (const pos of partsOfSpeech) {
      expect(
        page.entries.some((e) => e.term === pos.label),
        `${pos.label} の説明がない`,
      ).toBe(true);
    }
  });
});

describe("品詞の色分け", () => {
  it("品詞は10種で、色はすべて違い、表示名が空でない", () => {
    expect(partsOfSpeech).toHaveLength(10);
    expect(new Set(partsOfSpeech.map((p) => p.color)).size).toBe(10);
    expect(new Set(partsOfSpeech.map((p) => p.id)).size).toBe(10);
    for (const pos of partsOfSpeech) expect(pos.label.length).toBeGreaterThan(0);
  });

  it("品詞分類の仕分けゲームのカゴ(品詞10種)と、id が過不足なく対応している", () => {
    const sorting = getAllQuestions().filter((q) => q.engine === "sorting" && q.unit === "hinshi-bunrui");
    expect(sorting.length).toBeGreaterThan(0);
    for (const q of sorting) {
      if (q.engine !== "sorting") continue;
      expect(q.categories.map((c) => c.id).sort()).toEqual(partsOfSpeech.map((p) => p.id).sort());
    }
  });

  it("品詞でないカゴ(自立語/付属語など)は色がつかない", () => {
    expect(findPartOfSpeech("jiritsugo")).toBeUndefined();
    expect(findPartOfSpeech(undefined)).toBeUndefined();
  });
});
