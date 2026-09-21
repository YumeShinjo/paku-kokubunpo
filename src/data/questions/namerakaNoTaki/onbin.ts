import { createChoiceArranger, fillBlankQ } from "@/data/questionBuilders";
import type { AssemblyQuestion } from "@/data/schema";

const UNIT = "onbin";
const arrange = createChoiceArranger();

/**
 * 音便(穴埋め)。元データには解説がなかったため、どの音便になるかを説明する定型の解説を付けている。
 */
function q(
  n: number,
  base: string,
  stem: string,
  tail: string,
  answer: string,
  wrongs: string[],
  kind: string,
  result: string,
  note = "",
): AssemblyQuestion {
  const { choices, correctIndex } = arrange(answer, wrongs);
  return fillBlankQ({
    id: `taki-onbin-${String(n).padStart(2, "0")}`,
    unit: UNIT,
    instruction: `「${base}」に「た」を付けます。音便の形になるよう、空欄に入る音を選びましょう。`,
    sentenceTemplate: `${base}+た→${stem}___${tail}`,
    cards: choices,
    correctIndex,
    explanation: `「${base}」に「た」が付くと${kind}になり、「${result}」となる。${note}`,
    autoRuby: true,
  });
}

export const onbinQuestions: AssemblyQuestion[] = [
  q(1, "書く", "書", "た", "い", ["き", "く"], "イ音便", "書いた"),
  q(2, "読む", "読", "だ", "ん", ["み", "む"], "撥音便[はつおんびん]", "読んだ",
    "撥音便のあとの「た」は、「んた」ではなく「んだ」と濁る。"),
  q(3, "買う", "買", "た", "っ", ["い", "わ"], "促音便[そくおんびん]", "買った"),
  q(4, "走る", "走", "た", "っ", ["り", "る"], "促音便[そくおんびん]", "走った"),
  // 追加出題データ(2026年9月分)。「ぐ・ぬ・ぶ」のあとの「た」は「だ」と濁る
  q(5, "泳ぐ", "泳", "だ", "い", ["ぎ", "ぐ"], "イ音便", "泳いだ", "イ音便になる「ぐ」のあとの「た」は、「いた」ではなく「いだ」と濁る。"),
  q(6, "死ぬ", "死", "だ", "ん", ["に", "ぬ"], "撥音便[はつおんびん]", "死んだ", "撥音便のあとの「た」は、「んた」ではなく「んだ」と濁る。"),
  q(7, "呼ぶ", "呼", "だ", "ん", ["び", "ぶ"], "撥音便[はつおんびん]", "呼んだ", "撥音便のあとの「た」は、「んた」ではなく「んだ」と濁る。"),
  q(8, "立つ", "立", "た", "っ", ["ち", "つ"], "促音便[そくおんびん]", "立った"),
];
