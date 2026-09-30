import { Leaf, Lock } from "lucide-react";
import { Rb } from "@/components/Rb";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { getAllIdiomQuestions } from "@/data/kotowaza";
import { KOTONOHA_LOCKED_MESSAGE, useKotonohaUnlocked } from "@/features/kotonoha/unlock";

/**
 * ホーム画面の、言の葉の森への入口(横幅いっぱいのカード型のボタン)。
 * 名前・「ことわざ・故事成語」・右に集めた葉の数(N / 80)。序章をクリアするまでは、鍵のアイコンと落ち着いた色で、
 * 遊べる条件を出す(押しても、入れない)。
 */
export function ForestEntry() {
  const goTo = useNavigationStore((s) => s.goTo);
  const unlocked = useKotonohaUnlocked();
  const collectedCount = useKotonohaStore((s) => s.collectedIds.length);
  const total = getAllIdiomQuestions().length;

  return (
    <button
      type="button"
      className={`title-forest ${unlocked ? "" : "is-locked"}`.trim()}
      aria-disabled={!unlocked}
      onClick={() => {
        if (unlocked) goTo({ name: "kotonoha" });
      }}
    >
      <span className="forest-badge">{unlocked ? <Leaf aria-hidden="true" size={20} /> : <Lock aria-hidden="true" size={18} />}</span>
      <span className="forest-text">
        <span className="forest-name">
          <Rb t="言[こと]の葉[は]の森[もり]" />
        </span>
        <span className="forest-sub">{unlocked ? "ことわざ・故事成語" : KOTONOHA_LOCKED_MESSAGE}</span>
      </span>
      {unlocked && (
        <span className="forest-count" aria-label={`集めた葉 ${collectedCount} / ${total}`}>
          {collectedCount} / {total}
        </span>
      )}
    </button>
  );
}
