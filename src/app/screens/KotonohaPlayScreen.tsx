import { useState } from "react";
import { Check, Leaf, X } from "lucide-react";
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
import { YuraiBubble } from "@/features/kotonoha/Yurai";
import type { MascotExpression } from "@/assets/registry";
import { playSe } from "@/lib/audio";

type Phase = "question" | "explain" | "result";

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
  const [phase, setPhase] = useState<Phase>("question");
  const [pickedId, setPickedId] = useState<string | undefined>();
  const [results, setResults] = useState<boolean[]>([]);
  const [newLeaves, setNewLeaves] = useState(0);

  const question = round[index];
  const lastCorrect = results[results.length - 1];

  function answer(choiceId: string) {
    if (phase !== "question" || !question) return;
    const correct = choiceId === question.correctChoiceId;
    setPickedId(choiceId);
    setResults((r) => [...r, correct]);
    if (recordResult(question.id, correct)) setNewLeaves((n) => n + 1);
    playSe(correct ? "correct" : "incorrect");
    setPhase("explain");
  }

  function next() {
    if (index + 1 >= round.length) {
      setPhase("result");
      playSe("clear");
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

  return (
    <div className="screen screen-kotonoha screen-kotonoha-play">
      <KotonohaBackground />
      <BackButton onClick={() => goTo({ name: "kotonoha" })} />
      <KotonohaScene expression={expression} compact />

      {phase !== "result" && question && (
        <section className="kotonoha-card" aria-label="もんだい">
          <p className="kotonoha-progress">
            <Leaf aria-hidden="true" size={15} className="inline-icon" />
            <span>
              {index + 1} / {round.length}
            </span>
            <span className="kotonoha-scope-tag">
              <Rb t={SCOPE_LABELS[scope]} />
            </span>
          </p>
          <p className="kotonoha-sentence">
            <IdiomText text={phase === "question" ? question.sentence : question.full} />
          </p>
          <ul className="engine-choice-list kotonoha-choices">
            {question.choices.map((choice) => {
              const isCorrect = choice.id === question.correctChoiceId;
              const mark = phase === "explain" ? (isCorrect ? "correct" : choice.id === pickedId ? "incorrect" : "") : "";
              return (
                <li key={choice.id}>
                  <button type="button" data-no-tap className={mark} disabled={phase !== "question"} onClick={() => answer(choice.id)}>
                    <span className="kotonoha-choice-text">
                      <IdiomText text={choice.text} />
                    </span>
                    {mark === "correct" && <Check aria-label="せいかい" size={18} />}
                    {mark === "incorrect" && <X aria-label="ふせいかい" size={18} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {phase === "explain" && question && (
        <>
          <section className="kotonoha-card kotonoha-explain" aria-label="かいせつ">
            <p className="kotonoha-verdict">{lastCorrect ? "せいかい!" : "ざんねん…こたえは こちら"}</p>
            <p className="kotonoha-reading">{question.reading}</p>
            <p className="kotonoha-meaning">
              <IdiomText text={question.meaning} />
            </p>
            {question.origin && (
              <p className="kotonoha-origin">
                <span className="kotonoha-origin-label">ゆらい</span>
                <IdiomText text={question.origin} />
              </p>
            )}
          </section>
          <YuraiBubble>
            <IdiomText text={question.yuraiLine} />
          </YuraiBubble>
          <button type="button" className="kotonoha-next" onClick={next}>
            {index + 1 >= round.length ? "けっかを みる" : "つぎへ"}
          </button>
        </>
      )}

      {phase === "result" && (
        <section className="kotonoha-card kotonoha-result" aria-label="けっか">
          <p className="kotonoha-score">
            {score} / {round.length}
          </p>
          <p className="kotonoha-new-leaves">
            <Leaf aria-hidden="true" size={18} className="inline-icon" />
            {newLeaves > 0 ? `あたらしい 葉が ${newLeaves}まい あつまったよ` : "あたらしい 葉は なかったよ"}
          </p>
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
    </div>
  );
}
