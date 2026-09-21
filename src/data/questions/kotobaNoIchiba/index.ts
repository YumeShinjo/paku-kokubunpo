import type { Question } from "@/data/schema";
import { hinshiBunruiQuestions } from "./hinshiBunrui";
import { jiritsuFuzokuQuestions } from "./jiritsuFuzoku";
import { katsuyouUmuQuestions } from "./katsuyouUmu";

export const kotobaNoIchibaQuestions: Question[] = [
  ...hinshiBunruiQuestions,
  ...jiritsuFuzokuQuestions,
  ...katsuyouUmuQuestions,
];
