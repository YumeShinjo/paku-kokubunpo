import { useReviewStore } from "@/app/store/reviewStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { Rb } from "@/components/Rb";

/**
 * ホーム画面の軽いバッジ(6章)。星のついた問題(コトの好物)が残っているとき、コトがお腹を空かせている、と知らせる。
 * プッシュ通知のような重い仕組みはなく、画面に表示するだけ。タップすると、星の問題だけを集めた練習(苦手問題の練習)に入れる。
 * (通常ステージで遊んでも、星の問題は自然に混ざる)
 */
export function HungryBadge() {
  const count = useReviewStore((s) => s.starredQuestionIds.length);
  const goTo = useNavigationStore((s) => s.goTo);
  if (count === 0) return null;
  return (
    <button type="button" className="hungry-badge" onClick={() => goTo({ name: "reviewPractice" })}>
      <Rb t={`🍙 コトがお腹[なか]をすかせているよ!(苦手[にがて]問題[もんだい] ${count}問[もん])`} />
      <small>
        <Rb t="タップして、苦手[にがて]問題[もんだい]を練習[れんしゅう]しよう!" />
      </small>
    </button>
  );
}
