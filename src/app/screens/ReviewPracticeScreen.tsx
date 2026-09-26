import { useEffect, useState } from "react";
import { getUnitMeta } from "@/data/units";
import { buildReviewSession } from "@/features/quiz/buildSession";
import { QuizPlayer, type SessionResult } from "@/features/quiz/QuizPlayer";
import { duckBgm, playSe, seDurationMs } from "@/lib/audio";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { Rb } from "@/components/Rb";

/**
 * 苦手問題の練習(6章): 星のついた問題(間違えた問題・自分で星をつけた問題)だけを集めた出題。
 * ホームの「コトがお腹をすかせているよ!」のボタンから入る。ストーリー・HPゲージ・ライフ・ステージ進行への影響はなし。
 * 解答は、通常どおり正答率の統計と星(正解し直すと克服して星が外れる)に反映される。
 */
export function ReviewPracticeScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const starCount = useReviewStore((s) => s.starredQuestionIds.length);
  const [questions, setQuestions] = useState(() => buildReviewSession());
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    if (!result) return;
    playSe("clear");
    duckBgm(seDurationMs("clear"));
  }, [result]);

  function again() {
    setQuestions(buildReviewSession());
    setResult(null);
    setAttempt((a) => a + 1);
  }

  if (questions.length === 0 && !result) {
    return (
      <div className="screen screen-stage-result">
        <h2>にがて もんだいは ないよ!</h2>
        <p>
          <Rb t="苦手[にがて]な問題[もんだい]は、ぜんぶ克服[こくふく]したよ。すごい!" />
        </p>
        <button type="button" onClick={() => goTo({ name: "title" })}>
          ホームへ
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="screen screen-stage-result">
        <h2>れんしゅう おわり!</h2>
        <p>
          {result.correctCount} / {result.answered} もん せいかい
        </p>
        {result.maxCombo >= 2 && <p>さいだい 🔥 {result.maxCombo}れんぞく!</p>}
        <p>
          <Rb t={`のこりの苦手[にがて]問題[もんだい]: ${starCount}問[もん]`} />
        </p>
        {starCount > 0 && (
          <button type="button" onClick={again}>
            もういちど
          </button>
        )}
        <button type="button" onClick={() => goTo({ name: "title" })}>
          ホームへ
        </button>
      </div>
    );
  }

  const areaId = getUnitMeta(questions[0].unit)?.areaId ?? "prologue";
  return (
    <QuizPlayer
      key={attempt}
      areaId={areaId}
      questions={questions}
      heading={[{ text: "にがて もんだい れんしゅう" }]}
      onComplete={setResult}
      onQuit={() => goTo({ name: "title" })}
    />
  );
}
