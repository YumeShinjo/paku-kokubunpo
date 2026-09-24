/**
 * 主人公のアイコン(仮)。色と図形だけの簡単なもので、数種類から選ぶ(2章)。
 * ランキングの順位表にも、選んだアイコンの id が送られて表示される(firestore.rules の icon 項目)。
 * 種類を増やすときは、ここに1行足すだけでよい(id は端末とサーバーに保存されるので、あとから変えないこと)。
 * 実際のイラスト素材に差し替えるときも、id はそのままにして、表示側(PlayerIcon)だけを変える。
 */
export type IconShape = "circle" | "heart" | "star" | "square" | "triangle" | "diamond" | "drop" | "moon";

export interface PlayerIconMeta {
  id: string;
  /** 読み上げ・ツールチップ用の名前 */
  label: string;
  color: string;
  shape: IconShape;
}

export const PLAYER_ICONS: readonly PlayerIconMeta[] = [
  { id: "mint-circle", label: "ミントの丸", color: "#5fb896", shape: "circle" },
  { id: "pink-heart", label: "ピンクのハート", color: "#e88aa5", shape: "heart" },
  { id: "gold-star", label: "黄色の星", color: "#e6b93c", shape: "star" },
  { id: "blue-square", label: "青の四角", color: "#5b8fd6", shape: "square" },
  { id: "orange-triangle", label: "オレンジの三角", color: "#ec8c4a", shape: "triangle" },
  { id: "purple-diamond", label: "紫のひし形", color: "#9a7ad0", shape: "diamond" },
  { id: "sky-drop", label: "水色のしずく", color: "#4fb3cf", shape: "drop" },
  { id: "brown-moon", label: "茶色の月", color: "#a97c50", shape: "moon" },
];

export const DEFAULT_ICON_ID = PLAYER_ICONS[0].id;

/** id からアイコンを探す。知らない id(将来増えたアイコン・空)のときは、標準のアイコンにする */
export function findPlayerIcon(id: string | null | undefined): PlayerIconMeta {
  return PLAYER_ICONS.find((icon) => icon.id === id) ?? PLAYER_ICONS[0];
}

export const isPlayerIconId = (id: unknown): id is string =>
  typeof id === "string" && PLAYER_ICONS.some((icon) => icon.id === id);
