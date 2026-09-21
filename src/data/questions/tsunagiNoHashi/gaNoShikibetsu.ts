import { choiceQ, createChoiceArranger } from "@/data/questionBuilders";
import type { ChoiceQuestion } from "@/data/schema";

const UNIT = "ga-no-shikibetsu";
const arrange = createChoiceArranger();

const CAN = "通じる(主格を表す「の」)";
const CANNOT = "通じない(所有を表す「の」)";

/** 「が」と「の」の識別(格助詞の紛らわしいパターン)。 */
function q(n: number, sentence: string, correct: string, wrong: string, explanation: string): ChoiceQuestion {
  const { choices, correctIndex } = arrange(correct, [wrong]);
  return choiceQ({
    id: `hashi-gano-${String(n).padStart(2, "0")}`,
    unit: UNIT,
    prompt: "この「の」を「が」に置き換えても意味が通じるか?",
    situation: sentence,
    choices,
    correctIndex,
    explanation,
    autoRuby: true,
  });
}

export const gaNoShikibetsuQuestions: ChoiceQuestion[] = [
  q(1, "私の描いた絵が、飾られている。", CAN, CANNOT, "「私が描いた絵」と言い換えられるので主格の用法。"),
  q(2, "これは私の本だ。", CANNOT, CAN, "「これは私が本だ」は意味が通らないので所有の用法。"),
  q(3, "山の見える部屋。", CAN, CANNOT, "「山が見える部屋」と言い換えられる。"),
];
