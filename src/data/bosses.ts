import { areas } from "./areas";
import {
  introStoryId,
  lastBossIntroStoryId,
  subBossClearStoryId,
  subBossIntroStoryId,
  truthStoryId,
} from "@/features/story/storyIds";

/**
 * 小ボスの話者名(ストーリーの台詞の speaker)から、そのボスがいるエリアのidを引く。
 * ストーリー画面で、台詞の話者に合わせて小ボスの立ち絵(boss/subboss-<エリアid>)を出すために使う(2・10章)。
 * 名前は areas.ts の subBossName(STORY.md の表記)と同じ。
 */
export function subBossAreaOf(speaker: string | undefined): string | undefined {
  if (speaker === undefined) return undefined;
  return areas.find((area) => area.subBossName === speaker)?.id;
}

/**
 * ストーリー画面で、その小ボスの立ち絵を浄化後の姿(boss/subboss-<エリアid>-purified)で出すか。
 * 小ボスは、撃破の前後で台詞の話者名が変わらない(王様の「王(…)」→「ヴェルバルト」のような
 * 出し分けができない)ため、ステージのクリア状況(isStageCleared)で判定する。
 * ただし、戦う前の「あらわれた!」の直前(subBossIntroStoryId)の台詞だけは、あとで撃破していても
 * 常に浄化前の姿のまま(「思い出」で見返したときに、混乱した台詞と表情が食い違わないようにする)。
 */
export function isSubBossPurifiedIn(eventId: string, areaId: string, stageCleared: boolean): boolean {
  return stageCleared && eventId !== subBossIntroStoryId(areaId);
}

/**
 * そのエリアを浄化する「関門」のステージid。王座の間だけ、宰相(小ボス)を倒しても関門はまだで、
 * 王様(ラスボス)を倒してはじめてエリア全体が浄化される。それ以外のエリアは、小ボスの撃破がそのまま関門。
 */
export function areaPurifyGateStageId(areaId: string): string {
  return areaId === "ohzaNoMa" ? `${areaId}-lastboss` : `${areaId}-subboss`;
}

/**
 * ストーリー画面で、そのイベント(eventId)の背景を、いまの浄化状況(gateCleared)に関わらず、
 * 必ず「荒れた背景」にするべきか。関門(areaPurifyGateStageId)の撃破より前に必ず起こる場面は、
 * あとで浄化していても、「思い出」で見返したときにそのころの荒れた様子のまま見せる。
 * 王座の間だけ、宰相の撃破(subboss-clear)・真相究明(truth)・ラスボス前(lastboss-intro)は、
 * まだ王様を倒していない時点の場面なので、この対象に含める。
 */
function isBeforeAreaPurification(eventId: string, areaId: string): boolean {
  if (areaId === "ohzaNoMa") {
    return [
      introStoryId(areaId),
      subBossIntroStoryId(areaId),
      subBossClearStoryId(areaId),
      truthStoryId(areaId),
      lastBossIntroStoryId(areaId),
    ].includes(eventId);
  }
  return eventId === introStoryId(areaId) || eventId === subBossIntroStoryId(areaId);
}

/**
 * エリアの背景の名前(registry.ts の IMAGE.background に渡す)。関門を撃破していれば通常の姿
 * (エリアidそのまま)、していなければ荒れた姿(`<エリアid>-corrupted`)。
 * eventId を渡すと、ストーリーの場面ごとの見え方(思い出の再生でも当時の様子のまま)を優先する。
 * 序章(prologue)は小ボスがおらず、浄化の概念がないので常に通常の背景。
 */
export function areaBackgroundName(areaId: string, gateCleared: boolean, eventId?: string): string {
  if (areaId === "prologue") return areaId;
  const corrupted = !gateCleared || (eventId !== undefined && isBeforeAreaPurification(eventId, areaId));
  return corrupted ? `${areaId}-corrupted` : areaId;
}
