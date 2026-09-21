import type { Question } from "@/data/schema";
import { jodoushiImiQuestions } from "./jodoushiImi";
import { magirawashiiGoQuestions } from "./magirawashiiGo";

export const mikakeNoMaQuestions: Question[] = [
  ...jodoushiImiQuestions,
  ...magirawashiiGoQuestions,
];
