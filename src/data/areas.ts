import type { AreaMeta } from "./schema";

/**
 * エリア一覧(3章)。全8エリアの出題データを組み込み済みで、implemented: true のエリアが
 * エリア選択に並ぶ。新しいエリアは data/questions/ にデータを追加し、ここを true にするだけでよい
 * (9章: データ駆動設計)。
 */
export const areas: AreaMeta[] = [
  {
    id: "prologue",
    order: 0,
    name: "ことばの分かれ道",
    unitLabel: "文節・単語",
    implemented: true,
  },
  {
    id: "kotobaNoIchiba",
    order: 1,
    name: "ことばの市場",
    unitLabel: "品詞分類・自立語/付属語",
    subBoss: "侍女見習い",
    subBossName: "メイ",
    implemented: true,
  },
  {
    id: "sugatakaeNoKajiba",
    order: 2,
    name: "姿変えの鍛冶場",
    unitLabel: "動詞・形容詞・形容動詞の活用",
    subBoss: "従者",
    subBossName: "レル",
    implemented: true,
  },
  {
    id: "namerakaNoTaki",
    order: 3,
    name: "なめらかの滝",
    unitLabel: "音便・可能動詞など",
    subBoss: "文官",
    subBossName: "オンヴィン",
    implemented: true,
  },
  {
    id: "tsunagiNoHashi",
    order: 4,
    name: "つなぎの橋",
    unitLabel: "助詞の種類",
    subBoss: "メイド長",
    subBossName: "ジョゼット",
    implemented: true,
  },
  {
    id: "kizunaNoMa",
    order: 5,
    name: "絆の間",
    unitLabel: "文節相互の関係",
    subBoss: "騎士団長",
    subBossName: "ネジラルド",
    implemented: true,
  },
  {
    id: "mikakeNoMa",
    order: 6,
    name: "見分けの間",
    unitLabel: "助動詞・紛らわしい語の識別",
    subBoss: "大臣",
    subBossName: "サイラス",
    implemented: true,
  },
  {
    id: "ohzaNoMa",
    order: 7,
    name: "王座の間",
    unitLabel: "敬語+真相究明",
    subBoss: "宰相",
    subBossName: "ニジュヴェール",
    finalBoss: "王様",
    implemented: true,
  },
];

/** 出題データが組み込み済みで、エリア選択に表示するエリア */
export const playableAreas = areas.filter((a) => a.implemented);
