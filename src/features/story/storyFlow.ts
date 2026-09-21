import type { Screen } from "@/app/store/navigationStore";
import type { Stage, StageType } from "@/data/schema";
import { getStoryEvent } from "@/data/story/events";
import {
  areaClearStoryId,
  creditsId,
  endingChoiceStoryId,
  endingResultId,
  epilogueStoryId,
  introStoryId,
  lastBossClearStoryId,
  lastBossIntroStoryId,
  subBossClearStoryId,
  truthStoryId,
} from "./storyIds";

type HasSeen = (storyId: string) => boolean;

/** 未視聴かつデータが存在するストーリーのときだけ、遷移先を story 画面でラップする。 */
function wrapIfUnseen(storyId: string, hasSeen: HasSeen, next: Screen): Screen {
  if (hasSeen(storyId) || !getStoryEvent(storyId)) return next;
  return { name: "story", eventId: storyId, next };
}

/** 未視聴のときだけ、遷移先の前に専用画面(称号授与・クレジット)を挟む。 */
function wrapScreenIfUnseen(id: string, hasSeen: HasSeen, build: (next: Screen) => Screen, next: Screen): Screen {
  return hasSeen(id) ? next : build(next);
}

/** 流す順に並べたイベントidを、先頭が最初に表示されるよう入れ子の遷移先にする。 */
function chain(storyIds: string[], hasSeen: HasSeen, last: Screen): Screen {
  return [...storyIds]
    .reverse()
    .reduce<Screen>((next, id) => wrapIfUnseen(id, hasSeen, next), last);
}

/** エリアに初めて入るとき、未視聴の導入ストーリーがあれば挟んでからステージ選択へ向かう(3章)。 */
export function buildAreaEntryScreen(areaId: string, hasSeen: HasSeen): Screen {
  return chain([introStoryId(areaId)], hasSeen, { name: "stageSelect", areaId });
}

/**
 * ステージに挑戦するとき、そのステージの直前に流すストーリーがあれば挟む。
 * 現状はラスボス戦の前(「最後の戦いが始まる」)だけ。再挑戦(もう少し→もう一度)では流れない。
 */
export function buildStageEntryScreen(opts: {
  areaId: string;
  stage: Pick<Stage, "id" | "type">;
  hasSeen: HasSeen;
}): Screen {
  const stage: Screen = { name: "stage", areaId: opts.areaId, stageId: opts.stage.id };
  if (opts.stage.type !== "lastBoss") return stage;
  return chain([lastBossIntroStoryId(opts.areaId)], opts.hasSeen, stage);
}

/**
 * ステージクリア後の遷移先を組み立てる。未視聴のストーリーだけを、次の順で挟んでステージ選択へ戻る:
 *  - 小ボス撃破:   subboss-clear → truth(真相究明。あるエリアのみ)
 *  - ラスボス撃破: lastboss-clear → ending-choice(選択→分岐)→ epilogue
 *  - エリアクリア: area-clear(王座の間ではエンディング全体の締めになる)
 *  - ラスボス撃破の最後に、称号の授与(endingResult)→クレジット(credits)を、未視聴なら挟む
 * ラスボス撃破の連鎖には、エリアクリア済みかどうかに関わらず area-clear(共通の締め)を必ず含める。
 * エンディングの最後を、通常ステージの消化状況に左右させないため(締めが後から唐突に流れるのを防ぐ)。
 * 視聴済みは飛ばすので、あとでエリアクリアになっても二度は流れない。
 * 選択肢を持つイベント(ending-choice)は、選んだ分岐イベントのあとで、ここで組み立てた続き(epilogue 以降)へ進む。
 */
export function buildPostClearScreen(opts: {
  areaId: string;
  stageType: StageType;
  justClearedArea: boolean;
  hasSeen: HasSeen;
}): Screen {
  const { areaId } = opts;
  const ids: string[] = [];
  if (opts.stageType === "subBoss") {
    ids.push(subBossClearStoryId(areaId), truthStoryId(areaId));
  }
  if (opts.stageType === "lastBoss") {
    ids.push(lastBossClearStoryId(areaId), endingChoiceStoryId(areaId), epilogueStoryId(areaId));
  }
  if (opts.justClearedArea || opts.stageType === "lastBoss") ids.push(areaClearStoryId(areaId));
  const end: Screen = { name: "stageSelect", areaId };
  const tail =
    opts.stageType === "lastBoss"
      ? wrapScreenIfUnseen(
          endingResultId(areaId),
          opts.hasSeen,
          (next) => ({ name: "endingResult", areaId, next }),
          wrapScreenIfUnseen(
            creditsId(areaId),
            opts.hasSeen,
            (next) => ({ name: "credits", areaId, ending: true, next }),
            end,
          ),
        )
      : end;
  return chain(ids, opts.hasSeen, tail);
}

/**
 * エンディングの見返し(ことだまの書から)。視聴済みの記録に関わらず、ラスボス撃破後の
 * 「撃破後 → エンディング分岐 → 後日談 → 共通の締め」をもう一度流し、最後に称号の授与を見せて returnTo へ戻る。
 * 分岐でもう一度選べるので、選択と称号を変えられる(選択は保存し直される。クレジットは挟まない)。
 */
export function buildEndingReplayScreen(areaId: string, returnTo: Screen): Screen {
  const replayAll: HasSeen = () => false;
  return chain(
    [
      lastBossClearStoryId(areaId),
      endingChoiceStoryId(areaId),
      epilogueStoryId(areaId),
      areaClearStoryId(areaId),
    ],
    replayAll,
    { name: "endingResult", areaId, next: returnTo },
  );
}
