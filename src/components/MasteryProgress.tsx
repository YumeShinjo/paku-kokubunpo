import { useMasteryStore } from "@/app/store/masteryStore";
import { getAllQuestions } from "@/data/questionLoader";

/**
 * 全問題のうち、正解したことのある問題のユニーク数を「123 / 224問」の形で表示する(6章の進捗表示)。
 * ホーム画面(タイトル)など、いつでも見える場所に置く。全問正解でコンプリート表示になる。
 */
export function MasteryProgress({ className = "" }: { className?: string }) {
  const correctCount = useMasteryStore((s) => s.correctQuestionIds.length);
  const total = getAllQuestions().length;
  const complete = total > 0 && correctCount >= total;
  return (
    <p className={`mastery-progress ${className}`.trim()}>
      ことばの正解 {correctCount} / {total}問
      {complete && <span className="mastery-complete"> 🎉 コンプリート!</span>}
    </p>
  );
}
