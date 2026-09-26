import type { CSSProperties } from "react";

/**
 * エリアごとのアクセントカラー(マップ・ステージ選択用。SPEC 10章の表で確定)。
 * 全体の配色(クリーム地・パステルミント・淡いゴールド・焦げ茶)を崩さない、やわらかい色にそろえている。
 * 値はここだけで管理する(画面は CSS 変数 --area-accent で受け取る)。
 */
export const areaAccentColors: Record<string, string> = {
  prologue: "#b9e3a0", // 淡いグリーン
  kotobaNoIchiba: "#e6c24d", // マスタードイエロー
  sugatakaeNoKajiba: "#ffc48a", // 淡いオレンジ
  namerakaNoTaki: "#a8d8f0", // 淡いブルー
  tsunagiNoHashi: "#c9a77c", // ウッドブラウン(タン)
  kizunaNoMa: "#f4b3c4", // 淡いローズピンク
  mikakeNoMa: "#cdbfee", // 淡いラベンダー
  ohzaNoMa: "#d4a72c", // ディープゴールド
};

/** エリアのアクセントカラー。未登録のエリアは、メインのミント */
export function areaAccent(areaId: string): string {
  return areaAccentColors[areaId] ?? "#a8e0c8";
}

/** 画面の要素に付けるスタイル(CSS変数 --area-accent を渡す) */
export function areaAccentStyle(areaId: string): CSSProperties {
  return { ["--area-accent" as string]: areaAccent(areaId) };
}

/**
 * エリアのテーマを示す小さなモチーフ(通常ステージの背景バーに重ねる)。いまは絵文字の仮表示。
 * 正式なアイコン素材ができたら、ここを差し替える。
 */
export const areaMotifs: Record<string, string> = {
  prologue: "🌿", // 草原
  kotobaNoIchiba: "🏮", // 屋台
  sugatakaeNoKajiba: "🔨", // 金づち
  namerakaNoTaki: "💧", // 滝
  tsunagiNoHashi: "🌉", // 橋
  kizunaNoMa: "🧵", // 絆の糸
  mikakeNoMa: "🔍", // 見破るレンズ
  ohzaNoMa: "👑", // 王座
};
