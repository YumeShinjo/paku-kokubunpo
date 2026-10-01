import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/safeStorage";
import { kojiQuestions, kotowazaQuestions } from "@/data/kotowaza";
import type { CompletionKind } from "@/data/yuraiScenes";

/**
 * 言の葉の森(ことわざ・故事成語のミニゲーム)の記録。本編の進捗・ランキングの累計正解数とは、まったく別に持つ。
 *  - collectedIds: 初めて正解した問題のid(「集めた葉」)。一度集めたら、あとで間違えても減らない
 *  - missedIds: まちがえた問題のid。正解すると外れる(次のラウンドで優先して出す)
 *  - enteredForest: 言の葉の森に、はじめて入場したか(図鑑「なかまの ずかん」のユライの解放に使う)。
 *    この記録がない端末でも、すでに遊んだ記録(葉を集めた・まちがえた)があれば、入場済みとして扱う(hasEnteredForest)
 *  - shownCompletions: ユライとコトの「コンプリートの台詞」を、もう出したカテゴリ("all" / "kotowaza" / "koji")。各1回だけ出す
 *  - lastEntryScene: 2回目以降の入口で、直前に出した台詞の場面ID(連続で同じものを出さないため)
 * 端末(localStorage の paku-kokubunpo:kotonoha)にだけ保存する。引き継ぎコードには含めない。
 * 「データを初期化」は、paku-kokubunpo: で始まるキーを全部消すので、このキーも消える。
 */
interface KotonohaState {
  collectedIds: string[];
  missedIds: string[];
  enteredForest: boolean;
  shownCompletions: CompletionKind[];
  lastEntryScene?: string;
  /** 直前に出した、入口の台詞を記録する */
  setLastEntryScene: (sceneId: string) => void;
  /** 言の葉の森に入場したことを記録する */
  markEntered: () => void;
  /** 1問の結果を記録する。その問題の葉を、はじめて集めたときは true を返す */
  recordResult: (questionId: string, correct: boolean) => boolean;
}

export const useKotonohaStore = create<KotonohaState>()(
  persist(
    (set, get) => ({
      collectedIds: [],
      missedIds: [],
      enteredForest: false,
      shownCompletions: [],
      lastEntryScene: undefined,
      setLastEntryScene: (sceneId) => {
        if (get().lastEntryScene !== sceneId) set({ lastEntryScene: sceneId });
      },
      markEntered: () => {
        if (!get().enteredForest) set({ enteredForest: true });
      },
      recordResult: (questionId, correct) => {
        const { collectedIds, missedIds } = get();
        if (correct) {
          const isNew = !collectedIds.includes(questionId);
          const nextCollected = isNew ? [...collectedIds, questionId] : collectedIds;
          // 今の1枚で、はじめて埋まったカテゴリは、コンプリートの台詞を出す対象として記録する(表示済みにする)
          const completed = isNew ? newlyCompleted(collectedIds, nextCollected, get().shownCompletions) : [];
          set({
            collectedIds: nextCollected,
            missedIds: missedIds.filter((id) => id !== questionId),
            ...(completed.length > 0 ? { shownCompletions: [...get().shownCompletions, ...completed] } : {}),
          });
          return isNew;
        }
        if (!missedIds.includes(questionId)) set({ missedIds: [...missedIds, questionId] });
        return false;
      },
    }),
    { name: "paku-kokubunpo:kotonoha", storage: safeJSONStorage },
  ),
);

/** 言の葉の森に入場したことがあるか。入場の記録がなくても、すでに遊んだ記録があれば、入場済み */
export function hasEnteredForest(s: Pick<KotonohaState, "enteredForest" | "collectedIds" | "missedIds">): boolean {
  return s.enteredForest || s.collectedIds.length > 0 || s.missedIds.length > 0;
}

const ids = (questions: { id: string }[]) => questions.map((q) => q.id);
const CATEGORY_IDS: Record<CompletionKind, string[]> = {
  all: [...ids(kotowazaQuestions), ...ids(kojiQuestions)],
  kotowaza: ids(kotowazaQuestions),
  koji: ids(kojiQuestions),
};

/**
 * 葉を1枚集めて(before → after)、そのカテゴリが「はじめて」埋まったときの、コンプリートの種類を返す(まだ出していないものだけ)。
 *  - 「埋まった瞬間」(before では埋まっておらず、after で埋まった)だけを数える。
 *    すでに埋まっている端末は、アップデートのあとで、遡って出ない。次に、まだ埋まっていないカテゴリが埋まるときだけ出る
 *  - 80/80 と、50/50・30/30 が同時に埋まったときは、"all" だけを返す(同時のものは、表示済みとして扱う)
 */
export function newlyCompleted(before: string[], after: string[], shown: CompletionKind[]): CompletionKind[] {
  const done = (collected: string[], kind: CompletionKind) => CATEGORY_IDS[kind].every((id) => collected.includes(id));
  const now = (["all", "kotowaza", "koji"] as const).filter((kind) => !done(before, kind) && done(after, kind));
  if (now.includes("all")) return shown.includes("all") ? [] : ["all", ...now.filter((k) => k !== "all" && !shown.includes(k))];
  return now.filter((kind) => !shown.includes(kind));
}

/** 実際に台詞を出す種類(同時達成のときは、"all" だけ) */
export function completionsToShow(newly: CompletionKind[]): CompletionKind[] {
  return newly.includes("all") ? ["all"] : newly;
}
