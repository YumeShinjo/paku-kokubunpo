import type { Question, Stage } from "./schema";
import { areas } from "./areas";
import { prologueQuestions } from "./questions/prologue";
import { kotobaNoIchibaQuestions } from "./questions/kotobaNoIchiba";
import { sugatakaeNoKajibaQuestions } from "./questions/sugatakaeNoKajiba";
import { namerakaNoTakiQuestions } from "./questions/namerakaNoTaki";
import { tsunagiNoHashiQuestions } from "./questions/tsunagiNoHashi";
import { kizunaNoMaQuestions } from "./questions/kizunaNoMa";
import { mikakeNoMaQuestions } from "./questions/mikakeNoMa";
import { ohzaNoMaQuestions } from "./questions/ohzaNoMa";

/**
 * エリアの問題群を「1ステージ8〜10問」程度に分割する(3章)。
 * 単元追加時は questions/<area>/ にデータを足すだけで、この分割ロジックは
 * 問題数の変化に自動で追従する(9章: データ駆動設計)。
 */
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** 通常ステージ1つの問題数の上限(3章: 1ステージ8〜10問) */
const NORMAL_STAGE_MAX = 10;

/**
 * 問題を上限 maxSize 以下の最小のステージ数で、できるだけ均等に分ける(例: 23問→8,8,7)。
 * 問題数が少ないエリア(滝・橋・王座の間)でも、極端に小さいステージが最後に余らないようにする。
 */
export function splitEvenly<T>(items: T[], maxSize: number): T[][] {
  if (items.length === 0) return [];
  const count = Math.ceil(items.length / maxSize);
  const base = Math.floor(items.length / count);
  const extra = items.length % count;
  const chunks: T[][] = [];
  let start = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < extra ? 1 : 0);
    chunks.push(items.slice(start, start + size));
    start += size;
  }
  return chunks;
}

function toNormalStages(areaId: string, chunks: string[][]): Stage[] {
  return chunks.map((questionIds, i) => ({
    id: `${areaId}-stage${i + 1}`,
    areaId,
    type: "normal",
    title: `ステージ${i + 1}`,
    questionIds,
  }));
}

function buildNormalStages(
  areaId: string,
  questions: Question[],
  size: number,
): Stage[] {
  return toNormalStages(
    areaId,
    chunk(
      questions.map((q) => q.id),
      size,
    ),
  );
}

function buildNormalStagesEvenly(areaId: string, questions: Question[]): Stage[] {
  return toNormalStages(
    areaId,
    splitEvenly(
      questions.map((q) => q.id),
      NORMAL_STAGE_MAX,
    ),
  );
}

/**
 * 小ボスの出題数(通常ステージの8〜10問より多く、ボス戦らしい手応えを出す)。
 * プールは、そのエリアの通常ステージの全問題。プールがこれより小さいエリアでは、プールの全問。
 */
const SUB_BOSS_PICKS = 15;

/** ラスボス(王座の間)の出題数。全エリアの内容から単元ごとに均等に抽出する(3章) */
const LAST_BOSS_PICKS = 16;

/**
 * 小ボスステージ(3章: そのエリアでこれまでに学んだ内容を複合出題する中間復習ステージ)。
 * プールは通常ステージの全問題。実際の出題は挑戦のたびに、単元ごとに均等になるよう
 * 層化抽出する(5章の出題選定ロジック。再挑戦のたびに別の問題の組み合わせになる)。
 */
function buildSubBossStage(
  areaId: string,
  title: string,
  normalStages: Stage[],
): Stage {
  const questionIds = normalStages.flatMap((stage) => stage.questionIds);
  return {
    id: `${areaId}-subboss`,
    areaId,
    type: "subBoss",
    title,
    questionIds,
    pickCount: Math.min(questionIds.length, SUB_BOSS_PICKS),
  };
}

/**
 * ラスボスステージ(3章: 全エリアの内容を複合出題する総仕上げ)。
 * プールは全エリアの全問題で、挑戦のたびに単元ごとに均等になるよう層化抽出する。
 * 同じエリアの小ボス(宰相)をクリアするまでは挑戦できない(「宰相撃破→真相究明→ラスボス」の順)。
 */
function buildLastBossStage(areaId: string, title: string): Stage {
  const questionIds = allQuestions.map((q) => q.id);
  return {
    id: `${areaId}-lastboss`,
    areaId,
    type: "lastBoss",
    title,
    questionIds,
    pickCount: Math.min(questionIds.length, LAST_BOSS_PICKS),
    requires: [`${areaId}-subboss`],
  };
}

/** ステージ選択画面などに出す、1回の挑戦で出題される問題数 */
export function stageQuestionCount(stage: Stage): number {
  return stage.pickCount ?? stage.questionIds.length;
}

/** 小ボスの表示名。役職+名前(例: 「侍女見習い・メイ」)。名前が未設定なら役職のみ。 */
function subBossTitle(areaId: string): string {
  const area = areas.find((a) => a.id === areaId);
  const role = area?.subBoss ?? "小ボス";
  return area?.subBossName ? `${role}・${area.subBossName}` : role;
}

const allQuestions: Question[] = [
  ...prologueQuestions,
  ...kotobaNoIchibaQuestions,
  ...sugatakaeNoKajibaQuestions,
  ...namerakaNoTakiQuestions,
  ...tsunagiNoHashiQuestions,
  ...kizunaNoMaQuestions,
  ...mikakeNoMaQuestions,
  ...ohzaNoMaQuestions,
];

/** 通常ステージ(均等分割)+小ボス。残り5エリアはこの構成で組み立てる。 */
function buildAreaStages(areaId: string, questions: Question[]): Stage[] {
  const normal = buildNormalStagesEvenly(areaId, questions);
  return [...normal, buildSubBossStage(areaId, subBossTitle(areaId), normal)];
}

// 序章(16問)は文節/単語の区切りで自然に2ステージへ分かれ、小ボスはいない(3章)。
export const prologueStages: Stage[] = [
  {
    id: "prologue-stage1",
    areaId: "prologue",
    type: "normal",
    title: "文節の区切り",
    questionIds: prologueQuestions.slice(0, 8).map((q) => q.id),
  },
  {
    id: "prologue-stage2",
    areaId: "prologue",
    type: "normal",
    title: "単語の区切り",
    questionIds: prologueQuestions.slice(8, 16).map((q) => q.id),
  },
];

// ことばの市場(33画面 = 品詞分類3バッチ+自立語付属語15+活用の有無15)を5ステージ程度に分割。
const kotobaNoIchibaNormalStages = buildNormalStages(
  "kotobaNoIchiba",
  kotobaNoIchibaQuestions,
  7,
);
export const kotobaNoIchibaStages: Stage[] = [
  ...kotobaNoIchibaNormalStages,
  buildSubBossStage(
    "kotobaNoIchiba",
    subBossTitle("kotobaNoIchiba"),
    kotobaNoIchibaNormalStages,
  ),
];

// 姿変えの鍛冶場(60問)を6ステージに分割(10問ずつ、8〜10問の範囲を満たす)。
const sugatakaeNoKajibaNormalStages = buildNormalStages(
  "sugatakaeNoKajiba",
  sugatakaeNoKajibaQuestions,
  10,
);
export const sugatakaeNoKajibaStages: Stage[] = [
  ...sugatakaeNoKajibaNormalStages,
  buildSubBossStage(
    "sugatakaeNoKajiba",
    subBossTitle("sugatakaeNoKajiba"),
    sugatakaeNoKajibaNormalStages,
  ),
];

// 残り5エリアは問題数が少なめなので、8〜10問に収まる最小のステージ数へ均等に分ける。
// 王座の間だけは小ボス(宰相)のあとにラスボス(王様)が続く(3章)。
const ohzaNoMaStages: Stage[] = [
  ...buildAreaStages("ohzaNoMa", ohzaNoMaQuestions),
  buildLastBossStage(
    "ohzaNoMa",
    areas.find((a) => a.id === "ohzaNoMa")?.finalBoss ?? "ラスボス",
  ),
];

const stagesByArea: Record<string, Stage[]> = {
  prologue: prologueStages,
  kotobaNoIchiba: kotobaNoIchibaStages,
  sugatakaeNoKajiba: sugatakaeNoKajibaStages,
  namerakaNoTaki: buildAreaStages("namerakaNoTaki", namerakaNoTakiQuestions),
  tsunagiNoHashi: buildAreaStages("tsunagiNoHashi", tsunagiNoHashiQuestions),
  kizunaNoMa: buildAreaStages("kizunaNoMa", kizunaNoMaQuestions),
  mikakeNoMa: buildAreaStages("mikakeNoMa", mikakeNoMaQuestions),
  ohzaNoMa: ohzaNoMaStages,
};

export function getStagesForArea(areaId: string): Stage[] {
  return stagesByArea[areaId] ?? [];
}

export function getStage(stageId: string): Stage | undefined {
  return Object.values(stagesByArea)
    .flat()
    .find((s) => s.id === stageId);
}
