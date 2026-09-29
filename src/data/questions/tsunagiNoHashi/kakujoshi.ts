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
  // 追加出題データ(2026年9月分)
  q(5, "私は明日、京都___旅行に行く。", "へ", ["で", "を"], "「京都へ」の「へ」は移動の方向を示す格助詞。"),
  q(6, "兄は友人___囲碁を打つ。", "と", ["を", "に"], "「友人と」の「と」は動作を共にする相手を示す格助詞。"),
  q(7, "彼は九時___学校を出た。", "から", ["まで", "より"], "「九時から」の「から」は動作の起点(始まり)を示す格助詞。"),
  q(8, "この電車は次の駅___止まらない。", "まで", ["から", "を"], "「次の駅まで」の「まで」は動作の終点(範囲)を示す格助詞。"),
  q(9, "弟は兄___背が高い。", "より", ["から", "で"], "「兄より」の「より」は比較の基準を示す格助詞。"),
  q(10, "これは去年___写真だ。", "の", ["が", "を"], "「去年の」の「の」は名詞と名詞をつなぎ、所有・所属などの関係を示す格助詞。"),
  q(11, "彼女は毎朝、駅前___友人を待つ。", "で", ["に", "を"], "「駅前で」の「で」は動作が行われる場所を示す格助詞。"),
  q(12, "妹は人形___大切にしている。", "を", ["に", "の"], "「人形を」の「を」は動作の対象を示す格助詞。"),
];
