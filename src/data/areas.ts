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
    nameRuby: "ことばの分[わ]かれ道[みち]",
    unitLabel: "文節・単語",
    implemented: true,
  },
  {
    id: "kotobaNoIchiba",
    order: 1,
    name: "ことばの市場",
    nameRuby: "ことばの市場[いちば]",
    unitLabel: "品詞分類・自立語/付属語",
    unitLabelRuby: "品詞[ひんし]分類[ぶんるい]・自立語[じりつご]/付属語[ふぞくご]",
    subBoss: "侍女見習い",
    subBossRuby: "侍女[じじょ]見習[みなら]い",
    subBossName: "メイ",
    implemented: true,
  },
  {
    id: "sugatakaeNoKajiba",
    order: 2,
    name: "姿変えの鍛冶場",
    nameRuby: "姿変[すがたが]えの鍛冶場[かじば]",
    unitLabel: "動詞・形容詞・形容動詞の活用",
    subBoss: "鍛冶見習い",
    subBossRuby: "鍛冶[かじ]見習[みなら]い",
    subBossName: "レル",
    implemented: true,
  },
  {
    id: "namerakaNoTaki",
    order: 3,
    name: "なめらかの滝",
    nameRuby: "なめらかの滝[たき]",
    unitLabel: "音便・可能動詞など",
    subBoss: "文官",
    subBossRuby: "文官[ぶんかん]",
    subBossName: "オンヴィン",
    implemented: true,
  },
  {
    id: "tsunagiNoHashi",
    order: 4,
    name: "つなぎの橋",
    nameRuby: "つなぎの橋[はし]",
    unitLabel: "助詞の種類",
    subBoss: "メイド長",
    subBossRuby: "メイド長[ちょう]",
    subBossName: "ジョゼット",
    implemented: true,
  },
  {
    id: "kizunaNoMa",
    order: 5,
    name: "絆の間",
    nameRuby: "絆[きずな]の間[ま]",
    unitLabel: "文節相互の関係",
    unitLabelRuby: "文節[ぶんせつ]相互[そうご]の関係[かんけい]",
    subBoss: "騎士団長",
    subBossRuby: "騎士団長[きしだんちょう]",
    subBossName: "ネジラルド",
    implemented: true,
  },
  {
    id: "mikakeNoMa",
    order: 6,
    name: "見分けの間",
    nameRuby: "見分[みわ]けの間[ま]",
    unitLabel: "助動詞・紛らわしい語の識別",
    subBoss: "大臣",
    subBossRuby: "大臣[だいじん]",
    subBossName: "サイラス",
    implemented: true,
  },
  {
    id: "ohzaNoMa",
    order: 7,
    name: "王座の間",
    nameRuby: "王座[おうざ]の間[ま]",
    unitLabel: "敬語",
    subBoss: "宰相",
    subBossRuby: "宰相[さいしょう]",
    subBossName: "ニジュヴェール",
    finalBoss: "王様",
    finalBossRuby: "王様[おうさま]",
    implemented: true,
  },
];

/** 出題データが組み込み済みで、エリア選択に表示するエリア */
export const playableAreas = areas.filter((a) => a.implemented);
