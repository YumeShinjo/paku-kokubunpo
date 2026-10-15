/**
 * 小ボス・ラスボス戦のHPゲージ(3章「勝敗の扱い」)。
 * 正解1問につきボスのHPが1減る。プレイヤー側にはライフ(BOSS_LIVES=5)があり、誤答1回につき1減る。
 * ライフが0になったら、そのステージを最初からやり直す。ライフが残ったまま出題プールを解ききっても
 * ボスのHPが0にならなければ「もう少し」としてその場で再挑戦できる。
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

/** ボス戦でのプレイヤーのライフ。誤答で1減り、0になったらそのステージを最初からやり直す */
export const BOSS_LIVES = 5;

/**
 * 連敗の救済: 負けるたびに、次の挑戦のライフが1ふえる。ふえるのは最大4(ライフは、最大で 5 + 4 = 9)。
 * 負けた回数は、ステージごとに保存し(progressStore の bossLosses)、クリアすると消える。
 */
export const BOSS_LIFE_BONUS_MAX = 4;

/** このステージの、いまのライフの最大値(負けた回数に応じて、BOSS_LIVES からふえる) */
export function bossLivesFor(losses: number): number {
  return BOSS_LIVES + Math.min(BOSS_LIFE_BONUS_MAX, Math.max(0, Math.floor(losses)));
}

/** 「先へすすむ」を出す、負けた回数(小ボスで、同じボスに2回以上負けたとき) */
export const ASSIST_AFTER_LOSSES = 2;
