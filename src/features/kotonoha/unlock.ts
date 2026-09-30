import { useProgressStore } from "@/app/store/progressStore";

/** 言の葉の森は、「ことばの分かれ道」(序章)をクリアしたら遊べる */
export const KOTONOHA_UNLOCK_AREA_ID = "prologue";

/** 言の葉の森が遊べるか(序章をクリアしたか)。画面の中で使う版(序章をクリアしたときに、表示が切り替わる) */
export function useKotonohaUnlocked(): boolean {
  return useProgressStore((s) => s.isAreaCleared(KOTONOHA_UNLOCK_AREA_ID));
}

/** 画面の外(タブの定義など)から、いまの状態を調べる版 */
export function isKotonohaUnlockedNow(): boolean {
  return useProgressStore.getState().isAreaCleared(KOTONOHA_UNLOCK_AREA_ID);
}

/** 未解放のときの案内 */
export const KOTONOHA_LOCKED_MESSAGE = "ことばの分かれ道をクリアすると遊べるよ";
