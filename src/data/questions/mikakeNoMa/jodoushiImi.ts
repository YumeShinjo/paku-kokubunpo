import { choiceQ, createChoiceArranger } from "@/data/questionBuilders";
import type { ChoiceQuestion } from "@/data/schema";

const UNIT = "jodoushi-imi";
const arrange = createChoiceArranger();

/**
 * 助動詞の意味用法別識別。元データには「どの助動詞の意味を問うか」が書かれていなかったため、
 * 各文の該当箇所(context / word)を補って「『話される』の『れる』の意味は?」の形で問う。
 */
function q(
  n: number,
  sentence: string,
  target: { context?: string; word: string },
  correct: string,
  wrongs: string[],
  explanation: string,
): ChoiceQuestion {
  const { choices, correctIndex } = arrange(correct, wrongs);
  const prompt = target.context
    ? `「${target.context}」の「${target.word}」の意味は?`
    : `この文の「${target.word}」の意味は?`;
  return choiceQ({
    id: `miwake-jodoushi-${String(n).padStart(2, "0")}`,
    unit: UNIT,
    prompt,
    situation: sentence,
    choices,
    correctIndex,
    explanation,
    autoRuby: true,
  });
}

export const jodoushiImiQuestions: ChoiceQuestion[] = [
  q(1, "先生が話される。", { context: "話される", word: "れる" }, "尊敬", ["受け身", "可能"], "動作主が「先生」で、敬意を払う対象なので尊敬の意味。"),
  q(2, "先生に叱られる。", { context: "叱られる", word: "れる" }, "受け身", ["尊敬", "自発"], "「叱る」という動作を他者(先生)から受けている。"),
  q(3, "昔のことが思い出される。", { context: "思い出される", word: "れる" }, "自発", ["受け身", "可能"], "自分の意志とは関係なく自然にそうなる、という意味。"),
  q(4, "この果物は皮ごと食べられる。", { context: "食べられる", word: "られる" }, "可能", ["受け身", "尊敬"], "「食べることができる」という可能の意味。"),
  q(5, "弟に荷物を持たせる。", { context: "持たせる", word: "せる" }, "使役", ["尊敬", "可能"], "弟に持つという行為をさせている。"),
  q(6, "明日は雨が降るだろう。", { word: "だろう" }, "推量", ["意志", "断定"], "確信はないが、そうなるだろうと予想している。"),
  q(7, "私が必ずやろう。", { context: "やろう", word: "う" }, "意志", ["推量", "勧誘"], "自分の意志で「必ずやる」と決めている。"),
  q(8, "一緒に行こう。", { context: "行こう", word: "う" }, "勧誘", ["意志", "推量"], "相手を誘っている。"),
  q(9, "空が曇ってきた。今にも雨が降りそうだ。", { context: "降りそうだ", word: "そうだ" }, "様態", ["伝聞", "比況"], "見た目からの判断・そのような様子である、という意味。"),
  q(10, "天気予報によると、明日は雨が降るそうだ。", { context: "降るそうだ", word: "そうだ" }, "伝聞", ["様態", "比況"], "他から聞いた情報を伝えている。"),
  q(11, "彼はまるで子どものようだ。", { context: "子どものようだ", word: "ようだ" }, "比況", ["様態", "例示"], "「まるで〜のようだ」で、他のものにたとえている。"),
  q(12, "彼のような選手になりたい。", { context: "彼のような", word: "ような" }, "例示", ["比況", "様態"], "「彼」を一例として挙げている。"),
  // 追加出題データ(2026年9月分)
  q(13, "妹はしきりに外へ行きたがる。", { context: "行きたがる", word: "たがる" }, "希望", ["使役", "様態"], "「〜たがる」は、他人(第三者)が何かを望んでいる様子を表す希望の助動詞。"),
  q(14, "彼は決して弱音を吐かぬ。", { context: "吐かぬ", word: "ぬ" }, "打ち消し", ["過去", "推量"], "「ぬ」は動詞の未然形に付いて、打ち消しの意味を表す助動詞。「ない」と同じ働き。"),
  q(15, "母は弟に部屋を片付けさせる。", { context: "片付けさせる", word: "させる" }, "使役", ["受け身", "尊敬"], "弟に片付けるという行為をさせている。"),
];
