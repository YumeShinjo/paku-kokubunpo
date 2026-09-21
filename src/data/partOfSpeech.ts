/**
 * 品詞の色分け(5・7章)。
 * 識別・分類を問う問題では色を出さない(答えを教えてしまうため)。色を出してよいのは、
 * 正解がすでに確定したあと(仕分けゲームの解答後の結果)と、ことだまの書(図鑑)だけ。
 * 色だけに頼らないよう、必ず品詞名の文字をそえて表示する。
 *
 * id は、仕分けゲーム(品詞分類)のカゴの id と同じ(data/questions/kotobaNoIchiba/hinshiBunrui.ts)。
 */
export type PosId =
  | "doushi"
  | "keiyoushi"
  | "keiyoudoushi"
  | "meishi"
  | "fukushi"
  | "rentaishi"
  | "setsuzokushi"
  | "kandoushi"
  | "jodoushi"
  | "joshi";

export interface PartOfSpeech {
  id: PosId;
  /** 表示名(ふりがな付きの記法) */
  label: string;
  /** 背景色(うすい色。文字は濃い色で読める) */
  color: string;
}

/** 品詞10種(4章)。表示の並びは、教科書の並びに近いもの。 */
export const partsOfSpeech: PartOfSpeech[] = [
  { id: "meishi", label: "名詞", color: "#9fd0ee" },
  { id: "doushi", label: "動詞", color: "#f6aaa4" },
  { id: "keiyoushi", label: "形容詞", color: "#f7c98b" },
  { id: "keiyoudoushi", label: "形容動詞", color: "#ebdc7a" },
  { id: "fukushi", label: "副詞", color: "#aee0ae" },
  { id: "rentaishi", label: "連体詞", color: "#c3b5ec" },
  { id: "setsuzokushi", label: "接続詞", color: "#f2b0d0" },
  { id: "kandoushi", label: "感動詞", color: "#ffbf8f" },
  { id: "jodoushi", label: "助動詞", color: "#a4d8cf" },
  { id: "joshi", label: "助詞", color: "#d6d6d6" },
];

const byId = new Map<string, PartOfSpeech>(partsOfSpeech.map((p) => [p.id, p]));

/** カゴのid(または品詞id)から品詞を引く。品詞でなければ undefined */
export function findPartOfSpeech(id: string | undefined): PartOfSpeech | undefined {
  return id === undefined ? undefined : byId.get(id);
}
