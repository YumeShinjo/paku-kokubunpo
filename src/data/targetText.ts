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


/**
 * 文の中の対象の語(「」の内側)だけを取り出す。複数あれば順に並べる。対象がなければ null。
 * カゴの中やドラッグ中の小さな表示に使う(文全体は長く、カゴが大きくなったり、ドラッグ中に折り返したりするため)。
 */
export function targetOnly(text: RubyText): RubyText | null {
  const targets = splitTargets(text).filter((piece) => piece.target);
  return targets.length > 0 ? targets.flatMap((piece) => piece.text) : null;
}
