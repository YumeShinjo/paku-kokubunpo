import { createChoiceArranger, fillBlankQ } from "@/data/questionBuilders";
import type { AssemblyQuestion } from "@/data/schema";

const UNIT = "kakujoshi";
const arrange = createChoiceArranger();

/** 格助詞(穴埋め)。橋板をはめ込む組み立てパズルとして出題する(5章)。 */
function q(
  n: number,
  template: string,
  answer: string,
  wrongs: string[],
  explanation: string,
): AssemblyQuestion {
  const { choices, correctIndex } = arrange(answer, wrongs);
  return fillBlankQ({
    id: `hashi-kaku-${String(n).padStart(2, "0")}`,
    unit: UNIT,
    instruction: "空欄に当てはまる格助詞を選びましょう。",
    sentenceTemplate: template,
    cards: choices,
    correctIndex,
    explanation,
    autoRuby: true,
  });
}

export const kakujoshiQuestions: AssemblyQuestion[] = [
  q(1, "私___ 学校へ行く。", "が", ["を", "に"], "「私が」の「が」は主語を示す格助詞。"),
  q(2, "本___ 読む。", "を", ["が", "へ"], "「本を」の「を」は動作の対象を示す格助詞。"),
  q(3, "公園___ 遊ぶ。", "で", ["が", "を"], "「公園で」の「で」は動作の場所を示す格助詞。"),
  q(4, "先生___ 質問する。", "に", ["を", "で"], "「先生に」の「に」は動作の相手を示す格助詞。"),
];
