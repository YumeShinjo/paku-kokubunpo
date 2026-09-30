/**
 * 成長アクセサリー(mascot/accessory-1〜7)の、画像の中で絵が描かれている範囲(512×512のキャンバス内の px)。
 * アクセサリーの画像は、マスコットに重ねる前提で、キャンバス全体が透明で、絵は小さくしか入っていない。
 * エリアの一覧などで、アクセサリーだけを小さく見せるときに、この範囲を切り出して拡大するために使う。
 * 画像を差し替えたときは、ここの数字も合わせる(画像の透明でない部分の外接する四角形)。
 */
export const ACCESSORY_CANVAS = 512;

export const ACCESSORY_BOUNDS: Readonly<Record<number, { left: number; top: number; right: number; bottom: number }>> = {
  1: { left: 166, top: 277, right: 351, bottom: 426 },
  2: { left: 215, top: 301, right: 257, bottom: 360 },
  3: { left: 162, top: 263, right: 299, bottom: 376 },
  4: { left: 182, top: 274, right: 222, bottom: 329 },
  5: { left: 276, top: 110, right: 369, bottom: 196 },
  6: { left: 217, top: 102, right: 337, bottom: 269 },
  7: { left: 179, top: 17, right: 269, bottom: 78 },
};

/**
 * 正方形の枠いっぱい(少し余白を残して)にアクセサリーを見せるための、画像の置き方。
 * 画像の幅・左・上を、枠に対する割合(%)で返す(画像は枠の中で絶対配置する)。
 */
export function accessoryCrop(stage: number): { width: number; left: number; top: number } | undefined {
  const b = ACCESSORY_BOUNDS[stage];
  if (!b) return undefined;
  const side = Math.max(b.right - b.left, b.bottom - b.top) * 1.12; // 少し余白
  const cx = (b.left + b.right) / 2;
  const cy = (b.top + b.bottom) / 2;
  return {
    width: (ACCESSORY_CANVAS / side) * 100,
    left: (0.5 - cx / side) * 100,
    top: (0.5 - cy / side) * 100,
  };
}
