import { choiceQ, createChoiceArranger } from "@/data/questionBuilders";
import type { ChoiceQuestion } from "@/data/schema";

const UNIT = "shuujoshi";
const arrange = createChoiceArranger();

/** 終助詞。元データは「文+『語』の働きは?」を1つにまとめて書いてあったので、文と問いに分けている。 */
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
    id: `hashi-shuu-${String(n).padStart(2, "0")}`,
    unit: UNIT,
    prompt: `「${word}」の働きは?`,
    situation: sentence,
    choices,
    correctIndex,
    explanation,
    autoRuby: true,
  });
}

export const shuujoshiQuestions: ChoiceQuestion[] = [
  q(1, "もう帰るの?", "の", "疑問を表す", ["感動を表す", "命令を表す"], "文末について疑問の意味を添える終助詞。"),
  q(2, "早く行きなさいよ。", "よ", "念押し・強調を表す", ["疑問を表す", "詠嘆を表す"], "文末について念押しや強調の意味を添える終助詞。"),
  q(3, "きれいな花だなあ。", "なあ", "詠嘆を表す", ["疑問を表す", "勧誘を表す"], "感動・詠嘆の意味を添える終助詞。"),
];
