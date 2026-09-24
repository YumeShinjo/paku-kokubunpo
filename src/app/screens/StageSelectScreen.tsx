import { areas } from "@/data/areas";
import { ScreenBackground } from "@/components/ScreenBackground";
import { areaAccentStyle } from "@/data/areaTheme";
import { getStage, getStagesForArea, stageQuestionCount } from "@/data/stages";
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

/** ステージ選択画面。エリア内のステージ(通常+ボス)を順に一覧表示する(3章)。 */
export function StageSelectScreen({ areaId }: { areaId: string }) {
  const goTo = useNavigationStore((s) => s.goTo);
  const isStageCleared = useProgressStore((s) => s.isStageCleared);
  const isStageUnlocked = useProgressStore((s) => s.isStageUnlocked);
  const hasSeen = useStoryStore((s) => s.hasSeen);
  const savedSession = useSessionStore((s) => s.active);
  const clearSession = useSessionStore((s) => s.clear);

  const area = areas.find((a) => a.id === areaId);
  const stages = getStagesForArea(areaId);

  /** 解放条件のステージ名(例: 「小ボス: 宰相・ニジュヴェール」)。ロック中のヒント表示に使う */
  const requirementLabel = (stageId: string) => {
    const required = getStage(stageId);
    if (!required) return "";
    const label = bossLabel(required.type);
    return label ? `${label} ${stageTitleText(required)}` : stageTitleText(required);
  };

  return (
    <div className="screen screen-stage-select" style={areaAccentStyle(areaId)}>
      <BackButton onClick={() => goTo({ name: "areaSelect" })} />
      <ScreenBackground name={areaId} />
      <h2>{area && <Rb t={areaNameText(area)} />}</h2>
      <ul className="stage-list">
        {stages.map((stage) => {
          const unlocked = isStageUnlocked(stage.id);
          const label = bossLabel(stage.type);
          // 途中まで遊んだステージは、続きから遊べる(はじめからに戻すこともできる)
          const resumable = restoreSession(savedSession, stage.id);
          return (
            <li key={stage.id}>
              <button
                type="button"
                disabled={!unlocked}
                className={stage.type !== "normal" ? "stage-subboss" : ""}
                onClick={() =>
                  goTo(buildStageEntryScreen({ areaId, stage, hasSeen }))
                }
              >
                <strong>
                  <Rb t={label ? `${label}: ${stageTitleText(stage)}` : stageTitleText(stage)} />
                </strong>
                <span>
                  {stageQuestionCount(stage)}問
                </span>
                {isStageCleared(stage.id) && (
                  <span>
                    {" "}
                    ✓クリア済み
                  </span>
                )}
                {resumable && (
                  <span className="stage-resume">
                    ▶ つづきから あそべるよ({resumable.progress.index + 1}もんめ〜)
                  </span>
                )}
                {!unlocked && (
                  <span className="stage-locked">
                    <Rb t={`🔒 ${(stage.requires ?? []).map(requirementLabel).join("・")}を浄化[じょうか]すると挑戦[ちょうせん]できるよ`} />
                  </span>
                )}
              </button>
              {resumable && unlocked && (
                <button type="button" className="stage-restart" onClick={clearSession}>
                  はじめから やりなおす
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
