import { IMAGE } from "@/assets/registry";
import type { Stage } from "@/data/schema";

/**
 * ステージ選択の、ボスのノードに出す立ち絵の名前。
 *  - 倒す(浄化する)までは、浄化前(取り憑かれた姿)。倒したあとは、浄化後の姿
 *  - 小ボスは、エリアごとの絵。ラスボス(王様)は、取り憑かれた姿 → 浄化後の元の姿
 * cleared は、そのステージをクリアしたか(進行の記録 isStageCleared)。
 */
export function stageNodePortraitName(stage: Pick<Stage, "type">, areaId: string, cleared: boolean): string {
  if (stage.type === "lastBoss") return cleared ? IMAGE.lastBossPurified : IMAGE.lastBossPossessed;
  return cleared ? IMAGE.subBossPurified(areaId) : IMAGE.subBoss(areaId);
}
