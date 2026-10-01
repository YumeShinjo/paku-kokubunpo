/**
 * 出題画面の上の背景の帯(StageVisual)で、背景画像(横長 1024×572)の、どの高さを見せるか。
 * 帯は横に長く(スマホで約2.2:1、PCで約2.8:1)、画像の縦横比(約1.8:1)より縦が足りないので、1枚の cover にすると、
 * 上下が切れる。見せたい建物・空・道などが切れないよう、縦の位置(background-position の縦。0%=上端、100%=下端)を決める。
 * エリアごとに変えたいときは、STAGE_VISUAL_FOCUS に足す(キーは、エリアid、または、荒れた背景の名前 "<エリアid>-corrupted")。
 */
export const DEFAULT_STAGE_VISUAL_FOCUS = "50%";

export const STAGE_VISUAL_FOCUS: Readonly<Record<string, string>> = {
  /** 道しるべの矢印が、上で切れないように、やや上 */
  prologue: "38%",
  /** 滝(上)と池(下)の両方が入るように、やや下(仕分けのように、帯が低いとき、滝だけにならない) */
  namerakaNoTaki: "58%",
  /** 橋の先のお城(上)と、橋(下)の両方が入るように、やや上 */
  tsunagiNoHashi: "42%",
  /** 玉座(奥の中央)から、手前のじゅうたんまでが入るように、やや下 */
  ohzaNoMa: "56%",
};

/** 背景の名前(エリアid、または "<エリアid>-corrupted")に対する、縦の位置 */
export function stageVisualFocus(name: string): string {
  const areaId = name.replace(/-corrupted$/, "");
  return STAGE_VISUAL_FOCUS[name] ?? STAGE_VISUAL_FOCUS[areaId] ?? DEFAULT_STAGE_VISUAL_FOCUS;
}
