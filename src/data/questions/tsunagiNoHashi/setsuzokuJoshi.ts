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
];
