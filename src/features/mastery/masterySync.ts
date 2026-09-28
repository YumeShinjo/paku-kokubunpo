import { useMasteryStore } from "@/app/store/masteryStore";
import { masteryApi, type MasteryApi } from "@/lib/masteryApi";

/**
 * 累計正解数の同期(9章のオフライン対応と同じ考え方。ランキングの得点は scoreSync.ts)。
 * 累計正解数は増える一方(減らない)なので、送るのは「いまの累計」だけでよい。
 * 未送信の分があるか = 件数が lastSyncedCount を超えているか(別途キューは持たない)。
 * ランキングと違い、こちらは書き込みのみ(サーバーの値を読み出してローカルへ反映することはしない。masteryApi.ts参照)。
 * ステージクリア時・アプリ起動時・通信が戻ったときに呼ぶ。
 */
export type MasterySyncResult = "up-to-date" | "offline" | "synced" | "failed";

let inFlight: Promise<MasterySyncResult> | null = null;

export function hasPendingMastery(): boolean {
  const { correctQuestionIds, lastSyncedCount } = useMasteryStore.getState();
  return correctQuestionIds.length > lastSyncedCount;
}

export function syncMastery(api: MasteryApi = masteryApi): Promise<MasterySyncResult> {
  // 送信中に呼ばれたら、その結果を待つ(同時に何本も送らない)
  if (inFlight) return inFlight;
  inFlight = run(api).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run(api: MasteryApi): Promise<MasterySyncResult> {
  const { correctQuestionIds, lastSyncedCount } = useMasteryStore.getState();
  const count = correctQuestionIds.length;
  if (count <= lastSyncedCount) return "up-to-date";
  if (!api.isConfigured()) return "failed";
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  try {
    await api.submitCorrectCount(count);
    useMasteryStore.getState().markSynced(count);
    return "synced";
  } catch {
    // 失敗してもローカルの記録は残っているので、次の機会に再送される
    return "failed";
  }
}
