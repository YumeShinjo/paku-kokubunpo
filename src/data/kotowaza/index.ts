import { kojiQuestions } from "./koji";
import { kotowazaQuestions } from "./kotowaza";
import type { IdiomQuestion } from "./types";

export type { IdiomCategory, IdiomQuestion } from "./types";
export { kojiQuestions, kotowazaQuestions };

/** ことわざ50問 + 故事成語30問(計80問)。ミニゲーム「言の葉の森」用。本編の getAllQuestions() には含まれない */
export function getAllIdiomQuestions(): IdiomQuestion[] {
  return [...kotowazaQuestions, ...kojiQuestions];
}
