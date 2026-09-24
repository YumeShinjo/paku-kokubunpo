import type { MascotExpression } from "@/assets/registry";

/** 星(苦手問題)がこの数以上たまると、タイトルのコトが眠そうにする。これ未満は通常の表情(にっこり) */
export const SLEEPY_STAR_THRESHOLD = 5;

/** タイトル画面のコトの表情。星の問題がたくさん残っているときだけ眠そう。それ以外は指定なし(通常のベース画像) */
export function titleExpression(starCount: number): MascotExpression | undefined {
  return starCount >= SLEEPY_STAR_THRESHOLD ? "sleepy" : undefined;
}
