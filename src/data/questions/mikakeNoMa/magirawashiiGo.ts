import { choiceQ, createChoiceArranger } from "@/data/questionBuilders";
import type { ChoiceQuestion } from "@/data/schema";

/**
 * 紛らわしい語の識別(「ない」「らしい」「だ」「の」)。
 * 元データでは単元が語ごとに分かれていたが、各2〜3問と少なく、ことだまの書の正答率を
 * 意味のある形で出せないため、1つの単元(magirawashii-go)にまとめている。
 * 元データで誤答が「所有/準体言」のように略記されていたものは、選択肢として読める形に補っている。
 */
const UNIT = "magirawashii-go";
const arrange = createChoiceArranger();

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
    id: `miwake-magirawashii-${String(n).padStart(2, "0")}`,
    unit: UNIT,
    prompt: `この「${word}」は?`,
    situation: sentence,
    choices,
    correctIndex,
    explanation,
    autoRuby: true,
  });
}

export const magirawashiiGoQuestions: ChoiceQuestion[] = [
  q(1, "今日は宿題がない。", "ない", "形容詞", ["助動詞", "補助形容詞"], "単独で「存在しない」という意味を表す形容詞。「ぬ」に置き換えられない。"),
  q(2, "彼はまだ来ない。", "ない", "助動詞", ["形容詞", "補助形容詞"], "動詞の未然形に接続し、打ち消しを表す。「来ぬ」のように「ぬ」に置き換えられる。"),
  q(3, "この本は面白くない。", "ない", "補助形容詞", ["助動詞", "形容詞"], "形容詞の連用形「面白く」に接続。間に「は」を入れて「面白くはない」と言える。"),
  q(4, "明日は晴れるらしい。", "らしい", "助動詞(推定)", ["接尾語"], "人から聞いた情報をもとに推定している(伝聞・推定)。"),
  q(5, "彼はいかにも大人らしい振る舞いをする。", "らしい", "接尾語", ["助動詞"], "「〜にふさわしい」という意味を付け加え、形容詞を作っている。"),
  q(6, "これは私の本だ。", "だ", "断定の助動詞", ["過去の助動詞「た」の一部"], "「〜である」という意味を表す、独立した助動詞。"),
  q(7, "もう本を読んだ。", "だ", "過去の助動詞「た」の濁音化", ["断定の助動詞"], "「読みた」が変化した形で、過去・完了を表す「た」が濁ったもの。"),
  q(8, "私の描いた絵。", "の", "主格を表す", ["所有を表す", "準体言"], "「私が描いた絵」と言い換えられる。"),
  q(9, "これは私のかばんだ。", "の", "所有を表す", ["主格を表す", "準体言"], "「私が」に置き換えると意味が通じない。"),
  q(10, "赤いのを買った。", "の", "準体言(「もの」の意味)", ["主格を表す", "所有を表す"], "「赤いもの」を指し示す働き。"),
];
