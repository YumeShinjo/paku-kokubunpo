/**
 * 言の葉の森で、ユライ(人物)とコト(相棒の小さな生き物)を並べるときの、大きさと足元の合わせ方。
 *
 * 2枚の立ち絵は、同じ規格(512×512の中央に、縦約438px・上の余白約37px)で作られている。そのまま同じ大きさの枠に並べると、
 * コトは丸く横に広い座り姿で、見た目の面積がユライより大きくなり、「コトが大きすぎる」ように見える。
 * そこで、枠は同じ大きさのまま、コトだけを、足元を原点にして縮める(足元の高さが動かないので、足元がそろう)。
 * 見た目の高さの比は、ユライ : コト = 1 : 0.65〜0.75 を目安にする(本編のストーリーの portraitScale と同じ考え方の、キャラ別の倍率)。
 */

/** 画像の中の、不透明な領域の実測(512×512のキャンバス内の px。アルファ値 40 より上の画素の外接する四角形) */
export const KOTONOHA_CANVAS = 512;
export const KOTONOHA_BBOX = {
  /** ユライ(kotonoha/yurai): 幅296・高さ438 */
  yurai: { left: 108, right: 404, top: 37, bottom: 475 },
  /** コト(mascot/base・happy): 幅375・高さ433(sad・surprised などの差分でも、±3px) */
  koto: { left: 72, right: 447, top: 39, bottom: 472 },
} as const;

/** コトにかける倍率(ユライの枠と同じ大きさの枠の中で、足元を原点に縮める) */
export const KOTO_SCALE = 0.72;

const height = (b: { top: number; bottom: number }) => b.bottom - b.top;

/** 見た目の高さの比: コト ÷ ユライ(目安 0.65〜0.75) */
export function kotoToYuraiHeightRatio(scale: number = KOTO_SCALE): number {
  return (height(KOTONOHA_BBOX.koto) * scale) / height(KOTONOHA_BBOX.yurai);
}

/** 枠の下端から、足元(不透明な領域の下端)までの距離(枠の高さに対する割合) */
export const feetFromBottom = (character: keyof typeof KOTONOHA_BBOX) =>
  (KOTONOHA_CANVAS - KOTONOHA_BBOX[character].bottom) / KOTONOHA_CANVAS;

/** 縮めるときの原点の縦位置(枠の上端から、コトの足元まで。枠の高さに対する%) */
export const KOTO_FEET_ORIGIN_PERCENT = (KOTONOHA_BBOX.koto.bottom / KOTONOHA_CANVAS) * 100;

/**
 * コトの足元を、ユライの足元の高さにそろえる、下向きのずらし(枠の高さに対する%)。
 * 枠が同じ大きさなら、ユライの足元のほうが、コトより少し下(3px/512)にある。その差の分だけ、コトを下げる。
 */
export const KOTO_FEET_SHIFT_PERCENT = ((KOTONOHA_BBOX.yurai.bottom - KOTONOHA_BBOX.koto.bottom) / KOTONOHA_CANVAS) * 100;
