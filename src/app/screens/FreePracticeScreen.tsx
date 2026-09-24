import { useEffect, useState } from "react";
import { getUnitMeta } from "@/data/units";
import { buildFreePracticeSession } from "@/features/quiz/buildSession";
import { QuizPlayer, type SessionResult } from "@/features/quiz/QuizPlayer";
import { Ruby } from "@/components/Ruby";
import { duckBgm, playSe, seDurationMs } from "@/lib/audio";
import { useNavigationStore } from "@/app/store/navigationStore";

/**
 * 自由練習(6章): ことだまの書から、選んだ単元の問題プールだけを解くセッション。
 * ストーリー演出・HPゲージ・ステージ進行やマスコット成長への影響はなし。
 * 解答は正答率の統計と復習(星)には反映される。
 */
export function FreePracticeScreen({ unitId }: { unitId: string }) {
  const goTo = useNavigationStore((s) => s.goTo);
  const meta = getUnitMeta(unitId);

  const [questions, setQuestions] = useState(() => buildFreePracticeSession(unitId));
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    if (!result) return;
    playSe("clear");
    duckBgm(seDurationMs("clear"));
  }, [result]);

  function again() {
    setQuestions(buildFreePracticeSession(unitId));
    setResult(null);
    setAttempt((a) => a + 1);
  }

  if (!meta || questions.length === 0) {
    return (
      <div className="screen">
        <p>この単元の問題が見つかりません。</p>
        <button type="button" onClick={() => goTo({ name: "zukan" })}>
          ことだまの書へ
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="screen screen-stage-result">
        <h2>れんしゅう おわり!</h2>
        <p>
          <Ruby text={meta.label} />
        </p>
        <p>
          {result.correctCount} / {result.answered} もん せいかい
        </p>
        {result.maxCombo >= 2 && <p>さいだい 🔥 {result.maxCombo}れんぞく!</p>}
        <button type="button" onClick={again}>
          もういちど
        </button>
        <button type="button" onClick={() => goTo({ name: "zukan" })}>
          ことだまの書へ
        </button>
      </div>
    );
  }

  return (
    <QuizPlayer
      key={attempt}
      areaId={meta.areaId}
      questions={questions}
      heading={[{ text: "じゆうれんしゅう: " }, ...meta.label]}
      onComplete={setResult}
      onQuit={() => goTo({ name: "zukan" })}
    />
  );
}
