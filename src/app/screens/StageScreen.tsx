import { useEffect, useMemo, useState } from "react";
import { getStage } from "@/data/stages";
import { areas } from "@/data/areas";
import { buildStageSession } from "@/features/quiz/buildSession";
import { bossHpMax, bossLabel } from "@/features/quiz/bossRules";
import { QuizPlayer, type SessionResult } from "@/features/quiz/QuizPlayer";
import { buildPostClearScreen } from "@/features/story/storyFlow";
import { syncScore } from "@/features/ranking/scoreSync";
import { playSe } from "@/lib/audio";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useMascotStore } from "@/app/store/mascotStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { restoreSession } from "@/features/quiz/session";

const SCORE_PER_QUESTION = 10;

/**
 * ステージ画面。1ステージ分の出題(QuizPlayer)と、クリア/「もう少し」の結果表示を担う(3章)。
 * 通常ステージは必ずクリアになる(負けはない)。小ボス・ラスボスはHPを0にできればクリア、
 * 出題を解ききってもHPが残った場合は「もう少し」でその場で再挑戦できる(ペナルティなし)。
 */
export function StageScreen({ areaId, stageId }: { areaId: string; stageId: string }) {
  const goTo = useNavigationStore((s) => s.goTo);
  const markStageCleared = useProgressStore((s) => s.markStageCleared);
  const isAreaCleared = useProgressStore((s) => s.isAreaCleared);
  const isStageUnlocked = useProgressStore((s) => s.isStageUnlocked);
  const growTo = useMascotStore((s) => s.growTo);
  const hasSeen = useStoryStore((s) => s.hasSeen);

  const stage = useMemo(() => getStage(stageId), [stageId]);
  const isBoss = stage !== undefined && stage.type !== "normal";
  const label = stage ? bossLabel(stage.type) : null;

  // 途中まで遊んでいたステージなら、その続きから始める(3章: 途中離脱してもすぐ再開できる)
  const [restored] = useState(() => restoreSession(useSessionStore.getState().active, stageId));
  const [questions, setQuestions] = useState(() => restored?.questions ?? buildStageSession(stageId, areaId));
  const saveSession = useSessionStore((s) => s.save);
  const clearSession = useSessionStore((s) => s.clear);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [justClearedArea, setJustClearedArea] = useState(false);

  const cleared = result !== null && (!isBoss || result.bossDefeated);

  function handleComplete(r: SessionResult) {
    // 「もう少し」のときも、次は新しい出題になるので、保存した途中経過は消す
    clearSession();
    if (isBoss && !r.bossDefeated) {
      setResult(r);
      return;
    }
    markStageCleared(stageId, r.correctCount * SCORE_PER_QUESTION);
    // ランキングに参加中なら、得点を送る(オフラインなら後で自動で送られる)
    void syncScore();
    // このステージのクリアでエリア全体(小ボス含む)が揃ったかを判定する(6章: エリアクリアごとに成長)。
    if (isAreaCleared(areaId)) {
      const areaOrder = areas.find((a) => a.id === areaId)?.order ?? 0;
      growTo(areaOrder + 1);
      setJustClearedArea(true);
    }
    setResult(r);
  }

  function retry() {
    clearSession();
    setQuestions(buildStageSession(stageId, areaId));
    setResult(null);
    setAttempt((a) => a + 1);
  }

  // クリア画面に切り替わった瞬間に1度だけ達成音を鳴らす(7章: 視覚演出とセットの効果音)。
  useEffect(() => {
    if (!cleared) return;
    playSe(stage?.type === "normal" ? "clear" : stage?.type === "lastBoss" ? "lastBossClear" : "subBossClear");
  }, [cleared, stage?.type]);

  // エリアクリアのときは、クリア音のあとに、マスコットの成長音 → 図鑑のページが開く音、の順に重ならないよう鳴らす
  useEffect(() => {
    if (!justClearedArea) return;
    const start = stage?.type === "lastBoss" ? 1000 : 600; // ラスボスのクリア音は長いので、少し待つ
    const growth = setTimeout(() => playSe("growth"), start);
    const page = setTimeout(() => playSe("pageUnlock"), start + 700);
    return () => {
      clearTimeout(growth);
      clearTimeout(page);
    };
  }, [justClearedArea, stage?.type]);

  // ステージ選択画面でも押せないが、解放条件(先にクリアすべきステージ)を満たさない挑戦は入口で止める。
  if (!stage || !isStageUnlocked(stageId) || questions.length === 0) {
    return (
      <div className="screen">
        <p>このステージはまだ挑戦できません。</p>
        <button type="button" onClick={() => goTo({ name: "stageSelect", areaId })}>
          ステージせんたくへ
        </button>
      </div>
    );
  }

  if (result && isBoss && !result.bossDefeated) {
    return (
      <div className="screen screen-stage-result">
        <h2>もう少し!</h2>
        <p>あと少しで浄化できたよ。何度でも挑戦できるよ!</p>
        <p>
          {result.correctCount} / {result.answered} もん せいかい(ボスのHP のこり {result.hpLeft})
        </p>
        <button type="button" onClick={retry}>
          もういちどちょうせん
        </button>
        <button type="button" onClick={() => goTo({ name: "stageSelect", areaId })}>
          ステージせんたくへ
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="screen screen-stage-result">
        <h2>
          {label === null ? (
            "クリア!"
          ) : (
            <>
              {label}を<ruby>浄化<rt>じょうか</rt></ruby>した!
            </>
          )}
        </h2>
        <p>
          {result.correctCount} / {result.answered} もん せいかい
        </p>
        {result.maxCombo >= 2 && <p>さいだい 🔥 {result.maxCombo}れんぞく!</p>}
        {justClearedArea && <p>エリアクリア!マスコットが成長した!</p>}
        {justClearedArea && <p>📖 ことだまの書に、あたらしい ページが ふえたよ!</p>}
        <button
          type="button"
          onClick={() =>
            goTo(
              buildPostClearScreen({
                areaId,
                stageType: stage.type,
                justClearedArea,
                hasSeen,
              }),
            )
          }
        >
          つぎへ
        </button>
      </div>
    );
  }

  return (
    <QuizPlayer
      key={attempt}
      areaId={areaId}
      questions={questions}
      boss={
        isBoss && label
          ? {
              label,
              title: stage.title,
              hpMax: bossHpMax(questions.length),
              type: stage.type === "lastBoss" ? "lastBoss" : "subBoss",
            }
          : undefined
      }
      onComplete={handleComplete}
      resume={attempt === 0 ? restored?.progress : undefined}
      onProgress={(progress) =>
        saveSession({ stageId, areaId, questionIds: questions.map((q) => q.id), ...progress })
      }
      canResumeLater
      onQuit={() => goTo({ name: "stageSelect", areaId })}
    />
  );
}
