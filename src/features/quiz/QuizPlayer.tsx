import { useEffect, useRef, useState } from "react";
import type { Question, RubyText } from "@/data/schema";
import { EngineRouter } from "@/engines/EngineRouter";
import { judgeAnswer, type Answer } from "@/engines/core/judge";
import { Ruby } from "@/components/Ruby";
import { playSe } from "@/lib/audio";
import { useReviewStore } from "@/app/store/reviewStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { guideKeyOf } from "@/data/engineGuide";
import { EngineGuide } from "./EngineGuide";
import { BossPortrait } from "./BossPortrait";
import { MascotFace } from "@/features/mascot/Mascot";
import { recordReviewResult, type ReviewOutcome } from "./review";
import type { QuizProgress } from "./session";
import { StageVisual } from "@/components/ScreenBackground";
import { ZukanPages } from "@/features/zukan/ZukanPages";
import { BOSS_LIVES } from "./bossRules";
import { areaAccentStyle } from "@/data/areaTheme";
import { useStatsStore } from "@/app/store/statsStore";
import {
  comboLabel,
  CORRECT_EFFECTS,
  pickDifferent,
  pickMessage,
  type CorrectEffect,
} from "./feedback";
import { Rb } from "@/components/Rb";
import { buildStageIntro } from "./stageIntro";

export interface SessionResult {
  correctCount: number;
  /** 実際に解答した問題数(小ボスをHP0で早く終えた場合は出題数より少ない) */
  answered: number;
  maxCombo: number;
  /** ボス戦のときだけ意味を持つ。HPを0にできたか */
  bossDefeated: boolean;
  /** 小ボスのHPの残り(ボス戦のみ)。「もう少し」の表示に使う */
  hpLeft: number;
  /** ボス戦のライフが0になって終わった(ステージを最初からやり直す) */
  lifeOut?: boolean;
}

interface Props {
  /** エンジンの呼び名(5章の世界観演出)を引くためのエリアid */
  areaId: string;
  questions: Question[];
  /** 指定するとボス戦(HPゲージ付き)になる。3章: ゲージは演出のみで、プレイヤー側は被ダメージなし */
  boss?: { label: string; title: string; hpMax: number; type: "subBoss" | "lastBoss" };
  /** 画面上部に出す見出し(自由練習の単元名など) */
  heading?: RubyText;
  /** ステージ全体のテーマ名。出題形式が混ざるステージの、冒頭の説明に使う */
  stageTitle?: RubyText;
  onComplete: (result: SessionResult) => void;
  /** 途中から再開するときの、それまでの進行状況(出題 questions は、保存時と同じ並びを渡す) */
  resume?: QuizProgress;
  /** 1問解答するたびに、次に解く位置などの進行状況を通知する(再開用の保存に使う) */
  onProgress?: (progress: QuizProgress) => void;
  /** 途中でやめて戻る。指定すると「やめる」ボタンを出す(確認つき。クリアにはならない) */
  onQuit?: () => void;
  /** やめても、あとで続きから遊べる(確認の文面が変わる) */
  canResumeLater?: boolean;
}

interface Feedback {
  correct: boolean;
  message: string;
  effect: CorrectEffect | null;
  /** 星のついていた問題を克服したときだけ入る */
  review: ReviewOutcome | null;
}

/**
 * 1セッション分の出題進行。通常ステージ・小ボス・自由練習で共通に使う。
 * 「負け」という状態は作らない(3章): 不正解でも次の問題へ進むだけで、ボス戦もHPは
 * ボス側にしかない。プールを解ききってもHPが残った場合は、呼び出し側が「もう少し」を出す。
 */
export function QuizPlayer({
  areaId,
  questions,
  boss,
  heading,
  stageTitle,
  onComplete,
  resume,
  onProgress,
  onQuit,
  canResumeLater,
}: Props) {
  const recordAnswer = useStatsStore((s) => s.recordAnswer);
  const toggleStar = useReviewStore((s) => s.toggleStar);
  const starredIds = useReviewStore((s) => s.starredQuestionIds);

  const seenGuides = useTutorialStore((s) => s.seenGuides);
  const markGuideSeen = useTutorialStore((s) => s.markSeen);

  const [index, setIndex] = useState(resume?.index ?? 0);
  const [correctCount, setCorrectCount] = useState(resume?.correctCount ?? 0);
  const [combo, setCombo] = useState(resume?.combo ?? 0);
  const [maxCombo, setMaxCombo] = useState(resume?.maxCombo ?? 0);
  const [hp, setHp] = useState(resume?.hp ?? boss?.hpMax ?? 0);
  // ボス戦のプレイヤーのライフ(誤答で1減り、0でそのステージを最初からやり直す)
  const [lives, setLives] = useState(resume?.lives ?? BOSS_LIVES);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // 「せいかい!/おしい!」のポップアップが開いているか。閉じたあとは、解説と「つぎへ」が下に残る
  const [popupOpen, setPopupOpen] = useState(false);
  const [zukanOpen, setZukanOpen] = useState(false);
  // ステージの冒頭の説明(出題形式の呼び名と場面)は、ステージを始めたときに1度だけ、ポップアップで出す(途中からの再開では出さない)
  const [intro] = useState(() => buildStageIntro(areaId, questions, boss, stageTitle));
  const [introOpen, setIntroOpen] = useState(() => resume === undefined && intro !== null);
  const [confirmingQuit, setConfirmingQuit] = useState(false);
  // 直前と同じ文言・演出を連続で出さないための記憶(再描画は不要なので ref)
  const lastMessage = useRef<Record<string, string>>({});
  const lastEffect = useRef<CorrectEffect | undefined>(undefined);
  // すでに解答した問題の位置(二重の判定を防ぐ)
  const answeredIndex = useRef(-1);
  const feedbackShownAt = useRef(0);

  // 再開したとき、すでにボスのHPが0(とどめの一撃のあとで中断した)なら、そのままクリアにする
  const resumeCompleted = useRef(false);
  useEffect(() => {
    if (resume && boss && resume.hp <= 0 && !resumeCompleted.current) {
      resumeCompleted.current = true;
      onComplete({
        correctCount: resume.correctCount,
        answered: resume.index,
        maxCombo: resume.maxCombo,
        bossDefeated: true,
        hpLeft: 0,
      });
    }
    // 再開の判定は、最初に開いたときの1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = questions[index];
  // 解説が長い仕分け問題だけ、2段階(判定のポップアップ → 閉じると解説と「つぎへ」)。それ以外は、判定と解説を1つのポップアップにまとめ、1タップで次へ
  const twoStage = question.engine === "sorting";
  const comboText = comboLabel(combo);
  const starred = starredIds.includes(question.id);
  // 初回プレイ時だけ、その出題形式の操作ガイドを出す(解答後は出さない)
  const guideKey = guideKeyOf(question);
  const showGuide = feedback === null && !seenGuides.includes(guideKey);

  function handleAnswer(answer: Answer) {
    // 1問につき判定は1回だけ。同じ問題に2回目以降に届いた解答は無視する
    // (再描画を待たずに続けて届いても防げるよう、state ではなく ref で同期的に記録する)
    if (answeredIndex.current === index) return;
    answeredIndex.current = index;
    const correct = judgeAnswer(question, answer);
    playSe(correct ? "correct" : "incorrect");
    recordAnswer(question, correct);

    const kind = boss ? (correct ? "bossHit" : "bossMiss") : correct ? "correct" : "incorrect";
    const message = pickMessage(kind, lastMessage.current[kind]);
    lastMessage.current[kind] = message;

    // 星(復習)の更新と、克服したときの音。解答の直後に必ず反映する
    const review = recordReviewResult(question.id, correct);
    // 星のついていた問題を克服したときは、正解音のあとに、きらっとした克服ボーナス音を鳴らす
    if (review.overcame) setTimeout(() => playSe("bonus"), 250);

    let effect: CorrectEffect | null = null;
    if (correct) {
      effect = pickDifferent(CORRECT_EFFECTS, lastEffect.current);
      lastEffect.current = effect;
      setCorrectCount((c) => c + 1);
      setCombo(combo + 1);
      setMaxCombo((m) => Math.max(m, combo + 1));
      if (boss) setHp((h) => Math.max(0, h - 1));
    } else {
      setCombo(0);
      if (boss) setLives((l) => Math.max(0, l - 1));
    }
    setPopupOpen(true);
    feedbackShownAt.current = Date.now();
    setFeedback({ correct, message, effect, review: review.overcame ? review : null });

    // 再開用に、解答のたびに進行状況を通知する(次に解く位置。最後の問題のときは位置を進めない)
    onProgress?.({
      index: index + 1 < questions.length ? index + 1 : index,
      correctCount: correctCount + (correct ? 1 : 0),
      combo: correct ? combo + 1 : 0,
      maxCombo: correct ? Math.max(maxCombo, combo + 1) : maxCombo,
      hp: boss && correct ? Math.max(0, hp - 1) : hp,
      lives: boss && !correct ? Math.max(0, lives - 1) : lives,
    });
  }

  function handleNext() {
    const defeated = boss !== undefined && hp <= 0;
    const lifeOut = boss !== undefined && !defeated && lives <= 0;
    const isLast = index + 1 >= questions.length;
    if (defeated || lifeOut || isLast) {
      onComplete({
        correctCount,
        answered: index + 1,
        maxCombo,
        bossDefeated: defeated,
        hpLeft: hp,
        lifeOut,
      });
      return;
    }
    setFeedback(null);
    setPopupOpen(false);
    setIndex(index + 1);
  }

  return (
    <div
      className={`screen screen-stage${question.engine === "sorting" ? " is-compact" : ""}${feedback && twoStage ? (question.explanation ? " has-explain" : " has-next") : ""}`}
      style={areaAccentStyle(areaId)}
    >
      {/* 背景。ボス戦は、上半分に背景+ボスを大きく。通常ステージは、小さな装飾バーだけにして、問題のスペースを優先する */}
      <StageVisual name={areaId} tall={boss !== undefined}>
        {boss && <BossPortrait type={boss.type} areaId={areaId} />}
      </StageVisual>
      {heading && (
        <p className="quiz-heading">
          <Ruby text={heading} />
        </p>
      )}

      {boss && (
        <div
          className={[
            "boss-panel",
            feedback ? (feedback.correct ? "boss-hit" : "boss-miss") : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <p className="boss-name">
            <Rb t={`${boss.label}: ${boss.title}`} />
          </p>
          <div
            className="hp-gauge"
            role="progressbar"
            aria-label="ボスのHP"
            aria-valuemin={0}
            aria-valuemax={boss.hpMax}
            aria-valuenow={hp}
          >
            <div className="hp-fill" style={{ width: `${(hp / boss.hpMax) * 100}%` }} />
          </div>
          <p className="hp-text">
            HP {hp} / {boss.hpMax}
          </p>
          <p className="player-lives" role="img" aria-label={`ライフ ${lives} / ${BOSS_LIVES}`}>
            <span aria-hidden="true">
              {"❤".repeat(lives)}
              <span className="life-lost">{"♡".repeat(BOSS_LIVES - lives)}</span>
            </span>
          </p>
        </div>
      )}

      {/* 1行目: 進み具合とコンボ。コンボの場所は、出ていないときも確保してあり、出ても下のボタンは動かない */}
      <div className="stage-header">
        <p className="stage-progress">
          {index + 1} / {questions.length}
        </p>
        <p className="combo" aria-live="polite">
          {comboText && (
            <span key={combo} className="combo-badge">
              🔥 {comboText}
            </span>
          )}
        </p>
      </div>
      {/* 2行目: 3つのボタンを、同じ行にそろえる */}
      <div className="stage-actions">
        <button
          type="button"
          className={`star-button ${starred ? "starred" : ""}`.trim()}
          aria-pressed={starred}
          onClick={() => toggleStar(question.id)}
        >
          {starred ? "⭐ にがてもんだい" : "☆ にがてもんだいに いれる"}
        </button>
        <button type="button" className="zukan-button" onClick={() => setZukanOpen(true)}>
          📖 ずかん
        </button>
        {onQuit && (
          <button type="button" className="quit-button" onClick={() => setConfirmingQuit(true)}>
            やめる
          </button>
        )}
      </div>

      {confirmingQuit && onQuit && (
        <div className="quit-confirm" role="alertdialog" aria-label="やめる確認">
          <p>
            <Rb
              t={
                canResumeLater
                  ? "ここまでの進[すす]み具合[ぐあい]は残[のこ]るよ。あとで続[つづ]きから遊[あそ]べるよ。やめる?"
                  : "ここでやめると、このステージはクリアにならないよ。やめる?"
              }
            />
          </p>
          <div className="quit-confirm-buttons">
            <button type="button" className="quit-yes" onClick={onQuit}>
              やめる
            </button>
            <button type="button" onClick={() => setConfirmingQuit(false)}>
              つづける
            </button>
          </div>
        </div>
      )}

      {showGuide && <EngineGuide guideKey={guideKey} onDismiss={() => markGuideSeen(guideKey)} />}

      <EngineRouter key={question.id} question={question} onAnswer={handleAnswer} />

      {/* 判定のポップアップ。自動では消えない。
          仕分け以外: 判定と解説を1つにまとめ、タップ1回(または「つぎへ」)で次の問題へ。
          仕分け: 判定だけを出し、タップするとポップアップだけが閉じる(次の問題へは進まない)。 */}
      {feedback && popupOpen && (
        <div
          className="feedback-overlay"
          onClick={() => {
            // 出た直後の誤タップで閉じない(進まない)よう、少しだけ待つ
            if (Date.now() - feedbackShownAt.current <= 400) return;
            if (twoStage) setPopupOpen(false);
            else handleNext();
          }}
        >
          <div
            role="dialog"
            aria-label={feedback.correct ? "せいかい" : "ざんねん"}
            className={[
              "feedback",
              feedback.correct ? "feedback-correct" : "feedback-incorrect",
              feedback.effect ? `effect-${feedback.effect}` : "",
              !twoStage && question.explanation ? "" : "feedback-compact",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {feedback.effect === "sparkle" && (
              <span className="sparkles" aria-hidden="true">
                <span>✨</span>
                <span>✨</span>
                <span>✨</span>
              </span>
            )}
            {/* コトの表情: 正解=喜び(苦手を克服したときはもぐもぐ)、不正解=しょんぼり */}
            <MascotFace
              expression={feedback.correct ? (feedback.review?.overcame ? "eating" : "happy") : "sad"}
              size="small"
            />
            <p className="feedback-message">
              <Rb t={feedback.message} />
            </p>
            {feedback.review && <p className="feedback-overcome">⭐ にがてを こくふくした!</p>}
            {boss && !feedback.correct && (
              <p className="feedback-lives">
                {lives > 0 ? `ライフが 1 へったよ(のこり ${lives})` : "ライフが なくなっちゃった…"}
              </p>
            )}
            {!twoStage && question.explanation && (
              <p className="feedback-explanation">
                <Ruby text={question.explanation} />
              </p>
            )}
            {twoStage ? (
              <p className="feedback-close-hint">▼ タップして とじる</p>
            ) : (
              <button type="button" className="feedback-next" onClick={handleNext}>
                つぎへ
              </button>
            )}
          </div>
        </div>
      )}

      {/* 仕分けだけ: 解説と「つぎへ」は、ポップアップとは別の操作にして、解説を読み飛ばして進んでしまわないようにする */}
      {feedback && twoStage && (
        <div className="explain-bar" role="region" aria-label="かいせつ">
          {question.explanation && (
            <p className="feedback-explanation">
              <Ruby text={question.explanation} />
            </p>
          )}
          <button type="button" className="feedback-next" onClick={handleNext}>
            つぎへ
          </button>
        </div>
      )}

      {/* ステージの冒頭の説明(1度だけ)。閉じたら、ふつうの問題画面 */}
      {introOpen && intro && (
        <div className="feedback-overlay stage-intro-overlay">
          <div role="dialog" aria-label="ステージのせつめい" className="feedback stage-intro">
            <p className="engine-flavor-label">
              <Ruby text={intro.title} />
            </p>
            <p className="engine-flavor-situation">
              <Ruby text={intro.message} />
            </p>
            <button type="button" className="feedback-next" onClick={() => setIntroOpen(false)}>
              {boss ? "たたかう!" : "はじめる"}
            </button>
          </div>
        </div>
      )}

      {zukanOpen && (
        <div className="zukan-modal" role="dialog" aria-label="ことばのずかん">
          <div className="zukan-modal-inner">
            <button type="button" className="zukan-modal-close" onClick={() => setZukanOpen(false)}>
              ✕ とじる
            </button>
            <ZukanPages />
          </div>
        </div>
      )}
    </div>
  );
}
