import { createChoiceArranger, fillBlankQ } from "@/data/questionBuilders";
import type { AssemblyQuestion } from "@/data/schema";

const UNIT = "kanou-doushi";
const arrange = createChoiceArranger();

/**
 * 可能動詞(穴埋め: 語幹+空欄で完成する形)。
 * 元データには解説がなかったため、「語尾をどう変えると可能動詞になるか」の定型の解説を付けている。
 */
function q(n: number, base: string, stem: string, answer: string, wrongs: string[]): AssemblyQuestion {
  const { choices, correctIndex } = arrange(answer, wrongs);
  const ending = base.slice(stem.length);
  return fillBlankQ({
    id: `taki-kanou-${String(n).padStart(2, "0")}`,
    unit: UNIT,
    instruction: `「${base}」を可能動詞にして、空欄に当てはまる語尾を選びましょう。`,
    sentenceTemplate: `${base}→${stem}___`,
    cards: choices,
    correctIndex,
    explanation: `「${base}」の語尾「${ending}」を「${answer}」にすると、「〜することができる」という意味の可能動詞になる。`,
    autoRuby: true,
  });
}

export const kanouDoushiQuestions: AssemblyQuestion[] = [
  q(1, "書く", "書", "ける", ["げる", "せる"]),
  q(2, "泳ぐ", "泳", "げる", ["ける", "べる"]),
  q(3, "読む", "読", "める", ["べる", "げる"]),
  q(4, "走る", "走", "れる", ["える", "せる"]),
  q(5, "持つ", "持", "てる", ["でる", "せる"]),
  // 追加出題データ(2026年9月分)
  q(6, "話す", "話", "せる", ["ける", "へる"]),
  q(7, "立つ", "立", "てる", ["でる", "せる"]),
  q(8, "飛ぶ", "飛", "べる", ["でる", "げる"]),
  q(9, "使う", "使", "える", ["ける", "せる"]),
  q(10, "動く", "動", "ける", ["げる", "せる"]),
];
