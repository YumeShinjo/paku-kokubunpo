import type { Question } from "@/data/schema";
import { getAllQuestions } from "@/data/questionLoader";
import type { SavedSession } from "@/app/store/sessionStore";

/** QuizPlayer が持つ進行状況(再開のために保存・復元する) */
export interface QuizProgress {
  index: number;
  correctCount: number;
  combo: number;
  maxCombo: number;
  hp: number;
  /** ボス戦のプレイヤーのライフ(古い保存データにはない) */
  lives?: number;
}

export interface RestoredSession {
  questions: Question[];
  progress: QuizProgress;
}

const isCount = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n) && n >= 0;

/**
 * 保存された状態から、出題と進行状況を復元する。次のときは null(=最初から遊ぶ):
 *  - 別のステージの保存 / 問題データが変わって、保存した問題idが見つからない(アプリ更新後など)
 *  - 保存内容が壊れている(位置や回数が不正、問題が空)
 */
export function restoreSession(
  saved: SavedSession | null,
  stageId: string,
  lookup: (id: string) => Question | undefined = defaultLookup,
): RestoredSession | null {
  if (!saved || saved.stageId !== stageId) return null;
  if (!Array.isArray(saved.questionIds) || saved.questionIds.length === 0) return null;
  if (![saved.index, saved.correctCount, saved.combo, saved.maxCombo, saved.hp].every(isCount)) return null;
  if (saved.index >= saved.questionIds.length) return null;

  const questions: Question[] = [];
  for (const id of saved.questionIds) {
    const q = lookup(id);
    if (!q) return null;
    questions.push(q);
  }
  return {
    questions,
    progress: {
      index: saved.index,
      correctCount: saved.correctCount,
      combo: saved.combo,
      maxCombo: saved.maxCombo,
      hp: saved.hp,
      lives: isCount(saved.lives) ? saved.lives : undefined,
    },
  };
}

let questionIndex: Map<string, Question> | null = null;
function defaultLookup(id: string): Question | undefined {
  if (!questionIndex) questionIndex = new Map(getAllQuestions().map((q) => [q.id, q]));
  return questionIndex.get(id);
}

/** ステージ選択の表示用: 保存された状態が、このステージの再開として使えるか */
export function canResume(saved: SavedSession | null, stageId: string): boolean {
  return restoreSession(saved, stageId) !== null;
}
