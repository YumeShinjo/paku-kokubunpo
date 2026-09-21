import type { Question } from "./schema";
import { prologueQuestions } from "./questions/prologue";
import { kotobaNoIchibaQuestions } from "./questions/kotobaNoIchiba";
import { sugatakaeNoKajibaQuestions } from "./questions/sugatakaeNoKajiba";
import { namerakaNoTakiQuestions } from "./questions/namerakaNoTaki";
import { tsunagiNoHashiQuestions } from "./questions/tsunagiNoHashi";
import { kizunaNoMaQuestions } from "./questions/kizunaNoMa";
import { mikakeNoMaQuestions } from "./questions/mikakeNoMa";
import { ohzaNoMaQuestions } from "./questions/ohzaNoMa";
import { getStage } from "./stages";

/**
 * エリアidから出題データを取得する。
 * 単元を追加する際は questions/<areaId>/ 配下にステージ別のデータファイルを追加し、
 * そのエリアの index.ts と、必要なら下の questionsByArea に1行足すだけでよい
 * (9章: データ駆動設計 — 単元追加はデータ追加のみで対応できる構造)。
 */
const questionsByArea: Record<string, Question[]> = {
  prologue: prologueQuestions,
  kotobaNoIchiba: kotobaNoIchibaQuestions,
  sugatakaeNoKajiba: sugatakaeNoKajibaQuestions,
  namerakaNoTaki: namerakaNoTakiQuestions,
  tsunagiNoHashi: tsunagiNoHashiQuestions,
  kizunaNoMa: kizunaNoMaQuestions,
  mikakeNoMa: mikakeNoMaQuestions,
  ohzaNoMa: ohzaNoMaQuestions,
};

const questionById = new Map<string, Question>();
for (const list of Object.values(questionsByArea)) {
  for (const q of list) questionById.set(q.id, q);
}

/** 全エリアの問題(ラスボスの複合出題プールなど、エリア横断の処理で使う)。 */
export function getAllQuestions(): Question[] {
  return Object.values(questionsByArea).flat();
}

/** エリア全体の問題(復習の星付け対象を洗い出す用途など、エリア横断の処理で使う)。 */
export function getQuestionsForArea(areaId: string): Question[] {
  return questionsByArea[areaId] ?? [];
}

/** 単元(unit)ごとの問題プール。ことだまの書からの自由練習(6章)で使う。 */
export function getQuestionsForUnit(unitId: string): Question[] {
  return Object.values(questionsByArea)
    .flat()
    .filter((q) => q.unit === unitId);
}

/** 出題データが存在する単元id(登場順)。図鑑にはこの単元だけを並べる。 */
export function getAvailableUnitIds(): Set<string> {
  return new Set(
    Object.values(questionsByArea)
      .flat()
      .map((q) => q.unit),
  );
}

/** 1ステージ分の問題を、Stage.questionIds の順序通りに解決する(3章)。 */
export function getQuestionsForStage(stageId: string): Question[] {
  const stage = getStage(stageId);
  if (!stage) return [];
  return stage.questionIds
    .map((id) => questionById.get(id))
    .filter((q): q is Question => q !== undefined);
}
