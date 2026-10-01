import type { ComponentType } from "react";
import { zukanPages } from "@/data/zukanPages";
import { AccuracyTab } from "@/features/zukan/AccuracyTab";
import { MemoriesTab } from "@/features/zukan/MemoriesTab";
import { ZukanPages } from "@/features/zukan/ZukanPages";
import { KotonohaTab } from "@/features/zukan/KotonohaTab";
import { isKotonohaUnlockedNow } from "@/features/kotonoha/unlock";

/**
 * ことだまの書のタブの定義。タブを増やすときは、ZUKAN_TABS に1つ足すだけでよい
 * (例: 「ことわざ・故事成語ずかん」。中身のないタブは、hasContent で false を返せば出ない)。
 * ラベルは、操作のボタンと同じく、ひらがなで書く(ふりがなの方針: 操作の名前にはふりがなを付けない)。
 * label は、タブの正式な名前(読み上げ・説明に使う)。タブに表示するのは、短い表示ラベル shortLabel(なければ label)。
 * タブは、幅が同じで1行に並べるので、shortLabel は、ふりがななしで、6文字ほどまでにする。
 */
export interface ZukanTab {
  /** タブのid(画面の切り替え先 { name: "zukan", tab } に使う) */
  id: string;
  label: string;
  /** タブに表示する、短いラベル(1行に収める。省略すると label) */
  shortLabel?: string;
  /** タブの中身 */
  Panel: ComponentType;
  /** 中身があるか。false のタブは表示しない(省略すると、中身あり) */
  hasContent?: () => boolean;
}

export const ZUKAN_TABS: readonly ZukanTab[] = [
  { id: "accuracy", label: "せいとうりつ", shortLabel: "せいとうりつ", Panel: AccuracyTab },
  { id: "pages", label: "ことばの ずかん", shortLabel: "ずかん", Panel: ZukanPages, hasContent: () => zukanPages.length > 0 },
  { id: "memories", label: "おもいで", shortLabel: "おもいで", Panel: MemoriesTab },
  // 言の葉の森で集めた葉の一覧。序章をクリアして、言の葉の森が遊べるようになるまでは、タブを出さない
  {
    id: "kotonoha",
    label: "ことわざ・故事成語ずかん",
    shortLabel: "ことわざ",
    Panel: KotonohaTab,
    hasContent: isKotonohaUnlockedNow,
  },
];

/** 画面を開いたときに出すタブ */
export const DEFAULT_ZUKAN_TAB = "accuracy";

/** 表示するタブ(中身のないタブを除く) */
export function visibleZukanTabs(tabs: readonly ZukanTab[] = ZUKAN_TABS): ZukanTab[] {
  return tabs.filter((tab) => tab.hasContent?.() ?? true);
}

/** タブのidを、表示できるタブのidに直す。知らないid・中身のないタブのときは、既定のタブ(なければ先頭) */
export function resolveZukanTab(id: string | undefined, tabs: readonly ZukanTab[] = visibleZukanTabs()): string {
  if (id !== undefined && tabs.some((t) => t.id === id)) return id;
  return tabs.find((t) => t.id === DEFAULT_ZUKAN_TAB)?.id ?? tabs[0]?.id ?? DEFAULT_ZUKAN_TAB;
}
