import type { Question } from "@/data/schema";
import { jidoushiTadoushiQuestions } from "./jidoushiTadoushi";
import { kanouDoushiQuestions } from "./kanouDoushi";
import { onbinQuestions } from "./onbin";

export const namerakaNoTakiQuestions: Question[] = [
  ...jidoushiTadoushiQuestions,
  ...kanouDoushiQuestions,
  ...onbinQuestions,
];
