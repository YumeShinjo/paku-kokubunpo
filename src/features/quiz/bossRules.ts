/**
 * 小ボス・ラスボス戦のHPゲージ(3章「勝敗の扱い」)。
 * HPゲージは手応えを出すための演出であり、不正解でもプレイヤー側がダメージを受けることはない。
 * 正解1問につきボスのHPが1減り、出題プールを解ききってもHPが0にならなければ
 * 「もう少し」としてその場で再挑戦できる(ペナルティなし)。
 */

import type { StageType } from "@/data/schema";

/** ボス戦の種別ラベル(通常ステージは null)。ステージ選択・プレイ画面・結果画面で共通に使う。 */
export function bossLabel(type: StageType): string | null {
  if (type === "subBoss") return "小ボス";
  if (type === "lastBoss") return "ラスボス";
  return null;
}

/** 出題数のうち、何割正解すればHPが0になるか。1.0未満なので「もう少し」が起こりうる。 */
export const BOSS_CLEAR_RATIO = 0.6;

/**
 * ボスのHP最大値。出題数が2問以上なら、最低1問はミスしてもHPを0にできる値に抑える
 * (全問正解が必須になる小規模な出題を避ける)。
 */
export function bossHpMax(pickCount: number): number {
  if (pickCount <= 0) return 0;
  return Math.max(1, Math.min(Math.ceil(pickCount * BOSS_CLEAR_RATIO), pickCount - 1));
}
