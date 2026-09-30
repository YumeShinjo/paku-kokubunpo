import type { RubyText } from "@/data/schema";

/**
 * ことわざ・故事成語ミニゲーム(言の葉の森)の問題データ。
 * 本編の出題データ(data/questions/)とは別枠で、getAllQuestions() には含めない。
 * 画面の実装は別作業。ここはデータと、その検証(kotowaza.test.ts)まで。
 */
export type IdiomCategory = "kotowaza" | "koji";

export interface IdiomQuestion {
  /** 例: "kotowaza-001" / "koji-001" */
  id: string;
  /** kotowaza=ことわざ / koji=故事成語 */
  category: IdiomCategory;
  /** 空欄("___")を1か所だけ含む文。例: 「覆水___に返らず」 */
  sentence: RubyText;
  /** 選択肢(3〜4個)。正解は1つだけ */
  choices: { id: string; text: RubyText }[];
  correctChoiceId: string;
  /** 正解の語(選択肢の1つと同じ文字) */
  answer: RubyText;
  /** 完全な形(sentence の空欄に answer を入れたもの) */
  full: RubyText;
  /** 読み(ひらがなのみ) */
  reading: string;
  /** 意味(1〜2文) */
  meaning: RubyText;
  /** 由来(故事成語は必須、ことわざは任意。1〜3文) */
  origin?: RubyText;
  /** 旅人「ユライ」が最後に言う、意味の一言まとめ(30字以内) */
  yuraiLine: RubyText;
  /** 中学生にとっての難しさ(1=易 〜 3=難) */
  difficulty: 1 | 2 | 3;
}
