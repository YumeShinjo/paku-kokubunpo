import type { RubyText } from "./schema";

/**
 * 出題データ作成者が書きやすい記法("漢字[ふりがな]")を RubyText に変換するヘルパー。
 * 例: rb("次の単語を、正しい品詞[ひんし]のカゴに分けましょう。")
 *   → [{text:"次の単語を、正しい"}, {text:"品詞",ruby:"ひんし"}, {text:"のカゴに分けましょう。"}]
 * データ本体(questions/配下)はこの関数を通してのみ RubyText を組み立てる。
 */
// ルビの対象は直前の「漢字の連続」のみに限定する(平仮名の地の文を巻き込まないため)。
// 9章で対象とする文法用語(体言・用言・未然形など)はすべて漢字のみの語なのでこれで十分。
const RUBY_PATTERN = /(\p{Script=Han}+)\[([^\]]+)\]/gu;

/** 組み立てパズル(assembly)の空欄マーカー。schema.ts の sentenceTemplate 仕様と対応する。 */
const BLANK_MARKER = "___";

export function rb(source: string): RubyText {
  const raw: RubyText = [];
  let lastIndex = 0;
  RUBY_PATTERN.lastIndex = 0;

  for (const match of source.matchAll(RUBY_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      raw.push({ text: source.slice(lastIndex, index) });
    }
    raw.push({ text: match[1], ruby: match[2] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < source.length) {
    raw.push({ text: source.slice(lastIndex) });
  }

  // 空欄マーカー "___" は、ルビの付いていないセグメント内にあれば
  // AssemblyEngine が blank として認識できるよう独立したセグメントに分割する。
  const segments: RubyText = [];
  for (const seg of raw) {
    if (seg.ruby || !seg.text.includes(BLANK_MARKER)) {
      segments.push(seg);
      continue;
    }
    const parts = seg.text.split(BLANK_MARKER);
    parts.forEach((part, i) => {
      if (part) segments.push({ text: part });
      if (i < parts.length - 1) segments.push({ text: BLANK_MARKER });
    });
  }

  return segments;
}
