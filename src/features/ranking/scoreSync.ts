import { useProgressStore } from "@/app/store/progressStore";
import { useProfileStore } from "@/app/store/profileStore";
import { useRankingStore } from "@/app/store/rankingStore";
import { rankingApi, type RankingApi } from "@/lib/rankingApi";
import { maxSendableScore } from "./scoreLimits";

/** 上限に近くて、これより小さくしか進められないときは、送信を見送る(点) */
const MIN_SEND_STEP = 50;

/**
 * 得点の同期(9章: スコアは一旦ローカルに貯めて、ネット接続時に自動でFirestoreへ送る)。
 * 得点は累計(progressStore.totalScore)なので、送るのは「いまの累計」だけでよい。
 * 未送信の得点があるか = totalScore が lastSyncedScore を超えているか(別途キューは持たない)。
 * 主人公のアイコンも同じ仕組みで送る(選んだアイコンが、送信済みのアイコンと違っていれば未送信)。
 * ステージクリア時・アプリ起動時・通信が戻ったときに呼ぶ。
 */
export type SyncResult = "not-joined" | "up-to-date" | "offline" | "synced" | "failed";

let inFlight: Promise<SyncResult> | null = null;

export function hasPendingScore(): boolean {
  const { classCode, lastSyncedScore } = useRankingStore.getState();
  return classCode !== null && useProgressStore.getState().totalScore > lastSyncedScore;
}

/** 選んだアイコンが、まだサーバーへ送られていないか(参加中のときだけ) */
export function hasPendingIcon(): boolean {
  const { classCode, syncedIcon } = useRankingStore.getState();
  return classCode !== null && useProfileStore.getState().iconId !== syncedIcon;
}

export function syncScore(api: RankingApi = rankingApi): Promise<SyncResult> {
  // 送信中に呼ばれたら、その結果を待つ(同時に何本も送らない)
  if (inFlight) return inFlight;
  inFlight = runUntilCaughtUp(api).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** 送信している間に得点が増えていたら、続けてもう一度送る(取りこぼし防止。無限に続けないよう最大3回) */
async function runUntilCaughtUp(api: RankingApi): Promise<SyncResult> {
  let result = await run(api);
  for (let i = 0; i < 2 && result === "synced" && (hasPendingScore() || hasPendingIcon()); i++) {
    const next = await run(api);
    if (next !== "up-to-date") result = next; // 上限のため見送っただけなら、さっき送れた結果("synced")のままにする
  }
  return result;
}

async function run(api: RankingApi): Promise<SyncResult> {
  const { classCode, nickname } = useRankingStore.getState();
  if (classCode === null || nickname === null) return "not-joined";
  const { lastSyncedScore, lastSyncedAt, syncedIcon } = useRankingStore.getState();
  const total = useProgressStore.getState().totalScore;
  const icon = useProfileStore.getState().iconId;
  if (total <= lastSyncedScore && icon === syncedIcon) return "up-to-date";
  if (!api.isConfigured()) return "failed";
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  try {
    // アイコンだけを送るとき、別の端末で貯めた得点のほうが高いこともある(得点はサーバー側で減らせない)ので、送信済みの得点を下回らせない
    // 一度に送れる増え方には上限がある(不正対策。firestore.rules と同じ。scoreLimits.ts)。たまっている分が多いときは、上限までを送り、残りは次の機会に送る
    const sendable = maxSendableScore(lastSyncedScore, lastSyncedAt, Date.now());
    const score = Math.min(Math.max(total, lastSyncedScore), sendable);
    // いまは、これ以上送れない(上限に近い)ときは、送らずに待つ。少し進むだけの送信を、何度も繰り返さない(あとで、また送る)
    const capped = Math.max(total, lastSyncedScore) > sendable;
    if (icon === syncedIcon && (score <= lastSyncedScore || (capped && score - lastSyncedScore < MIN_SEND_STEP))) return "up-to-date";
    await api.submitScore(classCode, { nickname, icon }, score);
    useRankingStore.getState().markSynced(score, icon);
    return "synced";
  } catch {
    // 失敗しても得点はローカルに残っているので、次の機会に再送される
    return "failed";
  }
}
