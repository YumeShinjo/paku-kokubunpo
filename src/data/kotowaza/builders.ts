import { createChoiceArranger } from "@/data/questionBuilders";
import { rb } from "@/data/ruby";
import type { IdiomCategory, IdiomQuestion } from "./types";

/**
 * 出題データは "漢字[ふりがな]" 記法で書く(ruby.ts の rb() と同じ)。
 * 完全な形(full)は、sentence の空欄("___")に answer を入れて自動で作る(食い違いを防ぐ)。
 */
export interface IdiomSource {
  n: number;
  /** 空欄("___")を1か所だけ含む文 */
  sentence: string;
  answer: string;
  /** 誤答の選択肢(2〜3個) */
  wrongs: string[];
  reading: string;
  meaning: string;
  origin?: string;
  yurai: string;
  difficulty: 1 | 2 | 3;
}

/** 単元ファイルごとに1つ作る(正解の位置が偏らないように並べる) */
export function createIdiomMaker(category: IdiomCategory) {
  const arrange = createChoiceArranger();
  const prefix = category;
  return (src: IdiomSource): IdiomQuestion => {
    const { choices, correctIndex } = arrange(src.answer, src.wrongs);
    const ids = choices.map((_, i) => String.fromCharCode(97 + i));
    return {
      id: `${prefix}-${String(src.n).padStart(3, "0")}`,
      category,
      sentence: rb(src.sentence),
      choices: choices.map((text, i) => ({ id: ids[i], text: rb(text) })),
      correctChoiceId: ids[correctIndex],
      answer: rb(src.answer),
      full: rb(src.sentence.replace("___", src.answer)),
      reading: src.reading,
      meaning: rb(src.meaning),
      origin: src.origin ? rb(src.origin) : undefined,
      yuraiLine: rb(src.yurai),
      difficulty: src.difficulty,
    };
  };
}
