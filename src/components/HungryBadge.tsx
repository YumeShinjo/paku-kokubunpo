import { useReviewStore } from "@/app/store/reviewStore";

/**
 * ホーム画面の軽いバッジ(6章)。星のついた問題(コトの好物)が残っているとき、コトがお腹を空かせている、と知らせる。
 * プッシュ通知のような重い仕組みはなく、画面に表示するだけ。復習の専用モードには行かなくても、
 * 通常ステージで遊べば星の問題が自然に混ざるので、そのことをひとこと添える。
 */
export function HungryBadge() {
  const count = useReviewStore((s) => s.starredQuestionIds.length);
  if (count === 0) return null;
  return (
    <p className="hungry-badge" role="status">
      🍙 コトが おなかを すかせているよ!(⭐{count}もん)
      <small>ステージで あそぶと、ごはんが まざるよ。</small>
    </p>
  );
}
