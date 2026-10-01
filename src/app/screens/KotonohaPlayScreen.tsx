import { useEffect, useState } from "react";
import { Check, Leaf, X, X as CloseIcon } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Rb } from "@/components/Rb";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { getAllIdiomQuestions } from "@/data/kotowaza";
import { KotonohaBackground } from "@/features/kotonoha/KotonohaBackground";
import { KotonohaScene } from "@/features/kotonoha/KotonohaScene";
import { IdiomText } from "@/features/kotonoha/IdiomText";
import { arrangeRound, selectRound, SCOPE_LABELS, type KotonohaScope } from "@/features/kotonoha/selectRound";
import { KOTONOHA_LOCKED_MESSAGE, useKotonohaUnlocked } from "@/features/kotonoha/unlock";
import { SceneBubbles } from "@/features/kotonoha/SceneBubbles";
import {
  COMPLETE_SCENE,
  resultSceneId,
  roundStartSceneId,
  type CompletionKind,
} from "@/data/yuraiScenes";
import { completionsToShow } from "@/app/store/kotonohaStore";
import { YuraiBubble } from "@/features/kotonoha/Yurai";
import type { MascotExpression } from "@/assets/registry";
import { duckBgm, playSe, seDurationMs } from "@/lib/audio";

type Phase = "intro" | "question" | "explain" | "result";

/** ラウンド開始の一言(intro)を、自動で終えるまでの時間。タップすれば、すぐ飛ばせる */
export const ROUND_START_AUTO_MS = 1500;

/**
 * 言の葉の森の出題(1ラウンド10問)。問題 → 答える → 解説(ユライの一言) → つぎへ … → 結果。
 * 不正解でも、やり直しはさせず、正解を示して解説へ進む。記録(集めた葉・まちがえた問題)は、答えた時点で保存する。
 * 本編の進捗・ランキングの累計正解数には、何も影響しない。
 */
export function KotonohaPlayScreen({ scope }: { scope: KotonohaScope }) {
  const goTo = useNavigationStore((s) => s.goTo);
  const unlocked = useKotonohaUnlocked();
  const recordResult = useKotonohaStore((s) => s.recordResult);

  const makeRound = () => {
    const { collectedIds, missedIds } = useKotonohaStore.getState();
    return arrangeRound(selectRound({ questions: getAllIdiomQuestions(), scope, collectedIds, missedIds }));
  };
  const [round, setRound] = useState(makeRound);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [pickedId, setPickedId] = useState<string | undefined>();
  const [results, setResults] = useState<boolean[]>([]);
  const [newLeaves, setNewLeaves] = useState(0);
  // 今回のラウンドで、はじめて埋まったカテゴリ(コンプリートの台詞)。結果画面のあと、1つずつ出す
  const [completions, setCompletions] = useState<CompletionKind[]>([]);

  // 範囲を選んだ直後の一言は、少しだけ見せて、自動で出題へ(タップなら、すぐ)
  useEffect(() => {
    if (phase !== "intro") return;
    const timer = setTimeout(() => setPhase("question"), ROUND_START_AUTO_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const question = round[index];
  const lastCorrect = results[results.length - 1];

  function answer(choiceId: string) {
    if (phase !== "question" || !question) return;
    const correct = choiceId === question.correctChoiceId;
    setPickedId(choiceId);
    setResults((r) => [...r, correct]);
    const shownBefore = useKotonohaStore.getState().shownCompletions;
    if (recordResult(question.id, correct)) {
      setNewLeaves((n) => n + 1);
      const shownAfter = useKotonohaStore.getState().shownCompletions;
      const shown = completionsToShow(shownAfter.filter((kind) => !shownBefore.includes(kind)));
      if (shown.length > 0) setCompletions((c) => [...c, ...shown]);
    }
    playSe(correct ? "correct" : "incorrect");
    setPhase("explain");
  }

  function next() {
    if (index + 1 >= round.length) {
      setPhase("result");
      // ラウンドの終わりの音。BGMは、自由練習・苦手練習と同じく、鳴っている間だけ下げる
      playSe("roundEnd");
      duckBgm(seDurationMs("roundEnd"));
    } else {
      setIndex(index + 1);
      setPickedId(undefined);
      setPhase("question");
    }
  }

  function again() {
    setRound(makeRound());
    setIndex(0);
    setPhase("question");
    setPickedId(undefined);
    setResults([]);
    setNewLeaves(0);
    setCompletions([]);
  }

  const score = results.filter(Boolean).length;
  const expression: MascotExpression | undefined =
    phase === "explain"
      ? lastCorrect
        ? "happy"
        : "sad"
      : phase === "result"
        ? score >= 7
          ? "happy"
          : score >= 4
            ? undefined
            : "sad"
        : undefined;

  if (!unlocked) {
    return (
      <div className="screen screen-kotonoha">
        <KotonohaBackground />
        <BackButton onClick={() => goTo({ name: "title" })} />
        <p className="kotonoha-panel" role="status">
          {KOTONOHA_LOCKED_MESSAGE}
        </p>
      </div>
    );
  }

  const pickedChoice = question?.choices.find((c) => c.id === pickedId);
  const correctChoice = question?.choices.find((c) => c.id === question.correctChoiceId);

  if (phase === "intro") {
    // ラウンド開始の一言。どこをタップしても、すぐ進む(「もどる」だけは、もどる)
    return (
      <div
        className="screen screen-kotonoha screen-kotonoha-play"
        data-phase="intro"
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest(".back-button")) setPhase("question");
        }}
      >
        <KotonohaBackground />
        <div className="kotonoha-topbar">
          <BackButton onClick={() => goTo({ name: "kotonoha" })} />
        </div>
        <KotonohaScene />
        <SceneBubbles sceneId={roundStartSceneId(scope)} />
        <div className="scene-actions">
          <button type="button" className="scene-next" onClick={() => setPhase("question")}>
            すすむ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen screen-kotonoha screen-kotonoha-play" data-phase={phase}>
      <KotonohaBackground />
      {/* 上のバー: 左に「もどる」、右に何問目か(右端の音量ボタンの分だけ、あけてある) */}
      <div className="kotonoha-topbar">
        <BackButton onClick={() => goTo({ name: "kotonoha" })} />
        {phase !== "result" && question && (
          <p className="kotonoha-progress">
            <Leaf aria-hidden="true" size={15} className="inline-icon" />
            <span>
              {index + 1} / {round.length}
            </span>
            <span className="kotonoha-scope-tag">
              <Rb t={SCOPE_LABELS[scope]} />
            </span>
          </p>
        )}
      </div>
      {/* 場面: 答えたあとは、ユライの一言を、ユライの立ち絵の隣の吹き出しにする */}
      <KotonohaScene
        expression={expression}
        compact
        bubble={
          phase === "explain" && question ? (
            <YuraiBubble>
              <IdiomText text={question.yuraiLine} />
            </YuraiBubble>
          ) : undefined
        }
      />

      {phase === "question" && question && (
        <section className="kotonoha-card" aria-label="もんだい">
          <p className="kotonoha-sentence">
            <IdiomText text={question.sentence} />
          </p>
          <ul className="engine-choice-list kotonoha-choices">
            {question.choices.map((choice) => (
              <li key={choice.id}>
                <button type="button" data-no-tap onClick={() => answer(choice.id)}>
                  <span className="kotonoha-choice-text">
                    <IdiomText text={choice.text} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {phase === "explain" && question && (
        <>
          {/* 答えたあと: 1枚のカードに、ひとこと・完全な形・選んだ答えと正解(1行ずつ)・意味・もとの話(折りたたみ) */}
          <section className="kotonoha-card kotonoha-explain" aria-label="かいせつ">
            <p className="kotonoha-verdict">{lastCorrect ? "せいかい!" : "ざんねん"}</p>
            <p className="kotonoha-sentence kotonoha-full">
              <IdiomText text={question.full} />
            </p>
            <ul className="kotonoha-answers">
              {!lastCorrect && pickedChoice && (
                <li className="incorrect">
                  <X aria-hidden="true" size={16} />
                  <span className="kotonoha-answer-label">えらんだ</span>
                  <IdiomText text={pickedChoice.text} />
                </li>
              )}
              {correctChoice && (
                <li className="correct">
                  <Check aria-hidden="true" size={16} />
                  <span className="kotonoha-answer-label">{lastCorrect ? "えらんだ(せいかい)" : "せいかい"}</span>
                  <IdiomText text={correctChoice.text} />
                </li>
              )}
            </ul>
            <p className="kotonoha-meaning">
              <IdiomText text={question.meaning} />
            </p>
            {/* 由来があるときだけ。タップで開く(旅人の「ユライ」と混ざらないよう、ラベルは「もとの話」) */}
            {question.origin && (
              <details className="kotonoha-origin-details">
                <summary>もとの話を見る</summary>
                <p className="kotonoha-origin">
                  <IdiomText text={question.origin} />
                </p>
              </details>
            )}
          </section>
        </>
      )}

      {phase === "result" && (
        <section className="kotonoha-card kotonoha-result" aria-label="けっか">
          <p className="kotonoha-score">
            {score} / {round.length}
          </p>
          {/* 得点帯別の一言(10/10・7〜9・4〜6・0〜3) */}
          <SceneBubbles sceneId={resultSceneId(score, round.length)} className="kotonoha-result-scene" />
          <p className="kotonoha-new-leaves">
            <Leaf aria-hidden="true" size={18} className="inline-icon" />
            {newLeaves > 0 ? `あたらしい 葉が ${newLeaves}まい あつまったよ` : "あたらしい 葉は なかったよ"}
          </p>
          {/* 新しい葉を集めたときは、その行に、leaf_new を添える(得点帯別の一言とは別枠) */}
          {newLeaves > 0 && <SceneBubbles sceneId="leaf_new" className="kotonoha-leaf-new-scene" />}
          <div className="kotonoha-result-buttons">
            <button type="button" onClick={again}>
              もういちど
            </button>
            <button type="button" onClick={() => goTo({ name: "kotonoha" })}>
              もどる
            </button>
          </div>
        </section>
      )}

      {/* コンプリート(はじめて埋まったとき、各1回)。結果画面の上に、1つずつ出す */}
      {phase === "result" && completions.length > 0 && (
        <div className="kotonoha-complete-overlay">
          <div className="kotonoha-complete" role="dialog" aria-modal="true" aria-label="ユライとコトの会話" data-scene={COMPLETE_SCENE[completions[0]]}>
            <SceneBubbles sceneId={COMPLETE_SCENE[completions[0]]} />
            <button type="button" className="scene-next" onClick={() => setCompletions((c) => c.slice(1))}>
              <CloseIcon aria-hidden="true" size={16} />
              <span>{completions.length > 1 ? "つぎへ" : "とじる"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 「つぎへ」は、画面の下に固定する(解説が長いときは、その上の部分だけがスクロールする) */}
      {phase === "explain" && question && (
        <div className="kotonoha-bottom">
          <button type="button" className="kotonoha-next" onClick={next}>
            {index + 1 >= round.length ? "けっかを みる" : "つぎへ"}
          </button>
        </div>
      )}
    </div>
  );
}
