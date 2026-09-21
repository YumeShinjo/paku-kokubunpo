import { choiceQ, createChoiceArranger } from "@/data/questionBuilders";
import type { ChoiceQuestion } from "@/data/schema";

const UNIT = "fukujoshi";
const arrange = createChoiceArranger();

/** 副助詞。元データは「文+『語』の働きは?」を1つにまとめて書いてあったので、文と問いに分けている。 */
function q(
  n: number,
  sentence: string,
  word: string,
  correct: string,
  wrongs: string[],
  explanation: string,
): ChoiceQuestion {
  const { choices, correctIndex } = arrange(correct, wrongs);
  return choiceQ({
    id: `hashi-fuku-${String(n).padStart(2, "0")}`,
    unit: UNIT,
    prompt: `「${word}」の働きは?`,
    situation: sentence,
    choices,
    correctIndex,
    explanation,
    autoRuby: true,
  });
}

export const fukujoshiQuestions: ChoiceQuestion[] = [
  q(1, "これだけ食べれば十分だ。", "だけ", "限定を表す", ["強調を表す", "疑問を表す"], "副助詞はいろいろな意味を付け加える。「だけ」は範囲を限定する。"),
  q(2, "彼さえ知らなかった。", "さえ", "極端な例を示す", ["選択を表す", "並立を表す"], "「さえ」は極端な一例を挙げて他を類推させる副助詞。"),
  q(3, "水も飲まずに歩き続けた。", "も", "添加・強調を表す", ["限定を表す", "比較を表す"], "「も」は他にも同様のことがある、または程度の強調を表す副助詞。"),
];
