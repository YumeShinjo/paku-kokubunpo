import { areas } from "./areas";

/**
 * 小ボスの話者名(ストーリーの台詞の speaker)から、そのボスがいるエリアのidを引く。
 * ストーリー画面で、台詞の話者に合わせて小ボスの立ち絵(boss/subboss-<エリアid>)を出すために使う(2・10章)。
 * 名前は areas.ts の subBossName(STORY.md の表記)と同じ。
 */
export function subBossAreaOf(speaker: string | undefined): string | undefined {
  if (speaker === undefined) return undefined;
  return areas.find((area) => area.subBossName === speaker)?.id;
}
