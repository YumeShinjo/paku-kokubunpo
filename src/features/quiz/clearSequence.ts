import { useCallback, useEffect, useRef, useState } from "react";
import { duckBgm, playSe, restoreBgm, seDurationMs, type SeKind } from "@/lib/audio";

/**
 * クリア結果の見せ方(7章・13章): 情報を1つずつ、間を空けて順に出し、出すたびにその効果音を鳴らす。
 *   フェーズ0: クリア(達成音) → フェーズ1: マスコットの成長(成長音) → フェーズ2: 図鑑のページ解放(ページ解放音)
 * エリアクリアでなければフェーズ0だけ。効果音どうしが重ならないよう、前の音が鳴り終わってから間(GAP)を空けて次へ進む。
 */

/** 前の効果音が鳴り終わってから、次の演出が始まるまでの間(ミリ秒) */
export const CLEAR_SEQUENCE_GAP_MS = 900;

export interface ClearSequenceStep {
  /** 表示するフェーズ(0〜2) */
  phase: 0 | 1 | 2;
  /** 演出の開始からの時刻(ミリ秒)。この時刻にフェーズを表示して効果音を鳴らす */
  at: number;
  se: SeKind;
}

export interface ClearSequencePlan {
  steps: ClearSequenceStep[];
  /** すべての効果音が鳴り終わる時刻(ミリ秒)。この時刻からボタンを出す */
  endAt: number;
}

/** 演出の順番と時刻を決める(音の長さから計算する純粋関数) */
export function planClearSequence(
  clearSe: SeKind,
  areaCleared: boolean,
  durationMs: (kind: SeKind) => number,
  gapMs: number = CLEAR_SEQUENCE_GAP_MS,
): ClearSequencePlan {
  const steps: ClearSequenceStep[] = [{ phase: 0, at: 0, se: clearSe }];
  let end = durationMs(clearSe);
  if (areaCleared) {
    for (const [phase, se] of [
      [1, "growth"],
      [2, "pageUnlock"],
    ] as const) {
      const at = end + gapMs;
      steps.push({ phase, at, se });
      end = at + durationMs(se);
    }
  }
  return { steps, endAt: end };
}

/**
 * クリア結果の演出を進める。active が true になった時点から始まり、
 * 表示するフェーズ(phase)と、演出が終わったか(done)を返す。skip() で残りを飛ばして終わりの状態にする。
 * 演出のあいだは BGM を下げ、終わる(または飛ばす)と元に戻す。
 */
export function useClearSequence(active: boolean, clearSe: SeKind, areaCleared: boolean) {
  const [phase, setPhase] = useState<0 | 1 | 2>(0);
  const [done, setDone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => {
    if (!active) {
      setPhase(0);
      setDone(false);
      return;
    }
    const plan = planClearSequence(clearSe, areaCleared, seDurationMs);
    for (const step of plan.steps) {
      const run = () => {
        setPhase(step.phase);
        playSe(step.se);
      };
      if (step.at === 0) run();
      else timers.current.push(setTimeout(run, step.at));
    }
    timers.current.push(setTimeout(() => setDone(true), plan.endAt));
    duckBgm(plan.endAt);
    return clearTimers;
  }, [active, clearSe, areaCleared, clearTimers]);

  const skip = useCallback(() => {
    clearTimers();
    setPhase(areaCleared ? 2 : 0);
    setDone(true);
    restoreBgm();
  }, [areaCleared, clearTimers]);

  // エリアクリアでなければ順に出す情報がないので、待たせずすぐ「つぎへ」を出す(達成音は鳴る)
  return { phase, done: done || !areaCleared, skip };
}
