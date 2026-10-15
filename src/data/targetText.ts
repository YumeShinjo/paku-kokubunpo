import type { RubyText } from "./schema";

/** 「」でくくられた対象の語(カード風に強調して出す)と、それ以外の部分 */
export interface Piece {
  text: RubyText;
  target: boolean;
}

/**
 * ふりがな付きの文を、「」の内側(対象の語)と外側に分ける。「」そのものは取り除く(カードの枠が、対象であることを示すので)。
 * 「」が閉じていない・入れ子などの崩れた入力でも、文字は失わない(閉じるまでを対象として扱う)。
 */
export function splitTargets(text: RubyText): Piece[] {
  const pieces: Piece[] = [];
  let target = false;
  let current: RubyText = [];
  const flush = () => {
    if (current.length > 0) pieces.push({ text: current, target });
    current = [];
  };
  for (const seg of text) {
    if (seg.ruby) {
      current.push(seg); // ふりがな付きの語(漢字だけ)には「」は含まれない
      continue;
    }
    let buffer = "";
    for (const char of Array.from(seg.text)) {
      if (char === "「" || char === "」") {
        if (buffer) current.push({ text: buffer });
        buffer = "";
        flush();
        target = char === "「";
      } else {
        buffer += char;
      }
    }
    if (buffer) current.push({ text: buffer });
  }
  flush();
  return pieces;
}


/** 番号の記号。同じ表記の語は、ふつう2〜3個。10個を超える場合は、(11)のような丸なしの番号にする */
const CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩";

/**
 * 仕分けの問題で、対象の語(「」の内側)が同じ表記のカードが複数あるとき(例: 「ある」が連体詞と動詞で2枚)に、
 * カードを見分けるための番号を返す。同じ表記が1つだけの語には、番号を付けない。
 * 番号は、①②…の目印だけ(品詞名などの答えのヒントは出さない)。random を渡さなければ、問題の項目の並びの順に付ける。
 * 戻り値は、項目id → 番号の記号。
 */
export function duplicateTargetMarks(items: { id: string; text: RubyText }[], random?: () => number): Map<string, string> {
  const keyOf = (text: RubyText) => (targetOnly(text) ?? text).map((seg) => seg.text).join("");
  const groups = new Map<string, string[]>();
  for (const item of items) {
    const key = keyOf(item.text);
    groups.set(key, [...(groups.get(key) ?? []), item.id]);
  }
  const marks = new Map<string, string>();
  for (const ids of groups.values()) {
    if (ids.length < 2) continue;
    // random を渡すと、番号の付け方を、問題を開くたびにシャッフルする(「①は、いつも動詞」のように、番号が答えの手がかりにならないように)
    const order = [...ids];
    if (random) for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.forEach((id, i) => marks.set(id, CIRCLED[i] ?? `(${i + 1})`));
  }
  return marks;
}

/**
 * 文の中の対象の語(「」の内側)だけを取り出す。複数あれば順に並べる。対象がなければ null。
 * カゴの中やドラッグ中の小さな表示に使う(文全体は長く、カゴが大きくなったり、ドラッグ中に折り返したりするため)。
 */
export function targetOnly(text: RubyText): RubyText | null {
  const targets = splitTargets(text).filter((piece) => piece.target);
  return targets.length > 0 ? targets.flatMap((piece) => piece.text) : null;
}
