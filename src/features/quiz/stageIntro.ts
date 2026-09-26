import type { Question, RubyText } from "@/data/schema";
import { getEngineFlavor } from "@/data/engineFlavor";
import { getUnitMeta } from "@/data/units";
import { rb } from "@/data/ruby";

/** このステージの出題形式ごとの呼び名と場面の説明(重複なし) */
function stageFlavors(areaId: string, questions: Question[]) {
  const seen = new Set<string>();
  const list: NonNullable<ReturnType<typeof getEngineFlavor>>[] = [];
  for (const q of questions) {
    const flavor = getEngineFlavor(getUnitMeta(q.unit)?.areaId ?? areaId, q.engine);
    if (!flavor) continue;
    const key = JSON.stringify(flavor.label);
    if (seen.has(key)) continue;
    seen.add(key);
    list.push(flavor);
  }
  return list;
}

export interface StageIntro {
  title: RubyText;
  message: RubyText;
}

/** ボス戦の冒頭の説明(対決の場面用。出題形式の「お手伝い」の文言は使わない) */
const BOSS_INTRO_MESSAGE: Record<"subBoss" | "lastBoss", string> = {
  subBoss: "ことばの力を うばう ボスが 立[た]ちはだかる!ライフは5つ。なくなる前に、正[ただ]しい答[こた]えで 浄化[じょうか]しよう!",
  lastBoss: "王[おう]にとりついた 黒[くろ]い力[ちから]との、さいごの 決戦[けっせん]!ライフは5つ。ことばの力[ちから]を 信[しん]じて、浄化[じょうか]しよう!",
};

/**
 * ステージの冒頭に、1度だけ出す説明。
 *  - ボス戦: 出題形式には紐づけず、対決の場面の専用の文言
 *  - 通常ステージで出題形式が1つ: その形式の呼び名と場面
 *  - 通常ステージで出題形式が混ざる: 個別の形式名ではなく、ステージ全体のテーマ名
 */
export function buildStageIntro(
  areaId: string,
  questions: Question[],
  boss: { label: string; title: string; type: "subBoss" | "lastBoss" } | undefined,
  stageTitle: RubyText | undefined,
): StageIntro | null {
  if (boss) {
    return { title: rb(`${boss.label}: ${boss.title}`), message: rb(BOSS_INTRO_MESSAGE[boss.type]) };
  }
  const flavors = stageFlavors(areaId, questions);
  if (flavors.length === 1) return { title: flavors[0].label, message: flavors[0].situation };
  if (flavors.length > 1 && stageTitle) {
    return { title: stageTitle, message: rb("いろいろな 形[かたち]の 問題[もんだい]に ちょうせん!") };
  }
  return null;
}
