import { PartyPopper } from "lucide-react";
import { useMasteryStore } from "@/app/store/masteryStore";
import { getAllQuestions } from "@/data/questionLoader";

/**
 * 全問題のうち、正解したことのある問題のユニーク数を、進捗バーと「123 / 224問」の形で表示する(6章の進捗表示)。
 * ホーム画面(タイトル)など、いつでも見える場所に置く。全問正解でコンプリート表示になる。
 * 進捗が0のときも、バーの枠(空のバー)は出る。
 */
export function MasteryProgress({ className = "" }: { className?: string }) {
  const correctCount = useMasteryStore((s) => s.correctQuestionIds.length);
  const total = getAllQuestions().length;
  const complete = total > 0 && correctCount >= total;
  const percent = total > 0 ? Math.min(100, (correctCount / total) * 100) : 0;
  return (
    <div className={`mastery-progress ${className}`.trim()}>
      <span
        className="mastery-bar"
        role="progressbar"
        aria-label="正解した問題の進み具合"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={correctCount}
      >
        <span
          className="mastery-bar-fill"
          style={{ width: `${percent}%`, minWidth: correctCount > 0 ? "0.5rem" : undefined }}
        />
      </span>
      <p className="mastery-text">
        正解した問題 {correctCount} / {total}問
        {complete && (
          <span className="mastery-complete">
            {" "}
            <PartyPopper aria-hidden="true" size={15} className="mastery-complete-icon" />
            コンプリート!
          </span>
        )}
      </p>
    </div>
  );
}
