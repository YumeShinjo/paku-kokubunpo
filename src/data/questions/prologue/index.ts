import type { Question } from "@/data/schema";
import { bunsetsuQuestions } from "./bunsetsu";
import { tangoQuestions } from "./tango";

export const prologueQuestions: Question[] = [
  ...bunsetsuQuestions,
  ...tangoQuestions,
];
