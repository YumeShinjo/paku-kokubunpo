import { arrangeChoices } from "@/data/questionBuilders";
import type { IdiomCategory, IdiomQuestion } from "@/data/kotowaza";

/** 出題の範囲: すべて / ことわざ / 故事成語 */
export type KotonohaScope = "all" | IdiomCategory;

export const ROUND_SIZE = 10;

export const SCOPE_LABELS: Record<KotonohaScope, string> = {
  all: "すべて",
  kotowaza: "ことわざ",
  koji: "故事成語[こじせいご]",
};

/** 範囲に入る問題 */
export function questionsInScope(all: readonly IdiomQuestion[], scope: KotonohaScope): IdiomQuestion[] {
  return scope === "all" ? [...all] : all.filter((q) => q.category === scope);
}

/** 配列を、ランダムに並べ替えた新しい配列にする(Fisher-Yates)。random は 0以上1未満を返す関数(テストで差し替える) */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 1ラウンド(10問)の問題を選ぶ。
 *  1. まだ葉を集めていない問題を優先する(ランダムな順)
 *  2. 足りなければ、集め済みの問題から補う。前に間違えた問題を先に、そのあとの残りはランダムな順
 * 同じラウンドで、同じ問題を重ねて出さない。範囲に10問未満しかなければ、その数で終える。
 */
export function selectRound(opts: {
  questions: readonly IdiomQuestion[];
  scope: KotonohaScope;
  collectedIds: readonly string[];
  missedIds: readonly string[];
  size?: number;
  random?: () => number;
}): IdiomQuestion[] {
  const { scope, size = ROUND_SIZE, random = Math.random } = opts;
  const collected = new Set(opts.collectedIds);
  const missed = new Set(opts.missedIds);
  const pool = questionsInScope(opts.questions, scope);
  const uncollected = shuffle(
    pool.filter((q) => !collected.has(q.id)),
    random,
  );
  const missedCollected = shuffle(
    pool.filter((q) => collected.has(q.id) && missed.has(q.id)),
    random,
  );
  const restCollected = shuffle(
    pool.filter((q) => collected.has(q.id) && !missed.has(q.id)),
    random,
  );
  return [...uncollected, ...missedCollected, ...restCollected].slice(0, size);
}

/**
 * 問題の選択肢の並びを、ラウンドごとに変える。正解を position 番目(選択肢数で折り返す)に置き、誤答は元の順のまま。
 * position を、問題ごとに 0,1,2,… と回して渡せば、正解の位置が、1つの位置に偏らない(隣り合う位置の数の差は1以内)。
 */
export function arrangeRoundChoices(question: IdiomQuestion, position: number): IdiomQuestion["choices"] {
  const correct = question.choices.find((c) => c.id === question.correctChoiceId)!;
  const wrongs = question.choices.filter((c) => c.id !== question.correctChoiceId);
  const { choices } = arrangeChoices(
    correct.id,
    wrongs.map((c) => c.id),
    position,
  );
  const byId = new Map(question.choices.map((c) => [c.id, c]));
  return choices.map((id) => byId.get(id)!);
}

/** ラウンドの全問の選択肢を並べる。開始位置はランダムで、そのあと1問ごとにずらす(正解の位置が偏らない) */
export function arrangeRound(questions: readonly IdiomQuestion[], random: () => number = Math.random): IdiomQuestion[] {
  const start = Math.floor(random() * 4);
  return questions.map((q, i) => ({ ...q, choices: arrangeRoundChoices(q, start + i) }));
}
