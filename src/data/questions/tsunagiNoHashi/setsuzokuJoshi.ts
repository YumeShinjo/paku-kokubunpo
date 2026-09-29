import { choiceQ, createChoiceArranger } from "@/data/questionBuilders";
import type { ChoiceQuestion } from "@/data/schema";

const UNIT = "setsuzoku-joshi";
const arrange = createChoiceArranger();

/**
 * 接続助詞(同じ形の語が格助詞と接続助詞で働きが変わるパターン)。
 * 橋の番人に正しいつなぎ言葉を答える選択式として出題する(5章)。
 */
function q(
  n: number,
  sentence: string,
  word: string,
  correct: string,
  wrong: string,
  explanation: string,
): ChoiceQuestion {
  const { choices, correctIndex } = arrange(correct, [wrong]);
  return choiceQ({
    id: `hashi-setsuzoku-${String(n).padStart(2, "0")}`,
    unit: UNIT,
    prompt: `「${word}」の働きは?`,
    situation: sentence,
    choices,
    correctIndex,
    explanation,
    autoRuby: true,
  });
}

export const setsuzokuJoshiQuestions: ChoiceQuestion[] = [
  q(1, "これは私が作った本だ。", "が", "格助詞(主格)", "接続助詞(逆接)", "「私」が「作った」の主語であることを示す。"),
  q(2, "読んだが、意味がわからなかった。", "が", "接続助詞(逆接)", "格助詞(主格)", "前後の内容が逆の関係でつながっている。"),
  q(3, "友達と話す。", "と", "格助詞(相手)", "接続助詞(確定条件)", "動作の相手を示す。"),
  q(4, "春になると、桜が咲く。", "と", "接続助詞(確定条件)", "格助詞(相手)", "「〜すると、必ず〜」という関係を示す。"),
  q(5, "値段も安いし、味もいい。", "し", "接続助詞(並立)", "副助詞(強調)", "複数の事柄を並べて挙げている。"),
  // 追加出題データ(2026年9月分)
  q(6, "彼は駅から歩いた。", "から", "格助詞(起点)", "接続助詞(理由)", "「駅から」は動作が始まる場所を示す格助詞。"),
  q(7, "疲れたから、休んだ。", "から", "接続助詞(理由)", "格助詞(起点)", "「疲れたから」は原因・理由を示して後の文につなぐ接続助詞。"),
  q(8, "雨が降ってきたので、傘をさした。", "ので", "原因・理由を表す", "逆接を表す", "「ので」は、前のことがらが後のことがらの原因・理由になっていることを示す接続助詞。"),
  q(9, "たくさん勉強したのに、点数が伸びなかった。", "のに", "逆接を表す", "原因・理由を表す", "「のに」は、前のことがらから予想される結果と違う内容が後に続くことを示す接続助詞。"),
  q(10, "音楽を聴きながら、宿題をする。", "ながら", "同時に行うことを表す", "逆接を表す", "「ながら」は、2つの動作を同時に行っていることを示す接続助詞。"),
  q(11, "彼は若いけれど、経験は豊富だ。", "けれど", "逆接を表す", "並立を表す", "「けれど」は、前後の内容が食い違う関係でつながっていることを示す接続助詞。"),
  q(12, "春になったら、桜が咲くだろう。", "たら", "仮定を表す", "原因・理由を表す", "「たら」は、まだ起きていないことを仮に想定してつなぐ接続助詞。"),
];
