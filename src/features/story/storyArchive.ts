import { areas as allAreas } from "@/data/areas";
import { storyEvents as allEvents } from "@/data/story/events";
import type { StoryEvent } from "@/data/story/schema";

/**
 * ストーリーの見返し(ことだまの書の「おもいで」)。
 * 見終わったストーリーだけを、エリアごとに並べる。まだ見ていないものは出さない(ネタバレを避ける)。
 * 選択肢を持つエンディング分岐(と、その分岐先)は、別に用意した「エンディングを もういちど 見る」で見返す。
 */

/** 見返しに出すストーリーの種類(イベントidの「エリアid-」のあとの部分)と、表示する名前 */
export const STORY_PHASE_LABELS: Record<string, string> = {
  intro: "はじまり",
  "subboss-clear": "小ボスを浄化したあと",
  truth: "真相",
  "lastboss-intro": "最後の戦いの前",
  "lastboss-clear": "ラスボスを浄化したあと",
  epilogue: "宰相のひとこと",
  "area-clear": "エリアクリア",
};

export interface ArchiveEntry {
  id: string;
  label: string;
}

export interface ArchiveGroup {
  areaId: string;
  areaName: string;
  entries: ArchiveEntry[];
}

/** 見返せるストーリーのイベントか(選択肢を持つイベントと、分岐先は除く)。返り値は種類(phase) */
function replayablePhase(event: StoryEvent, areaId: string): string | null {
  if (!event.id.startsWith(`${areaId}-`) || event.choice) return null;
  const phase = event.id.slice(areaId.length + 1);
  return phase in STORY_PHASE_LABELS ? phase : null;
}

/** 見返せるストーリーの総数(「N / 全部」の表示用) */
export function countReplayableStories(events: StoryEvent[] = allEvents, areaList = allAreas): number {
  return areaList.reduce(
    (sum, area) => sum + events.filter((e) => replayablePhase(e, area.id) !== null).length,
    0,
  );
}

/** 見終わったストーリー(seenIds)を、エリアの順に、ストーリーの流れの順に並べる。1つもないエリアは含めない。 */
export function buildStoryArchive(
  seenIds: string[],
  events: StoryEvent[] = allEvents,
  areaList = allAreas,
): ArchiveGroup[] {
  const seen = new Set(seenIds);
  const groups: ArchiveGroup[] = [];
  for (const area of areaList) {
    const entries: ArchiveEntry[] = [];
    for (const event of events) {
      const phase = replayablePhase(event, area.id);
      if (phase !== null && seen.has(event.id)) {
        entries.push({ id: event.id, label: STORY_PHASE_LABELS[phase] });
      }
    }
    if (entries.length > 0) groups.push({ areaId: area.id, areaName: area.name, entries });
  }
  return groups;
}
