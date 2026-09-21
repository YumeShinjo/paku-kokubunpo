import type { Question } from "@/data/schema";
import { doushiShuruiQuestions } from "./doushiShurui";
import { doushiKatsuyokeiQuestions } from "./doushiKatsuyokei";
import { keiyoushiQuestions } from "./keiyoushi";
import { keiyoudoushiQuestions } from "./keiyoudoushi";

export const sugatakaeNoKajibaQuestions: Question[] = [
  ...doushiShuruiQuestions,
  ...doushiKatsuyokeiQuestions,
  ...keiyoushiQuestions,
  ...keiyoudoushiQuestions,
];
