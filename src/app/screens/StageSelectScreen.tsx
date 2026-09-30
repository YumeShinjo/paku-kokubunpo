import { Check, Crown, Lock, Play, User } from "lucide-react";
import { areas } from "@/data/areas";
import { findImage, IMAGE } from "@/assets/registry";
import { ScreenBackground } from "@/components/ScreenBackground";
import { areaBackgroundName, areaPurifyGateStageId, isLastBossRevealed } from "@/data/bosses";
import { areaAccentStyle } from "@/data/areaTheme";
import { getStage, getStagesForArea, stageQuestionCount } from "@/data/stages";
import type { Stage } from "@/data/schema";
import { bossLabel } from "@/features/quiz/bossRules";
import { buildStageEntryScreen } from "@/features/story/storyFlow";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { restoreSession } from "@/features/quiz/session";
import { Rb } from "@/components/Rb";
import { areaNameText, stageTitleText } from "@/data/areaText";
import { BackButton } from "@/components/BackButton";

/**
 * ステージ選択画面。エリア内のステージ(通常+ボス)を、縦の道にならぶノードで表示する(3章)。
 *  - クリア済み=チェック / 次に遊べる=強調 / ロック中=鍵 / 小ボス(ラスボス)=立ち絵の丸(なければ王冠)
 *  - ラスボスは、宰相を倒したあとの会話(真相究明)を見終わるまで、名前も立ち絵も出さない(「？？？」と、紫の靄のシルエット。ネタバレ対策)
 *  - 解放条件は、これまでと同じ(data/stages.ts の requires と、エリアの開放)。見た目だけを変えている
 */
export function StageSelectScreen({ areaId }: { areaId: string }) {
  const goTo = useNavigationStore((s) => s.goTo);
  const isStageCleared = useProgressStore((s) => s.isStageCleared);
  const isStageUnlocked = useProgressStore((s) => s.isStageUnlocked);
  const isAreaUnlocked = useProgressStore((s) => s.isAreaUnlocked);
  const hasSeen = useStoryStore((s) => s.hasSeen);
  const savedSession = useSessionStore((s) => s.active);
  const clearSession = useSessionStore((s) => s.clear);

  const area = areas.find((a) => a.id === areaId);
  const stages = getStagesForArea(areaId);
  const lastBossRevealed = isLastBossRevealed(areaId, hasSeen, isStageCleared);

  /** 解放条件のステージ名(例: 「小ボス: 宰相・ニジュヴェール」)。ロック中のヒント表示に使う */
  const requirementLabel = (stageId: string) => {
    const required = getStage(stageId);
    if (!required) return "";
    const label = bossLabel(required.type);
    return label ? `${label} ${stageTitleText(required)}` : stageTitleText(required);
  };

  // 次に遊べるステージ(解放されていて、まだクリアしていない、いちばん前のステージ)。道の上で強調する
  const nextStageId = stages.find((st) => isStageUnlocked(st.id) && !isStageCleared(st.id))?.id;
  let normalNumber = 0;

  // まだ開放されていないエリアには入れない(エリアは固定の順番でしか進めない)
  if (!isAreaUnlocked(areaId)) {
    return (
      <div className="screen screen-stage-select" style={areaAccentStyle(areaId)}>
        <BackButton onClick={() => goTo({ name: "areaSelect" })} />
        <p>このエリアは、まだ入れないよ。ひとつ前のエリアを先にクリアしてね。</p>
      </div>
    );
  }

  return (
    <div className="screen screen-stage-select" style={areaAccentStyle(areaId)}>
      <BackButton onClick={() => goTo({ name: "areaSelect" })} />
      <ScreenBackground name={areaBackgroundName(areaId, isStageCleared(areaPurifyGateStageId(areaId)))} />
      <h2>{area && <Rb t={areaNameText(area)} />}</h2>
      <ol className="stage-list stage-path">
        {stages.map((stage) => {
          const unlocked = isStageUnlocked(stage.id);
          const cleared = isStageCleared(stage.id);
          const isBoss = stage.type !== "normal";
          const isNext = stage.id === nextStageId;
          // ラスボスは、正体が分かる会話を見るまで、伏せる(「？？？」)
          const concealed = stage.type === "lastBoss" && !lastBossRevealed;
          const state = concealed ? "hidden" : cleared ? "cleared" : !unlocked ? "locked" : isNext ? "next" : "open";
          if (!isBoss) normalNumber += 1;
          const label = bossLabel(stage.type);
          // 途中まで遊んだステージは、続きから遊べる(はじめからに戻すこともできる)
          const resumable = restoreSession(savedSession, stage.id);
          return (
            <li key={stage.id} className={`stage-step step-${state}${isBoss ? " step-boss" : ""}`}>
              <button
                type="button"
                disabled={!unlocked}
                className={stage.type !== "normal" ? "stage-subboss" : ""}
                onClick={() =>
                  goTo(buildStageEntryScreen({ areaId, stage, hasSeen }))
                }
              >
                <strong>
                  {concealed ? "？？？" : <Rb t={label ? `${label}: ${stageTitleText(stage)}` : stageTitleText(stage)} />}
                </strong>
                {!concealed && (
                  <span className="stage-meta">
                    <span className="stage-count">{stageQuestionCount(stage)}問</span>
                    {cleared && (
                      <span className="stage-cleared-mark">
                        <Check aria-hidden="true" size={14} />
                        クリア済み
                      </span>
                    )}
                    {isNext && <span className="stage-next-chip">つぎは ここ</span>}
                  </span>
                )}
                {resumable && (
                  <span className="stage-resume">
                    <Play aria-hidden="true" size={12} fill="currentColor" />
                    つづきから あそべるよ({resumable.progress.index + 1}もんめ〜)
                  </span>
                )}
                {!unlocked && (
                  <span className="stage-locked">
                    {!concealed && <Lock aria-hidden="true" size={13} />}
                    {stage.type === "subBoss" ? (
                      // 小ボスは、そのエリアの通常ステージをすべてクリアしてから
                      <Rb t="通常ステージをすべてクリアすると挑戦[ちょうせん]できるよ" />
                    ) : (
                      <Rb t={`${(stage.requires ?? []).map(requirementLabel).join("・")}を浄化[じょうか]すると挑戦[ちょうせん]できるよ`} />
                    )}
                  </span>
                )}
              </button>
              <StageNode stage={stage} state={state} number={normalNumber} areaId={areaId} />
              {resumable && unlocked && (
                <button type="button" className="stage-restart" onClick={clearSession}>
                  はじめから やりなおす
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** 道の上のノード(丸)。飾りなので、読み上げない(ステージの情報は、となりのボタンの文字にある) */
function StageNode({
  stage,
  state,
  number,
  areaId,
}: {
  stage: Stage;
  state: "cleared" | "locked" | "next" | "open" | "hidden";
  number: number;
  areaId: string;
}) {
  const isBoss = stage.type !== "normal";
  // 伏せているラスボス: 立ち絵は出さず、紫の靄(CSS)のなかの人影と「？」だけ
  if (state === "hidden") {
    return (
      <span className="stage-node" aria-hidden="true">
        <span className="stage-node-face stage-node-mist">
          <User size={22} fill="currentColor" strokeWidth={1.5} />
        </span>
        <span className="stage-node-badge">？</span>
      </span>
    );
  }
  const portrait = isBoss ? findImage(bossPortraitName(stage, areaId, state === "cleared")) : undefined;
  return (
    <span className="stage-node" aria-hidden="true">
      {isBoss ? (
        <>
          <span className="stage-node-face">
            {portrait ? <img src={portrait} alt="" draggable={false} /> : <Crown size={20} />}
          </span>
          <span className="stage-node-badge">
            {state === "cleared" ? <Check size={11} strokeWidth={3.5} /> : state === "locked" ? <Lock size={10} /> : <Crown size={11} />}
          </span>
        </>
      ) : state === "cleared" ? (
        <Check size={20} strokeWidth={3.5} />
      ) : state === "locked" ? (
        <Lock size={17} />
      ) : (
        <span className="stage-node-number">{number}</span>
      )}
    </span>
  );
}

/** ボスの立ち絵の名前。小ボスはエリアごとの絵、ラスボス(王様)は取り憑かれた姿(浄化後は元の姿) */
function bossPortraitName(stage: Stage, areaId: string, cleared: boolean): string {
  if (stage.type === "lastBoss") return cleared ? IMAGE.lastBossPurified : IMAGE.lastBossPossessed;
  return cleared ? IMAGE.subBossPurified(areaId) : IMAGE.subBoss(areaId);
}
