import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { getStoryEvent } from "@/data/story/events";
import type { StoryChoiceOption } from "@/data/story/schema";
import { Ruby } from "@/components/Ruby";
import { Mascot } from "@/features/mascot/Mascot";
import { layoutPortraits } from "@/features/story/portraitLayout";
import { findImage, IMAGE } from "@/assets/registry";
import { areaBackgroundName, areaPurifyGateStageId, isSubBossPurifiedIn, subBossAreaOf } from "@/data/bosses";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";
import type { Screen } from "@/app/store/navigationStore";

/**
 * ストーリー演出画面(3章: ステージ間のストーリーテキストは短く、必ずスキップ可能)。
 * 台詞は、画面のどこをタップしても次へ進む(ADV形式)。スキップだけがボタンとして残る。
 * 背景・キャラクターは素材(src/assets/images/)があればその絵を、なければ仮表示(単色パネル+マスコットの絵文字)。
 * 立ち絵は、コト(マスコット)・王様・小ボスの台詞のとき、話者に合わせて出す。
 *
 * 選択肢を持つイベント(王座の間のエンディング分岐)は、最後の行のあとに選択肢を出す。
 * スキップは選択肢の手前までしか進めない(選択そのものは飛ばせない)。
 * 選ぶと選択を記録し、選んだ分岐のイベントを経て、渡された next へ進む。
 */
/** 立ち絵の表示倍率(global.css の --portrait-scale)。1のときは指定しない */
const scaleStyle = (scale: number | undefined): CSSProperties | undefined =>
  scale === undefined || scale === 1 ? undefined : ({ "--portrait-scale": scale } as CSSProperties);

export function StoryScreen({ eventId, next }: { eventId: string; next: Screen }) {
  const goTo = useNavigationStore((s) => s.goTo);
  const isStageCleared = useProgressStore((s) => s.isStageCleared);
  const markSeen = useStoryStore((s) => s.markSeen);
  const recordChoice = useStoryStore((s) => s.recordChoice);
  const event = useMemo(() => getStoryEvent(eventId), [eventId]);
  const [lineIndex, setLineIndex] = useState(0);

  function finish() {
    markSeen(eventId);
    goTo(next);
  }

  function choose(option: StoryChoiceOption) {
    markSeen(eventId);
    recordChoice(eventId, option.key);
    goTo({ name: "story", eventId: option.eventId, next });
  }

  // イベントデータが見つからない/空の場合は演出をスキップして先へ進める(フェイルセーフ)
  useEffect(() => {
    if (!event || event.lines.length === 0) {
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  if (!event || event.lines.length === 0) return null;

  const line = event.lines[lineIndex];
  // 背景は、イベントidの先頭(エリアid)の背景素材。なければ従来の単色グラデーション。
  // エリアの関門(小ボス。王座の間だけラスボス)を撃破していれば通常、していなければ荒れた姿(data/bosses.ts参照)。
  const backgroundAreaId = eventId.split("-")[0];
  const backgroundCleared = isStageCleared(areaPurifyGateStageId(backgroundAreaId));
  const backgroundUrl = findImage(
    IMAGE.background(areaBackgroundName(backgroundAreaId, backgroundCleared, eventId)),
  );
  // 王様の台詞のときは王様の立ち絵(素材があれば)。取り憑かれた姿/浄化後で出し分ける。
  const kingUrl = findImage(
    line.speaker === "ヴェルバルト"
      ? IMAGE.lastBossPurified
      : line.speaker?.startsWith("王(")
        ? IMAGE.lastBossPossessed
        : "",
  );
  // 小ボスの台詞のときは、そのボスの立ち絵(素材があれば)。撃破後は浄化後の姿に切り替える(data/bosses.ts参照)。
  const bossAreaId = subBossAreaOf(line.speaker);
  const bossPurified =
    bossAreaId !== undefined && isSubBossPurifiedIn(eventId, bossAreaId, isStageCleared(`${bossAreaId}-subboss`));
  const bossUrl = bossAreaId
    ? findImage(bossPurified ? IMAGE.subBossPurified(bossAreaId) : IMAGE.subBoss(bossAreaId))
    : undefined;
  // 立ち絵の左右は、顔の向きから決まる(王様・小ボスとマスコットが同じ場面にいるときは、反対側に置く)
  const layout = layoutPortraits({
    speaker: line.speaker,
    showKing: Boolean(kingUrl),
    showBoss: Boolean(bossUrl),
    showMascot: Boolean(line.showMascot),
    mascotForm: line.mascotForm,
    override: line.position,
  });
  const lastIndex = event.lines.length - 1;
  const isLast = lineIndex >= lastIndex;
  const options = event.choice?.options;
  const atChoice = isLast && options !== undefined;

  function handleNext() {
    if (isLast) {
      finish();
    } else {
      setLineIndex((i) => i + 1);
    }
  }

  // 選択肢があるイベントでは、スキップは「選択肢の手前まで進む」に置き換える
  function handleSkip() {
    if (options) {
      setLineIndex(lastIndex);
    } else {
      finish();
    }
  }

  // 画面のどこをタップしても次の台詞へ(テキストボックスも含む)。ボタン(スキップ・選択肢)のタップは、そのボタンの動作だけにする
  function handleScreenTap(e: MouseEvent<HTMLDivElement>) {
    if (atChoice || (e.target as HTMLElement).closest("button")) return;
    handleNext();
  }

  return (
    <div className="screen screen-story" onClick={handleScreenTap}>
      <div
        className="story-stage"
        style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
      >
        {kingUrl && (
          <div className={`story-character story-character-${layout.king}`} style={scaleStyle(layout.scale?.king)}>
            <img className="story-king" src={kingUrl} alt="" draggable={false} />
          </div>
        )}
        {bossUrl && (
          <div className={`story-character story-character-${layout.boss}`} style={scaleStyle(layout.scale?.boss)}>
            <img className="story-king" src={bossUrl} alt="" draggable={false} />
          </div>
        )}
        {line.showMascot && (
          <div className={`story-character story-character-${layout.mascot}`} style={scaleStyle(layout.scale?.mascot)}>
            <Mascot form={line.mascotForm} />
          </div>
        )}
      </div>
      {/* 送りの合図(▼)は、テキストボックスの右下に固定する。台詞の長さで位置が変わらない */}
      <div className="story-textbox-wrap">
        <div className="story-textbox">
          {line.speaker && <p className="story-speaker">{line.speaker}</p>}
          <p className="story-text">
            <Ruby text={line.text} />
          </p>
        </div>
        {!atChoice && (
          <span className="story-tap-hint" aria-hidden="true">
            {isLast ? "▼ タップして とじる" : "▼ タップ"}
          </span>
        )}
      </div>
      {atChoice ? (
        <div className="story-choices">
          {options.map((option) => (
            <button key={option.key} type="button" onClick={() => choose(option)}>
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        // スキップは画面の右上。ミュートは左上(MuteButton)。右下には何も置かない
        <button type="button" className="story-skip" onClick={handleSkip}>
          スキップ
        </button>
      )}
    </div>
  );
}
