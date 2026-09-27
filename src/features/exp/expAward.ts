import { useExpStore } from "@/app/store/expStore";

/**
 * 経験値の付与量(クリア画面の演出強化)。見た目上の成長演出だけが目的で、
 * 進行度・難易度・解放条件には一切影響しない。
 */
/** 正解1問ごと */
export const EXP_PER_CORRECT = 2;
/** 「にがて」マークが付いている単元の問題に正解したときの追加ボーナス(EXP_PER_CORRECTに上乗せ) */
export const WEAK_UNIT_BONUS_EXP = 6;
/** 小ボス撃破(=エリアクリア)の初回ボーナス。周回プレイでは付与しない */
export const AREA_CLEAR_EXP = 50;
/** ラスボス(王様)撃破の初回ボーナス。周回プレイでは付与しない */
export const LAST_BOSS_CLEAR_EXP = 200;

/** 経験値を加算する(0以下は何もしない) */
export function gainExp(amount: number): void {
  if (amount > 0) useExpStore.getState().addExp(amount);
}
