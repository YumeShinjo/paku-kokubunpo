import { useEffect, useState } from "react";
import type { LevelInfo } from "@/data/levelTable";
import { Rb } from "@/components/Rb";

export interface ExpGainResult {
  /** このステージで得た経験値の合計(クリアボーナス込み) */
  gained: number;
  before: LevelInfo;
  after: LevelInfo;
}

/** ゲージが伸びる・満タンになるアニメーションの長さ(ミリ秒) */
const FILL_MS = 700;
/** レベルアップの演出をはさむ間(ミリ秒) */
const LEVEL_UP_PAUSE_MS = 90;

/**
 * クリア画面の経験値演出(演出強化のみ。進行度・難易度には影響しない)。
 * 「獲得経験値 +◯◯」→ ゲージが伸びるアニメーション → レベルアップしていれば「レベルアップ!」を挟んで新しいレベルのぶんも伸ばす。
 */
export function ExpGainDisplay({ result }: { result: ExpGainResult }) {
  const leveledUp = result.after.level > result.before.level;
  const [barRatio, setBarRatio] = useState(result.before.progress);
  const [displayLevel, setDisplayLevel] = useState(result.before.level);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    // 画面が出た直後(0%の状態)からアニメーションさせたいので、少し待ってから伸ばし始める
    if (!leveledUp) {
      timers.push(setTimeout(() => setBarRatio(result.after.progress), LEVEL_UP_PAUSE_MS));
      return () => timers.forEach(clearTimeout);
    }
    // レベルアップしたとき: 今のレベルのゲージをいったん満タンにしてから、新しいレベルの分を0から伸ばす
    timers.push(setTimeout(() => setBarRatio(1), LEVEL_UP_PAUSE_MS));
    timers.push(
      setTimeout(() => {
        setShowLevelUp(true);
        setDisplayLevel(result.after.level);
        setBarRatio(0);
      }, LEVEL_UP_PAUSE_MS + FILL_MS),
    );
    timers.push(
      setTimeout(() => setBarRatio(result.after.progress), LEVEL_UP_PAUSE_MS + FILL_MS + 60),
    );
    return () => timers.forEach(clearTimeout);
  }, [leveledUp, result.after.level, result.after.progress]);

  return (
    <div className="exp-gain" aria-live="polite">
      <p className="exp-gain-amount">
        <Rb t="経験値[けいけんち]" /> +{result.gained}exp
      </p>
      <div
        className="exp-gauge"
        role="progressbar"
        aria-label="つぎのレベルまで"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(barRatio * 100)}
      >
        <div className="exp-gauge-fill" style={{ width: `${barRatio * 100}%` }} />
      </div>
      <p className="exp-level-label">
        Lv.{displayLevel}
        {result.after.isMaxLevel && displayLevel === result.after.level ? "(さいだいレベル)" : ""}
      </p>
      {showLevelUp && (
        <p className="exp-level-up" key={result.after.level}>
          ⭐ レベルアップ!
        </p>
      )}
    </div>
  );
}
