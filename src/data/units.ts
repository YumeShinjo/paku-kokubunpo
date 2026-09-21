import { autoRuby } from "./furigana";
import { rb } from "./ruby";
import type { RubyText } from "./schema";

/**
 * 出題データの `unit`(単元の細目)に付ける表示名とエリアの対応。
 * ことだまの書(図鑑)の単元別正答率グラフ・自由練習の入口(6章)で使う。
 * 並び順がそのまま図鑑での表示順(カリキュラム順)になる。
 * 新しい単元の問題データを追加したら、ここにも1行足す(足し忘れはテストで検出される)。
 * 文法用語には furigana.ts の辞書でふりがなを自動で付ける。
 */
export interface UnitMeta {
  id: string;
  areaId: string;
  label: RubyText;
}

function unit(id: string, areaId: string, label: string): UnitMeta {
  return { id, areaId, label: rb(autoRuby(label)) };
}

export const unitMetas: UnitMeta[] = [
  unit("bunsetsu-kubun", "prologue", "文節[ぶんせつ]の区切り"),
  unit("tango-kubun", "prologue", "単語[たんご]の区切り"),

  unit("hinshi-bunrui", "kotobaNoIchiba", "品詞[ひんし]分類"),
  unit("jiritsugo-fuzokugo", "kotobaNoIchiba", "自立語[じりつご]・付属語[ふぞくご]"),
  unit("katsuyou-umu", "kotobaNoIchiba", "活用の有無"),

  unit("doushi-katsuyou-shurui", "sugatakaeNoKajiba", "動詞の活用の種類"),
  unit("doushi-katsuyoukei", "sugatakaeNoKajiba", "動詞の活用形"),
  unit("keiyoushi-katsuyou", "sugatakaeNoKajiba", "形容詞の活用"),
  unit("keiyoudoushi-katsuyou", "sugatakaeNoKajiba", "形容動詞の活用"),

  unit("jidoushi-tadoushi", "namerakaNoTaki", "自動詞と他動詞"),
  unit("kanou-doushi", "namerakaNoTaki", "可能動詞"),
  unit("onbin", "namerakaNoTaki", "音便"),

  unit("kakujoshi", "tsunagiNoHashi", "格助詞"),
  unit("setsuzoku-joshi", "tsunagiNoHashi", "接続助詞"),
  unit("fukujoshi", "tsunagiNoHashi", "副助詞"),
  unit("shuujoshi", "tsunagiNoHashi", "終助詞"),
  unit("ga-no-shikibetsu", "tsunagiNoHashi", "「が」と「の」の識別"),

  unit("shujutsu-kankei", "kizunaNoMa", "主語・述語の関係"),
  unit("shushoku-hishushoku", "kizunaNoMa", "修飾・被修飾の関係"),
  unit("heiritsu-kankei", "kizunaNoMa", "並立の関係"),
  unit("hojo-kankei", "kizunaNoMa", "補助の関係"),
  unit("setsuzoku-kankei", "kizunaNoMa", "接続の関係"),
  unit("dokuritsu-kankei", "kizunaNoMa", "独立の関係"),

  unit("jodoushi-imi", "mikakeNoMa", "助動詞の意味・用法"),
  unit("magirawashii-go", "mikakeNoMa", "紛らわしい語の識別"),

  unit("sonkeigo", "ohzaNoMa", "尊敬語"),
  unit("kenjougo", "ohzaNoMa", "謙譲語"),
  unit("teineigo", "ohzaNoMa", "丁寧語"),
  unit("keigo-shikibetsu", "ohzaNoMa", "敬語の識別"),
];

const metaById = new Map(unitMetas.map((m) => [m.id, m]));

export function getUnitMeta(unitId: string): UnitMeta | undefined {
  return metaById.get(unitId);
}
