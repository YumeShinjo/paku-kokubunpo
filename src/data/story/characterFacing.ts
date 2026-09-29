/**
 * 立ち絵ごとの「顔の向き」(画像の中で、顔が向いている側)。立ち絵の左右配置の、唯一の元データ。
 * 顔が向いている側が画面の内側(会話テキスト側)になるよう、右向きは画面の左寄り、左向きは右寄りに置く
 * (features/story/portraitLayout.ts)。
 * 通常・浄化前・浄化後は同じポーズなので、キャラクターごとに1つだけ持つ。向きを直すときは、ここだけを直せばよい。
 */
export type Facing = "left" | "right";

export const PORTRAIT_FACING: Record<string, Facing> = {
  コト: "left",
  コレット: "left",
  ヴェルバルト: "left",
  メイ: "right",
  レル: "left",
  オンヴィン: "left",
  ジョゼット: "right",
  ネジラルド: "left",
  サイラス: "left",
  ニジュヴェール: "right",
};

/** 王様の立ち絵を出す話者か(浄化後は「ヴェルバルト」、取り憑かれた姿は「王(…)」という名前で話す) */
export function isKingSpeaker(speaker: string | undefined): boolean {
  return speaker === "ヴェルバルト" || (speaker?.startsWith("王(") ?? false);
}

/** 話者名から、顔の向きの定義のキーを引く(王様は、取り憑かれた姿も「ヴェルバルト」として扱う) */
export function facingOfSpeaker(speaker: string | undefined): Facing | undefined {
  if (isKingSpeaker(speaker)) return PORTRAIT_FACING["ヴェルバルト"];
  return speaker === undefined ? undefined : PORTRAIT_FACING[speaker];
}

/** マスコットの立ち絵の顔の向き。本来の姿(form: "true")はコレット、それ以外はコト */
export function facingOfMascot(form: string | undefined): Facing {
  return PORTRAIT_FACING[form === "true" ? "コレット" : "コト"];
}
