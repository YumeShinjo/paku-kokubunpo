import { useProgressStore } from "@/app/store/progressStore";
import { useRankingStore } from "@/app/store/rankingStore";
import { rankingApi, type RankingApi } from "@/lib/rankingApi";

/**
 * 得点の同期(9章: スコアは一旦ローカルに貯めて、ネット接続時に自動でFirestoreへ送る)。
 * 得点は累計(progressStore.totalScore)なので、送るのは「いまの累計」だけでよい。
 * 未送信の得点があるか = totalScore が lastSyncedScore を超えているか(別途キューは持たない)。
 * ステージクリア時・アプリ起動時・通信が戻ったときに呼ぶ。
 */
export type SyncResult = "not-joined" | "up-to-date" | "offline" | "synced" | "failed";

let inFlight: Promise<SyncResult> | null = null;

export function hasPendingScore(): boolean {
  const { classCode, lastSyncedScore } = useRankingStore.getState();
  return classCode !== null && useProgressStore.getState().totalScore > lastSyncedScore;
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
  for (let i = 0; i < 2 && result === "synced" && hasPendingScore(); i++) {
    result = await run(api);
  }
  return result;
}

async function run(api: RankingApi): Promise<SyncResult> {
  const { classCode, nickname } = useRankingStore.getState();
  if (classCode === null || nickname === null) return "not-joined";
  const total = useProgressStore.getState().totalScore;
  if (total <= useRankingStore.getState().lastSyncedScore) return "up-to-date";
  if (!api.isConfigured()) return "failed";
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  try {
    await api.submitScore(classCode, nickname, total);
    useRankingStore.getState().markSynced(total);
    return "synced";
  } catch {
    // 失敗しても得点はローカルに残っているので、次の機会に再送される
    return "failed";
  }
}
