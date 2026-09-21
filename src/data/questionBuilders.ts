import type {
  AssemblyQuestion,
  ChoiceQuestion,
  RubyText,
  SortingQuestion,
} from "./schema";
import { autoRuby } from "./furigana";
import { rb } from "./ruby";

/**
 * 出題データの組み立てヘルパー。
 * 文法用語には furigana.ts の辞書でふりがなを自動で付ける(全エリア一律)。
 * 各ビルダーに autoRuby: false を渡すと、その問題だけ自動付与を止められる
 * (データ内に書いた "漢字[ふりがな]" は、どちらの場合もルビになる)。
 */
function toRuby(text: string, auto: boolean | undefined): RubyText {
  return rb(auto === false ? text : autoRuby(text));
}

/** a, b, c, ... の選択肢/カードidを必要数だけ生成する */
function sequentialIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(97 + i));
}

/**
 * 正解を position 番目(選択肢数で折り返す)に置いた選択肢配列を作る。
 * 元データが「正解・誤答」の順で書かれている場合に、正解がいつも先頭にならないようにする。
 */
export function arrangeChoices(
  correct: string,
  wrongs: readonly string[],
  position: number,
): { choices: string[]; correctIndex: number } {
  const correctIndex = position % (wrongs.length + 1);
  const choices = [...wrongs];
  choices.splice(correctIndex, 0, correct);
  return { choices, correctIndex };
}

/** arrangeChoices の位置を、呼ぶたびに 0,1,2,… と回していく版(単元ファイルごとに1つ作る) */
export function createChoiceArranger() {
  let count = 0;
  return (correct: string, wrongs: readonly string[]) =>
    arrangeChoices(correct, wrongs, count++);
}

/**
 * 選択式(choice)エンジン用の問題を組み立てる。
 * choices は出題データの提示順そのまま、correctIndex で正解の位置を指定する。
 */
export function choiceQ(opts: {
  id: string;
  unit: string;
  prompt: string;
  situation?: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
  tags?: string[];
  autoRuby?: boolean;
}): ChoiceQuestion {
  const choiceIds = sequentialIds(opts.choices.length);
  const ruby = (text: string) => toRuby(text, opts.autoRuby);
  return {
    id: opts.id,
    unit: opts.unit,
    engine: "choice",
    prompt: ruby(opts.prompt),
    situation: opts.situation ? ruby(opts.situation) : undefined,
    choices: opts.choices.map((text, i) => ({ id: choiceIds[i], text: ruby(text) })),
    correctChoiceId: choiceIds[opts.correctIndex],
    explanation: opts.explanation ? ruby(opts.explanation) : undefined,
    tags: opts.tags,
  };
}

/**
 * 選択式の「文中タップ」表示モード(display: "tapInSentence")の問題を組み立てる。
 * sentence は文節を空白で区切って書く(例: "弟が 公園で 元気に 遊ぶ。")。
 * given は問いの基準になる文節(強調表示・タップ対象外)、correct は正解の文節。
 * それ以外の文節はすべてタップできる誤答になる。given/correct は文末の句読点を無視して照合する
 * (文中の「遊ぶ。」を「遊ぶ」と書いてよい)。
 */
export function tapQ(opts: {
  id: string;
  unit: string;
  prompt: string;
  sentence: string;
  given: string;
  correct: string;
  explanation?: string;
  tags?: string[];
  autoRuby?: boolean;
}): ChoiceQuestion {
  // \s は全角空白も含むので、半角・全角どちらの区切りでも分割できる
  const segments = opts.sentence.split(/\s+/).filter(Boolean);
  const strip = (text: string) => text.replace(/[。、!?！？]+$/u, "");
  const indexOf = (role: string, text: string) => {
    const hits = segments.flatMap((s, i) => (strip(s) === strip(text) ? [i] : []));
    if (hits.length !== 1) {
      throw new Error(
        `${opts.id}: ${role}「${text}」が文中に${hits.length}個ある(ちょうど1個必要): ${opts.sentence}`,
      );
    }
    return hits[0];
  };
  const givenIndex = indexOf("基準の文節", opts.given);
  const correctIndex = indexOf("正解の文節", opts.correct);
  if (givenIndex === correctIndex) {
    throw new Error(`${opts.id}: 基準の文節と正解の文節が同じ`);
  }

  const ruby = (text: string) => toRuby(text, opts.autoRuby);
  return {
    id: opts.id,
    unit: opts.unit,
    engine: "choice",
    display: "tapInSentence",
    prompt: ruby(opts.prompt),
    choices: segments.map((text, i) => ({
      id: `s${i + 1}`,
      text: ruby(text),
      ...(i === givenIndex ? { given: true } : {}),
    })),
    correctChoiceId: `s${correctIndex + 1}`,
    explanation: opts.explanation ? ruby(opts.explanation) : undefined,
    tags: opts.tags,
  };
}

/**
 * 組み立てパズル(assembly / fillBlank)エンジン用の問題を組み立てる。
 * sentenceTemplate 内の "___" が空欄になり、選んだカードのテキストがそこに入る。
 */
export function fillBlankQ(opts: {
  id: string;
  unit: string;
  instruction: string;
  sentenceTemplate: string;
  cards: string[];
  correctIndex: number;
  explanation?: string;
  tags?: string[];
  autoRuby?: boolean;
}): AssemblyQuestion {
  const cardIds = sequentialIds(opts.cards.length);
  const ruby = (text: string) => toRuby(text, opts.autoRuby);
  return {
    id: opts.id,
    unit: opts.unit,
    engine: "assembly",
    mode: "fillBlank",
    instruction: ruby(opts.instruction),
    sentenceTemplate: ruby(opts.sentenceTemplate),
    cards: opts.cards.map((text, i) => ({ id: cardIds[i], text: ruby(text) })),
    correctOrder: [cardIds[opts.correctIndex]],
    explanation: opts.explanation ? ruby(opts.explanation) : undefined,
    tags: opts.tags,
  };
}

/**
 * 仕分けゲーム(sorting)エンジン用の問題を組み立てる。
 * 複数の項目(item)を共通のカゴ(category)へ分類させる。
 */
export function sortingQ(opts: {
  id: string;
  unit: string;
  instruction: string;
  categories: { id: string; label: string }[];
  items: {
    id: string;
    text: string;
    correctCategoryId: string;
    explanation?: string;
  }[];
  tags?: string[];
  autoRuby?: boolean;
}): SortingQuestion {
  const ruby = (text: string) => toRuby(text, opts.autoRuby);
  return {
    id: opts.id,
    unit: opts.unit,
    engine: "sorting",
    instruction: ruby(opts.instruction),
    categories: opts.categories.map((c) => ({ id: c.id, label: ruby(c.label) })),
    items: opts.items.map((item) => ({
      id: item.id,
      text: ruby(item.text),
      correctCategoryId: item.correctCategoryId,
      explanation: item.explanation ? ruby(item.explanation) : undefined,
    })),
    tags: opts.tags,
  };
}
