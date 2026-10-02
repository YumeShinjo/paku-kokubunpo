import type { MascotExpression } from "@/assets/registry";
import { nakamaRuby } from "@/data/zukanCharacters";

/**
 * ホーム画面の、コトの吹き出しの一言(データ)。
 *  - 状況の一言: ホームを開いたとき、上から順に判定して、最初に当てはまるものを1つ出す(statusLine)
 *  - タップの一言: コトをタップするたびに、別の一言に替わる。直前と同じものは、連続で出さない(nextTapLine)
 * 一言ごとに、そのとき見せるコトの表情を持つ(expression。省略 = 通常)。
 *
 * 使う表情は、ポーズが変わらないもの(通常・コンボ・ハングリー・眠そう)だけ。手の位置・足・しっぽが同じなので、
 * 成長アクセサリー(前足の腕輪・胸元のブローチ・耳のリボン・モノクルなど)が、体や顔から、ずれない。
 * 使わない表情: びっくり・喜び・もぐもぐ(手のポーズが違う)、しょんぼり(耳が垂れる)。
 * 眠そうは、手が少し低く、体が少し丸いので、アクセサリーの位置が合うかを、成長の全段階で確かめた(確認の結果は、SLEEPY_OK)。
 *
 * コトの台詞は、漢字かな交じり。ふりがなは付けず、画面に出すとき homeLineText() が、難読語に付ける(<Rb> が方針に残る語だけ出す)。
 * 1つ40字以内。絵文字は使わない(「♪」は、文字)。
 */

/** ホームで使ってよいコトの表情(通常は undefined) */
export type HomeExpression = Extract<MascotExpression, "combo" | "hungry" | "sleepy"> | undefined;

/**
 * 眠そうの表情を使ってよいか。成長アクセサリー7段階(ゼロ〜全部)で、眠そうの絵に重ねたとき、
 * 腕輪・ブローチ・リボン・モノクルが、体や顔から浮かないかを、スクリーンショットで確かめた結果。
 * false にすると、眠そうの代わりに、ハングリー(状況の一言)・通常(「ちょっと休憩する?」)になる。
 */
export const SLEEPY_OK = true;

/** 眠そうの代わり(使わないとき) */
const sleepy = (instead: HomeExpression): HomeExpression => (SLEEPY_OK ? "sleepy" : instead);

export interface HomeLine {
  /** 一言のid(連続で同じものを出さないための目印) */
  id: string;
  /** 吹き出しの文字。{n} は、あと何枚か */
  text: string;
  /** そのとき見せるコトの表情。省略(undefined)は、通常 */
  expression: HomeExpression;
}

/** 苦手な問題(星)が、これ以上たまっているときの表情(眠そう。使わないときは、ハングリー) */
export const MANY_STARS = 5;
/** 言の葉の森の葉の全部の数 */
export const LEAF_TOTAL = 80;

export const STATUS_LINES = {
  stars: { id: "status-stars", text: "苦手な問題が残ってるよ。いっしょにやっつけよう!", expression: "hungry" },
  starsMany: { id: "status-stars-many", text: "苦手な問題が残ってるよ。いっしょにやっつけよう!", expression: sleepy("hungry") },
  first: { id: "status-first", text: "まずは「はじめる」から。いっしょにことばを集めよう!", expression: undefined },
  forestNew: { id: "status-forest-new", text: "言の葉の森にも行ってみない?ユライが待ってるよ", expression: undefined },
  leaves: { id: "status-leaves", text: "言の葉の森の葉っぱ、あと{n}枚でぜんぶそろうよ!", expression: "combo" },
  leavesAll: { id: "status-leaves-all", text: "言の葉の森の葉っぱ、ぜんぶそろったね!", expression: "combo" },
  usual: { id: "status-usual", text: "今日は、どのことばを集める?", expression: undefined },
} as const satisfies Record<string, HomeLine>;

export const TAP_LINES: readonly HomeLine[] = [
  { id: "tap-call", text: "ん?呼んだ?", expression: undefined },
  { id: "tap-tickle", text: "えへへ、くすぐったいよ!", expression: "combo" },
  { id: "tap-eat", text: "今日も、ことばをいっぱい食べようね", expression: "hungry" },
  { id: "tap-hum", text: "ふんふん♪ ことばって、おいしいよね", expression: undefined },
  { id: "tap-leaf", text: "わたしのこの葉っぱ、コトノ葉っていうんだよ", expression: undefined },
  { id: "tap-together", text: "いっしょにがんばろうね!", expression: "combo" },
  { id: "tap-rest", text: "ちょっと休憩する?", expression: sleepy(undefined) },
  { id: "tap-puzzle", text: "文法って、パズルみたいで楽しいよね", expression: undefined },
];

/** ホームを開いたときの、状況の判定に使う、いまの状態 */
export interface HomeStatus {
  /** 苦手な問題(星)の数 */
  starCount: number;
  /** 序章をクリアしたか */
  prologueCleared: boolean;
  /** 言の葉の森が解放されているか(序章のクリア) */
  forestUnlocked: boolean;
  /** 言の葉の森で集めた葉の数 */
  leafCount: number;
}

/**
 * 状況の一言。上から順に判定して、最初に当てはまるものを使う。
 *  1. 苦手な問題が残っている(5問以上は、眠そうの表情)  2. 序章が未クリア  3. 言の葉の森が解放済みで葉が0枚
 *  4. 葉が1枚以上80枚未満  5. 葉が80枚  6. それ以外
 */
export function statusLine(s: HomeStatus): HomeLine {
  if (s.starCount > 0) return s.starCount >= MANY_STARS ? STATUS_LINES.starsMany : STATUS_LINES.stars;
  if (!s.prologueCleared) return STATUS_LINES.first;
  if (s.forestUnlocked && s.leafCount === 0) return STATUS_LINES.forestNew;
  if (s.forestUnlocked && s.leafCount > 0 && s.leafCount < LEAF_TOTAL) return STATUS_LINES.leaves;
  if (s.forestUnlocked && s.leafCount >= LEAF_TOTAL) return STATUS_LINES.leavesAll;
  return STATUS_LINES.usual;
}

/** コトをタップしたときの、次の一言。直前(previousId)と同じものは、連続で出さない。random は 0以上1未満 */
export function nextTapLine(previousId: string | undefined, random: () => number = Math.random): HomeLine {
  const candidates = TAP_LINES.filter((line) => line.id !== previousId);
  return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
}

/** 吹き出しに出す、ふりがなの記法つきの文({n} を、あと何枚かに置き換える) */
export function homeLineText(line: HomeLine, leafCount: number): string {
  const remaining = Math.max(0, LEAF_TOTAL - leafCount);
  return nakamaRuby(line.text.replace("{n}", String(remaining)));
}

/** 画面に出るとおりの、ふりがなのない文字(文字数の確認・テスト用) */
export function homeLinePlain(line: HomeLine, leafCount: number): string {
  return line.text.replace("{n}", String(Math.max(0, LEAF_TOTAL - leafCount)));
}
