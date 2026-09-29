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
  // 追加出題データ(2026年9月分)
  q(4, "弟の描いた絵はコンクールで入賞した。", CAN, CANNOT, "「弟が描いた絵」と言い換えられるので主格の用法。"),
  q(5, "これは祖父の時計だ。", CANNOT, CAN, "「これは祖父が時計だ」は意味が通らないので所有の用法。"),
  q(6, "星の輝く夜空を見上げた。", CAN, CANNOT, "「星が輝く夜空」と言い換えられる。"),
  q(7, "これは彼のかばんだ。", CANNOT, CAN, "「これは彼がかばんだ」は意味が通らないので所有の用法。"),
  q(8, "鳥の飛ぶ姿を写真に収めた。", CAN, CANNOT, "「鳥が飛ぶ姿」と言い換えられる。"),
  q(9, "これは姉のノートだ。", CANNOT, CAN, "「これは姉がノートだ」は意味が通らないので所有の用法。"),
  q(10, "風の吹く音が聞こえる。", CAN, CANNOT, "「風が吹く音」と言い換えられる。"),
  q(11, "これは学校の規則だ。", CANNOT, CAN, "「これは学校が規則だ」は意味が通らないので所有の用法。"),
  q(12, "雨の降る日は外出を控える。", CAN, CANNOT, "「雨が降る日」と言い換えられる。"),
];
