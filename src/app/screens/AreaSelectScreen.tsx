import { Check, Footprints, Lock } from "lucide-react";
import { playableAreas } from "@/data/areas";
import { HungryBadge } from "@/components/HungryBadge";
import { findImage, IMAGE } from "@/assets/registry";
import { areaAccentStyle } from "@/data/areaTheme";
import { getQuestionsForArea } from "@/data/questionLoader";
import { buildAreaEntryScreen } from "@/features/story/storyFlow";
import { useMasteryStore } from "@/app/store/masteryStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";
import { Rb } from "@/components/Rb";
import { areaNameText, unitLabelText } from "@/data/areaText";
import { BackButton } from "@/components/BackButton";
import type { CSSProperties } from "react";

/**
 * エリア選択画面。出題データが組み込み済みのエリアを、カードで表示する。
 * カード: 左に番号のバッジ、名前と単元、右上に状態のチップ、下に細い進捗バー(そのエリアの正解数/問題数)。
 * 状態は、クリア済み / 挑戦中 / ロック中(鍵のアイコンと落ち着いた色)で見分ける。背景は、そのエリアの(荒れていない)背景を薄く敷く。
 */
export function AreaSelectScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const isAreaCleared = useProgressStore((s) => s.isAreaCleared);
  const isAreaUnlocked = useProgressStore((s) => s.isAreaUnlocked);
  const hasSeen = useStoryStore((s) => s.hasSeen);
  const correctIds = useMasteryStore((s) => s.correctQuestionIds);

  function enterArea(areaId: string) {
    goTo(buildAreaEntryScreen(areaId, hasSeen));
  }

  const correctSet = new Set(correctIds);

  return (
    <div className="screen screen-area-select">
      <BackButton onClick={() => goTo({ name: "title" })} />
      <h2>
        エリアをえらぼう
      </h2>
      {/* コトがお腹をすかせているバッジは、出ているときだけ場所をとる(このスクリーンの間に、出たり消えたりはしない) */}
      <div className="hungry-badge-slot">
        <HungryBadge />
      </div>
      <ul className="area-list">
        {playableAreas.map((area, index) => {
          // エリアは固定の順番でしか進めない。1つ前のエリアの関門(小ボス撃破。序章はクリア)を越えるまで、入れない
          const unlocked = isAreaUnlocked(area.id);
          const cleared = isAreaCleared(area.id);
          const state = cleared ? "cleared" : unlocked ? "current" : "locked";
          const previous = index > 0 ? playableAreas[index - 1] : undefined;
          const questions = getQuestionsForArea(area.id);
          const correct = questions.filter((q) => correctSet.has(q.id)).length;
          const percent = questions.length > 0 ? (correct / questions.length) * 100 : 0;
          const bgUrl = findImage(IMAGE.areaCardBackground(area.id)) ?? findImage(IMAGE.background(area.id));
          const cardStyle = bgUrl ? ({ ["--area-bg" as string]: `url(${bgUrl})` } as CSSProperties) : undefined;
          return (
          <li key={area.id} style={areaAccentStyle(area.id)} className={`area-card area-${state}`}>
            <button type="button" disabled={!unlocked} style={cardStyle} onClick={() => enterArea(area.id)}>
              <span className="area-num" aria-hidden="true">
                {area.order === 0 ? "序" : area.order}
              </span>
              <strong className="area-name">
                <Rb t={areaNameText(area)} />
              </strong>
              <span className="area-unit">
                <Rb t={unitLabelText(area)} />
              </span>
              {/* 状態のチップ(右上)。ロック中は、開く条件を、名前の下に1行で添える */}
              {state === "cleared" && (
                <span className="area-chip stage-cleared-mark">
                  <Check aria-hidden="true" size={14} />
                  クリア済み
                </span>
              )}
              {state === "current" && (
                <span className="area-chip area-chip-current">
                  <Footprints aria-hidden="true" size={14} />
                  <Rb t="挑戦[ちょうせん]中" />
                </span>
              )}
              {state === "locked" && (
                <span className="area-chip area-chip-locked">
                  <Lock aria-hidden="true" size={13} />
                  ロック中
                </span>
              )}
              {!unlocked && previous && (
                <span className="area-locked">
                  <Rb t={`${areaNameText(previous)}${previous.subBoss ? "の小ボスを浄化[じょうか]" : "をクリア"}すると開[ひら]くよ`} />
                </span>
              )}
              <span className="area-progress">
                <span
                  className="area-bar"
                  role="progressbar"
                  aria-label={`${area.name}の正解数`}
                  aria-valuemin={0}
                  aria-valuemax={questions.length}
                  aria-valuenow={correct}
                >
                  <span
                    className="area-bar-fill"
                    style={{ width: `${percent}%`, minWidth: correct > 0 ? "0.3rem" : undefined }}
                  />
                </span>
                <span className="area-count">
                  {correct} / {questions.length}問
                </span>
              </span>
            </button>
          </li>
          );
        })}
      </ul>
      <button type="button" onClick={() => goTo({ name: "zukan" })}>
        ことだまの書
      </button>
    </div>
  );
}
