import { rb } from "./ruby";
import type { EngineType, RubyText } from "./schema";

/**
 * 出題エンジン×エリアの世界観演出(5章「エンジン×エリアの世界観演出」)。
 * 通常ステージの出題を、バトルではなく「お手伝い」として見せるための表示テキスト。
 * エンジンのコード構造は変えず、画面に出す呼び名と一言説明だけをここで差し替える。
 */
export interface EngineFlavor {
  /** 画面上の呼び名 */
  label: RubyText;
  /** 世界観上の位置づけ(一言) */
  situation: RubyText;
}

function flavor(label: string, situation: string): EngineFlavor {
  return { label: rb(label), situation: rb(situation) };
}

const kokoroe = flavor("ことだま使いの心得[こころえ]", "見習いとして最初の心得を試される");
const tanaoroshi = flavor(
  "棚卸[たなおろ]しを手伝う",
  "品物(言葉)を正しい棚に並べ直し、商売を助ける",
);
const katauchi = flavor("型を打つ", "金属を打って正しい形に鍛[きた]え直す");
const suiro = flavor(
  "水路[すいろ]を切り分ける",
  "川の流れを2つの水路に正しく振り分け、詰まりを解消する",
);
const nameraka = flavor("流れをなめらかにする", "引っかかった水の流れをなめらかに整える");
const hashiita = flavor("橋板[はしいた]をかける", "抜け落ちた橋板を正しい場所にはめ込む");
const bannin = flavor("番人[ばんにん]の問い", "橋の番人に正しいつなぎ言葉を答えて通してもらう");
const kizuna = flavor(
  "絆[きずな]の糸をたどる",
  "見えなくなった関係の糸を指でなぞって結び直す",
);
const mayakashi = flavor(
  "まやかしを見破[みやぶ]る",
  "大臣の言葉のすり替えを、レンズ越しに見破る",
);
const sahou = flavor("作法[さほう]の間", "宮廷作法の試験官として、正しい言葉遣いを判定する");

/** 「エリアid:エンジン」単位で決まる呼び名。エリア内で単元によりエンジンが変わる滝・橋はここで分かれる。 */
const byAreaAndEngine: Record<string, EngineFlavor> = {
  "prologue:choice": kokoroe,
  "kotobaNoIchiba:sorting": tanaoroshi,
  "sugatakaeNoKajiba:assembly": katauchi,
  "namerakaNoTaki:sorting": suiro,
  "namerakaNoTaki:assembly": nameraka,
  "tsunagiNoHashi:assembly": hashiita,
  "tsunagiNoHashi:choice": bannin,
  "mikakeNoMa:choice": mayakashi,
  "ohzaNoMa:choice": sahou,
};

/**
 * 上の表にない組み合わせ(例: ことばの市場の自立語/付属語は選択式で出題している)は、
 * そのエリアの基本の呼び名で見せる。絆の間の「文中タップ」は独立したエンジンではなく
 * 選択式の表示モードなので、エリアの基本の呼び名(絆の糸をたどる)で表示される。
 */
const areaDefault: Record<string, EngineFlavor> = {
  prologue: kokoroe,
  kotobaNoIchiba: tanaoroshi,
  sugatakaeNoKajiba: katauchi,
  namerakaNoTaki: suiro,
  tsunagiNoHashi: hashiita,
  kizunaNoMa: kizuna,
  mikakeNoMa: mayakashi,
  ohzaNoMa: sahou,
};

export function getEngineFlavor(
  areaId: string,
  engine: EngineType,
): EngineFlavor | undefined {
  return byAreaAndEngine[`${areaId}:${engine}`] ?? areaDefault[areaId];
}
