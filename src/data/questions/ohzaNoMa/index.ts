import type { Question } from "@/data/schema";
import {
  keigoShikibetsuQuestions,
  kenjougoQuestions,
  sonkeigoQuestions,
  teineigoQuestions,
} from "./keigo";

export const ohzaNoMaQuestions: Question[] = [
  ...sonkeigoQuestions,
  ...kenjougoQuestions,
  ...teineigoQuestions,
  ...keigoShikibetsuQuestions,
];
