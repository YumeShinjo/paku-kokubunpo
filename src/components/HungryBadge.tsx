import { Utensils } from "lucide-react";
import { useReviewStore } from "@/app/store/reviewStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { Rb } from "@/components/Rb";

/**
 * ホーム画面の軽い帯(6章)。星のついた問題(コトの好物)が残っているとき、苦手問題の数を知らせる。
 * プッシュ通知のような重い仕組みはなく、画面に表示するだけ。タップすると、星の問題だけを集めた練習(苦手問題の練習)に入れる。
 * (通常ステージで遊んでも、星の問題は自然に混ざる)
 */
export function HungryBadge() {
  const count = useReviewStore((s) => s.starredQuestionIds.length);
  const goTo = useNavigationStore((s) => s.goTo);
  if (count === 0) return null;
  return (
    <button type="button" className="hungry-badge" onClick={() => goTo({ name: "reviewPractice" })}>
      {/* 1行にまとめる(食器のアイコン + 「苦手問題 N問 ・ タップして練習」)。ボタンなので、高さは48px以上 */}
      <span className="hungry-badge-title">
        <Utensils aria-hidden="true" size={18} />
        <Rb t={`苦手[にがて]問題[もんだい] ${count}問[もん]`} />
        <span className="hungry-badge-dot" aria-hidden="true">
          ・
        </span>
        <span className="hungry-badge-hint">
          <Rb t="タップして練習[れんしゅう]" />
        </span>
      </span>
    </button>
  );
}
