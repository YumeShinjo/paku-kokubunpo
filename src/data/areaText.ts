import { autoRuby } from "./furigana";
import { areas } from "./areas";
import type { AreaMeta, Stage } from "./schema";

/**
 * エリア名・単元名・ボスの役職名を、画面に出す「ふりがな付きの表記」("漢字[ふりがな]" 記法)で返す。
 * <Rb t={...} />(components/Rb.tsx)へそのまま渡せる。データ側の name などは、内部の識別・テスト用に
 * ふりがなを含まない形のまま持っておき、画面表示のときだけここを通す(4章・システム文にもふりがなを付ける方針)。
 */
export const areaNameText = (area: Pick<AreaMeta, "name" | "nameRuby">): string => area.nameRuby ?? area.name;

/** 単元(大分類)の表示名。文法用語には、辞書(furigana.ts)でふりがなを自動で付ける */
export const unitLabelText = (area: Pick<AreaMeta, "unitLabel">): string => autoRuby(area.unitLabel);

/** 小ボスの表示名(例: 「鍛冶見習い・レル」) */
export function subBossTitleText(area: Pick<AreaMeta, "subBoss" | "subBossRuby" | "subBossName">): string {
  return `${area.subBossRuby ?? area.subBoss ?? ""}・${area.subBossName ?? ""}`;
}

/** ステージの表示名。小ボス・ラスボスは役職名にふりがなを付け、通常ステージは文法用語にふりがなを付ける */
export function stageTitleText(stage: Pick<Stage, "areaId" | "type" | "title">): string {
  const area = areas.find((a) => a.id === stage.areaId);
  if (stage.type === "subBoss" && area) return subBossTitleText(area);
  if (stage.type === "lastBoss" && area?.finalBossRuby) return area.finalBossRuby;
  return autoRuby(stage.title);
}
