import { useExpStore } from "@/app/store/expStore";
import { expApi, type ExpApi } from "@/lib/expApi";

/**
 * 経験値の同期(9章のオフライン対応と同じ考え方。ランキングの得点はscoreSync.ts)。
 * 経験値は累計(expStore.totalExp)なので、送るのは「いまの累計」だけでよい。
 * 未送信の分があるか = totalExp が lastSyncedExp を超えているか(別途キューは持たない)。
 * ランキングと違い、こちらは書き込みのみ(サーバーの値を読み出してローカルへ反映することはしない。expApi.ts参照)。
 * ステージクリア時・アプリ起動時・通信が戻ったときに呼ぶ。
 */
export type ExpSyncResult = "up-to-date" | "offline" | "synced" | "failed";

let inFlight: Promise<ExpSyncResult> | null = null;

export function hasPendingExp(): boolean {
  const { totalExp, lastSyncedExp } = useExpStore.getState();
  return totalExp > lastSyncedExp;
}

export function syncExp(api: ExpApi = expApi): Promise<ExpSyncResult> {
  // 送信中に呼ばれたら、その結果を待つ(同時に何本も送らない)
  if (inFlight) return inFlight;
  inFlight = run(api).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run(api: ExpApi): Promise<ExpSyncResult> {
  const { totalExp, lastSyncedExp } = useExpStore.getState();
  if (totalExp <= lastSyncedExp) return "up-to-date";
  if (!api.isConfigured()) return "failed";
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  try {
    await api.submitExp(totalExp);
    useExpStore.getState().markSynced(totalExp);
    return "synced";
  } catch {
    // 失敗しても経験値はローカルに残っているので、次の機会に再送される
    return "failed";
  }
}
