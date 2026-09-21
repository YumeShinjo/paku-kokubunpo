import type { Question } from "@/data/schema";
import { kakujoshiQuestions } from "./kakujoshi";
import { setsuzokuJoshiQuestions } from "./setsuzokuJoshi";
import { fukujoshiQuestions } from "./fukujoshi";
import { shuujoshiQuestions } from "./shuujoshi";
import { gaNoShikibetsuQuestions } from "./gaNoShikibetsu";

export const tsunagiNoHashiQuestions: Question[] = [
  ...kakujoshiQuestions,
  ...setsuzokuJoshiQuestions,
  ...fukujoshiQuestions,
  ...shuujoshiQuestions,
  ...gaNoShikibetsuQuestions,
];
