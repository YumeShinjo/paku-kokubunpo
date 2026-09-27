import { areas } from "./areas";
import { subBossIntroStoryId } from "@/features/story/storyIds";

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
