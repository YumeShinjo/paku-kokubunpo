import { useCallback, useMemo } from "react";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";
import { getAllIdiomQuestions } from "@/data/kotowaza";
import { storyEvents } from "@/data/story/events";
import { useDebugUnlock } from "@/lib/debugUnlock";

/**
 * 全解放(lib/debugUnlock.ts)がオンのとき、画面を出すための「解放済みか」の判定を、すべて「解放済み」に見せる。
 * ここにあるのは、表示の判定だけ。進行データそのものは書き換えない。
 * ゲームの進み方に関わる判定(ステージをクリアしたときの「エリア全体をクリアしたか」・ストーリーを見たか(視聴済みは飛ばす)・
 * 引き継ぎコード)は、これを通さず、本当の進行データを読む(オンのまま遊んだ結果が、本当の進行データに正しく書き込まれるように)。
 */

/** ステージをクリアしたか(表示用: クリア済みの印・浄化後の背景・立ち絵) */
export function useViewIsStageCleared(): (stageId: string) => boolean {
  const unlocked = useDebugUnlock();
  const raw = useProgressStore((s) => s.isStageCleared);
  return useCallback((stageId) => unlocked || raw(stageId), [unlocked, raw]);
}

/** ステージに挑戦できるか(表示・入口の判定用) */
export function useViewIsStageUnlocked(): (stageId: string) => boolean {
  const unlocked = useDebugUnlock();
  const raw = useProgressStore((s) => s.isStageUnlocked);
  return useCallback((stageId) => unlocked || raw(stageId), [unlocked, raw]);
}

/** エリアに入れるか(表示・入口の判定用) */
export function useViewIsAreaUnlocked(): (areaId: string) => boolean {
  const unlocked = useDebugUnlock();
  const raw = useProgressStore((s) => s.isAreaUnlocked);
  return useCallback((areaId) => unlocked || raw(areaId), [unlocked, raw]);
}

/** エリアをクリアしたか(表示用: エリア選択の「クリア済み」) */
export function useViewIsAreaCleared(): (areaId: string) => boolean {
  const unlocked = useDebugUnlock();
  const raw = useProgressStore((s) => s.isAreaCleared);
  return useCallback((areaId) => unlocked || raw(areaId), [unlocked, raw]);
}

const allIdiomIds = (): string[] => getAllIdiomQuestions().map((q) => q.id);

/** 集めた葉(言の葉の森)のid(表示用: 図鑑・入口の「N / 80」)。全解放のときは、80まい全部 */
export function useViewCollectedIds(): string[] {
  const unlocked = useDebugUnlock();
  const raw = useKotonohaStore((s) => s.collectedIds);
  return useMemo(() => (unlocked ? allIdiomIds() : raw), [unlocked, raw]);
}

/** 見終わったストーリーのid(表示用: 図鑑の「おもいで」・なかまの ずかん)。全解放のときは、すべてのストーリー */
export function useViewSeenStoryIds(): string[] {
  const unlocked = useDebugUnlock();
  const raw = useStoryStore((s) => s.seenStoryIds);
  return useMemo(() => (unlocked ? storyEvents.map((e) => e.id) : raw), [unlocked, raw]);
}
