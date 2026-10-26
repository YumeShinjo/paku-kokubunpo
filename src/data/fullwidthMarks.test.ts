import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { feedbackMessages } from "./feedbackMessages";
import { STATUS_LINES, TAP_LINES } from "./homeLines";
import { storyEvents } from "./story/events";
import { YURAI_SCENES } from "./yuraiScenes";
import { ZUKAN_CHARACTERS } from "./zukanCharacters";

/**
 * セリフ(物語・ユライとコトの場面台詞・ホームのコトの一言・正誤のコトの一言・ずかんのひとこととメモ)の「!」「?」は、全角(！？)。
 * 半角だと、あとに続く文と詰まって見え、セリフの切れ目が分かりにくいため。
 * 見出し・ボタンなどの画面の文言(「せいかい!」など)・ふりがなの記法・お知らせは、対象外。
 */
const HALF = /[!?]/;

const storyTexts = storyEvents.flatMap((e) => e.lines.map((l) => ({ where: e.id, text: l.text.map((s) => s.text).join("") })));
const sceneTexts = Object.entries(YURAI_SCENES).flatMap(([id, lines]) => lines.map((l) => ({ where: id, text: l.text })));
const homeTexts = [...Object.values(STATUS_LINES), ...TAP_LINES].map((l) => ({ where: l.id, text: l.text }));
const feedbackTexts = Object.entries(feedbackMessages).flatMap(([kind, list]) => list.map((text) => ({ where: kind, text })));
const zukanTexts = ZUKAN_CHARACTERS.flatMap((slot) =>
  slot.versions.flatMap((v) => [{ where: `${slot.id}:${v.id}:hitokoto`, text: v.hitokoto }, ...v.memo.map((m, i) => ({ where: `${slot.id}:${v.id}:memo${i}`, text: m }))]),
);

describe("セリフの「!」「?」は全角(！？)", () => {
  it.each([
    ["物語", storyTexts],
    ["ユライとコトの場面台詞", sceneTexts],
    ["ホームのコトの一言", homeTexts],
    ["正誤のコトの一言", feedbackTexts],
    ["ずかんのひとこと・メモ", zukanTexts],
  ])("%s: 半角の「!」「?」がない。全角の「！」「？」は使われている", (_name, texts) => {
    expect(texts.length).toBeGreaterThan(0);
    for (const { where, text } of texts) expect(text, where).not.toMatch(HALF);
    expect(texts.some(({ text }) => /[！？]/.test(text))).toBe(true);
  });

  it("全角にしても、三点リーダーの方針は変わらない(物語・セリフは「……」。「…」だけの省略はない)", () => {
    for (const { where, text } of [...storyTexts, ...sceneTexts]) expect(text, where).not.toMatch(/(?<!…)…(?!…)/);
  });
});

/**
 * 画面の文言(コトの口調の見出し・案内文・メッセージ)の「!」「?」も、全角(！？)。
 * 例外: ボタンの短いラベル(「たたかう!」「わかった!」)、お知らせ(announcements.ts)、出題(data/questions・data/kotowaza)、
 * コメント、テスト、コード(正規表現・三項演算子など。日本語の文字のすぐあとに付いた「!」「?」だけを調べる)。
 */
describe("画面の文言の「!」「?」は全角(ボタンの短いラベル・お知らせ・出題は除く)", () => {
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const path = join(dir, e.name);
      return e.isDirectory() ? files(path) : /\.tsx?$/.test(e.name) && !/\.test\./.test(e.name) ? [path] : [];
    });
  const EXCLUDED = [/data[\\/]questions/, /data[\\/]kotowaza/, /announcements\.ts$/];
  const BUTTON_LABELS = ["たたかう!", "わかった!"];
  const HALF_AFTER_JAPANESE = /(?:\[[぀-ヿ・ー]{1,12}\]|[぀-ヿ一-鿿々ー」』）。、…〜~♪])[!?]/;

  it("src の画面の文言に、日本語のすぐあとの半角「!」「?」が残っていない", () => {
    const found: string[] = [];
    for (const path of files("src").filter((p) => !EXCLUDED.some((re) => re.test(p)))) {
      readFileSync(path, "utf-8").split(/\r?\n/).forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line)) return; // コメント
        if (BUTTON_LABELS.some((w) => line.includes(w))) return;
        if (/\.(split|replace|test|match)\(\//.test(line)) return; // 正規表現(コード)
        if (HALF_AFTER_JAPANESE.test(line)) found.push(`${path}:${i + 1}: ${line.trim().slice(0, 80)}`);
      });
    }
    expect(found).toEqual([]);
  });
});
