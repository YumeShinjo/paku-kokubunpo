import type { Screen } from "@/app/store/navigationStore";
import { areas } from "@/data/areas";
import { getStage } from "@/data/stages";
import type { BgmScene } from "@/assets/registry";

/** 最終エリア(ラスボスのいるエリア)。そのエリアのラスボス撃破後のストーリーがエンディングの場面になる */
const FINAL_AREA_ID = areas.find((a) => a.finalBoss)?.id;

/** 最終エリアの、ラスボス撃破後に流れるストーリー(撃破後→分岐→後日談→共通の締め) */
function isEndingStory(eventId: string): boolean {
  if (!FINAL_AREA_ID || !eventId.startsWith(`${FINAL_AREA_ID}-`)) return false;
  const phase = eventId.slice(FINAL_AREA_ID.length + 1);
  return (
    phase === "lastboss-clear" ||
    phase.startsWith("ending-") ||
    phase === "epilogue" ||
    phase === "area-clear"
  );
}

/**
 * 画面に対応するBGMの場面を返す。実際に鳴らす曲は、素材がそろっていなければ
 * assets/registry.ts の BGM_FALLBACK に従って代わりの曲が選ばれる。
 */
export function sceneForScreen(screen: Screen): BgmScene {
  switch (screen.name) {
    case "title":
    case "settings":
    case "transferIssue":
    case "transferRestore":
    case "zukan":
    case "ranking":
      return "title";
    case "credits":
      return screen.ending ? "ending" : "title";
    case "endingResult":
      return "ending";
    case "areaSelect":
    case "stageSelect":
      return "explore";
    case "freePractice":
    case "reviewPractice":
      return "stage";
    case "stage": {
      const type = getStage(screen.stageId)?.type;
      return type === "lastBoss" ? "lastBoss" : type === "subBoss" ? "subBoss" : "stage";
    }
    case "story":
      if (screen.eventId.endsWith("-truth")) return "truth";
      if (isEndingStory(screen.eventId)) return "ending";
      // 最終エリア以外の7エリアの会話(導入・小ボス撃破後・エリアクリア)は、会話用の曲。王座の間の前半は探索の曲のまま
      return FINAL_AREA_ID && screen.eventId.startsWith(`${FINAL_AREA_ID}-`) ? "explore" : "talk";
  }
}
