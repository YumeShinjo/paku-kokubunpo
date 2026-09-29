import type { MascotExpression } from "@/assets/registry";

/** 星(苦手問題)がこの数以上たまると、タイトルのコトが眠そうにする。これ未満は「hungry」(挑戦意欲)の表情 */
export const SLEEPY_STAR_THRESHOLD = 5;

/**
 * タイトル画面のコトの表情。
 * 星の問題が1問でもあれば「hungry」(HungryBadge と同じ条件。これから苦手問題に挑む意欲を示す)、
 * それが積もりすぎて5問以上になると「sleepy」(食べきれずぐったり、というエスカレーション)、
 * 1問もなければ指定なし(通常のベース画像)。
 */
export function titleExpression(starCount: number): MascotExpression | undefined {
  if (starCount >= SLEEPY_STAR_THRESHOLD) return "sleepy";
  if (starCount > 0) return "hungry";
  return undefined;
}

/**
 * 最初の画面(タッチしてはじめる)のコト。星(苦手問題)が1つもないときだけ、手を振る専用の絵("wave")。
 * 星が残っているときは、これまでどおり、タイトル画面と同じ表情(hungry / sleepy)を使い、手を振るポーズは使わない。
 */
export function splashPose(starCount: number): "wave" | MascotExpression {
  return titleExpression(starCount) ?? "wave";
}
