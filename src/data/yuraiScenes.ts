import { nakamaRuby } from "@/data/zukanCharacters";

/**
 * 言の葉の森の、ユライとコトの「場面台詞」(正本は、リポジトリ直下の yurai-scene-lines.md)。文言は、そのとおり。
 *  - ユライ: ひらがな中心、語の切れ目に半角スペース。「言の葉の 森」「葉」「話」は漢字
 *  - コト: 漢字かな交じり。ふりがなは付けず、画面に出すとき sceneRuby() が、文法用語と難読語に付ける
 * 掛け合いは、配列の順に、1行ずつ話者を分けて出す。
 */
export type SceneSpeaker = "yurai" | "koto";

export interface SceneLine {
  speaker: SceneSpeaker;
  text: string;
}

export const SPEAKER_NAME: Record<SceneSpeaker, string> = { yurai: "ユライ", koto: "コト" };

const y = (text: string): SceneLine => ({ speaker: "yurai", text });
const k = (text: string): SceneLine => ({ speaker: "koto", text });

export const SCENE_IDS = [
  "entry_first",
  "entry_repeat_a",
  "entry_repeat_b",
  "entry_repeat_c",
  "round_start_all",
  "round_start_kotowaza",
  "round_start_koji",
  "result_perfect",
  "result_high",
  "result_mid",
  "result_low",
  "leaf_new",
  "complete_all",
  "complete_kotowaza",
  "complete_koji",
] as const;
export type SceneId = (typeof SCENE_IDS)[number];

export const YURAI_SCENES: Readonly<Record<SceneId, readonly SceneLine[]>> = {
  // 1. 入口。初回は、タップで1行ずつ進める(4行)。2回目以降は、3つからランダム(2つの吹き出しを同時に)
  entry_first: [
    y("ここは、言の葉の 森。……ようこそ。"),
    k("あ、旅の人だ!ここ、どんなところなの?"),
    y("ことばが、葉に なって、ねむってる。"),
    k("じゃあ、わたしたちで、起こしてあげよう!"),
  ],
  entry_repeat_a: [y("……もう、なれた みちだね。"), k("うん!今日は、どれで遊ぶ?")],
  entry_repeat_b: [y("……また、きたんだね。"), k("もちろん!まだまだ、集めるよ。")],
  entry_repeat_c: [y("……森は、いつも ここに ある。"), k("うんうん、だから安心するよね。")],
  // 2. ラウンド開始(範囲を選んだとき)
  round_start_all: [y("ふるい 葉を、えらんで みよう。"), k("さあ、始めよう!")],
  round_start_kotowaza: [y("くらしの なかで、うまれた ことばから。"), k("行くよー!")],
  round_start_koji: [y("とおい くにの、むかし話から。"), k("がんばろう!")],
  // 3. 結果画面(得点帯別)
  result_perfect: [y("……ぜんぶ、おぼえて いたんだね。"), k("すごいすごい!パーフェクト!")],
  result_high: [y("……よく、あつめたね。"), k("あとちょっとで、パーフェクトだったね!")],
  result_mid: [y("まだ、葉は のこってる。"), k("次は、もっといけるよ!")],
  result_low: [y("あわてずに、また おいで。"), k("どんまい!何回でも挑戦しよ!")],
  // 4. 新しい葉を集めたとき(結果画面の「あたらしい 葉が〜」の行に添える)
  leaf_new: [y("……また、ひとつ。"), k("新しい葉、見つけたよ!")],
  // 5. コンプリート(各1回だけ。同時達成のときは complete_all のみ)
  complete_all: [
    y("……ぜんぶ、おぼえたんだね。"),
    k("わあ、すごい!葉が、ぜんぶ集まったよ!"),
    y("ここからは……また、あたらしい 話を さがすだけ。"),
  ],
  complete_kotowaza: [y("……くらしの ことばは、もう ぜんぶ。"), k("ことわざ、コンプリート!やったね!")],
  complete_koji: [y("……とおい くにの 話も、もう ぜんぶ。"), k("故事成語も、コンプリート!すごいよ!")],
};

/** 画面に出す文に、ふりがなの記法を付ける(「言の葉の 森」・文法用語・読みの難しい語)。<Rb> が方針に残る語だけを出す */
export function sceneRuby(text: string): string {
  return nakamaRuby(text.replaceAll("言の葉の 森", "言[こと]の葉[は]の 森[もり]"));
}

export const ENTRY_REPEAT_IDS = ["entry_repeat_a", "entry_repeat_b", "entry_repeat_c"] as const;

/** 2回目以降の入口の台詞を、3つからランダムに選ぶ。直前に出したもの(last)は、連続で避ける。random は 0以上1未満 */
export function pickEntryRepeat(last: string | undefined, random: () => number = Math.random): SceneId {
  const candidates = ENTRY_REPEAT_IDS.filter((id) => id !== last);
  return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
}

/** 範囲を選んだとき(ラウンド開始)の場面 */
export function roundStartSceneId(scope: "all" | "kotowaza" | "koji"): SceneId {
  return scope === "kotowaza" ? "round_start_kotowaza" : scope === "koji" ? "round_start_koji" : "round_start_all";
}

/** 結果画面の、得点帯別の場面。10/10 → perfect、7〜9 → high、4〜6 → mid、0〜3 → low(10問未満のときは、割合で見る) */
export function resultSceneId(score: number, total: number): SceneId {
  const ratio = total > 0 ? score / total : 0;
  if (total > 0 && score >= total) return "result_perfect";
  if (ratio >= 0.7) return "result_high";
  if (ratio >= 0.4) return "result_mid";
  return "result_low";
}

/** コンプリートの種類 → 場面 */
export type CompletionKind = "all" | "kotowaza" | "koji";
export const COMPLETE_SCENE: Record<CompletionKind, SceneId> = {
  all: "complete_all",
  kotowaza: "complete_kotowaza",
  koji: "complete_koji",
};
