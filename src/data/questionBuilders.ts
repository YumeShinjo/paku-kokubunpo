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
 * 文字列から決定的な疑似乱数値を作る(FNV-1aハッシュ)。同じ正解・誤答の組み合わせなら
 * 常に同じ値になるので、ビルドのたびに正解位置が変わったり、スクリーンショットテストが
 * 不安定になったりしない。内容そのものから求めるので、単元ファイル内の出現順や、
 * ファイルごとの問題数には左右されない(→ arrangeChoices の position に使う)。
 */
function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
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

/**
 * arrangeChoices の position を、0,1,2,… と順に回しつつ、開始位置(オフセット)だけは
 * その単元ファイル最初の問題の内容から決定的に求める版(単元ファイルごとに1つ作る)。
 *
 * かつては開始位置が常に0固定のカウンター方式だったため、単元ファイルの1問目は必ず先頭
 * (index 0)になり、ファイル数が多いこのアプリ全体で見ると正解が先頭に偏っていた
 * (生徒のテストプレイ報告と、実データでの検証で確認)。開始位置をファイルごとにずらす
 * ことで、全体としての先頭偏りを解消しつつ、1つの単元ファイル内では折り返しで
 * きっちり均等に配置される(問題数が少ない単元でも偏らない)という、順送り方式の
 * 良さも保っている。
 */
export function createChoiceArranger() {
  let offset: number | undefined;
  let count = 0;
  return (correct: string, wrongs: readonly string[]) => {
    if (offset === undefined) offset = hashSeed([correct, ...wrongs].join("\u0000"));
    return arrangeChoices(correct, wrongs, offset + count++);
  };
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
  // データ側は「正解を分かりやすい位置に書く」ことが多く、そのまま出題すると正解カードが
  // 先頭に偏る(実データ検証で67問中51問が先頭になっていた)。choiceQ と同じ内容ベースの
  // ハッシュで並べ替え、見た目の順序だけ変える(意味・正誤判定には影響しない)。
  const correctText = opts.cards[opts.correctIndex];
  const wrongTexts = opts.cards.filter((_, i) => i !== opts.correctIndex);
  const { choices: arrangedCards, correctIndex } = arrangeChoices(
    correctText,
    wrongTexts,
    hashSeed([correctText, ...wrongTexts].join("\u0000")),
  );
  const cardIds = sequentialIds(arrangedCards.length);
  const ruby = (text: string) => toRuby(text, opts.autoRuby);
  return {
    id: opts.id,
    unit: opts.unit,
    engine: "assembly",
    mode: "fillBlank",
    instruction: ruby(opts.instruction),
    sentenceTemplate: ruby(opts.sentenceTemplate),
    cards: arrangedCards.map((text, i) => ({ id: cardIds[i], text: ruby(text) })),
    correctOrder: [cardIds[correctIndex]],
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
