/**
 * ランキングの得点の「増え方」の上限(不正対策)。
 *
 * 得点はアプリ(端末)が計算して送るので、悪意のある端末が値を盛ることまでは、サーバー側では見分けられない。
 * (見分けるには、問題の答えあわせまでサーバーで行う必要があり、Cloud Functions=有料プランが要る。)
 * そこで、firestore.rules で「得点の増え方」に上限をかけ、桁外れの値を受け付けないようにしている。
 * 端末側も、同じ上限を守って送る(守らないと、ルールに拒否される)。この定数は、firestore.rules と必ず同じ値にすること。
 *
 *   - 参加(新規作成)時の得点は、JOIN_MAX_SCORE まで
 *   - 更新1回で増やせる得点は、SLACK_SCORE + RATE_SCORE_PER_SEC × 前回の更新からの経過秒数、かつ MAX_DELTA_SCORE まで
 *     (経過時間が短いのに、続けて何回も更新して、増やし続けることができないよう、「1回ごとの上乗せ」は小さい SLACK_SCORE だけにしている)
 *   - 得点の総量は MAX_SCORE まで(減らすことはできない)
 *
 * 1問の正解は10点、1ステージは最大でも150点(小ボスの15問)。ステージをクリアするには、少なくとも十数秒はかかるので、
 * RATE_SCORE_PER_SEC(1秒に0.8問=8点)なら、1ステージ分の得点は、そのステージのあいだに増えた分として、必ず収まる。
 * これより速く増える(1秒に0.8問より速く正解し続ける)ことは、人の操作ではありえないので、弾く。
 * BURST_SCORE は、古い版のデータなど、前回送った時刻がわからない端末が、最初の1回だけ送れる分(1ステージ分に余裕を持たせた大きさ)。
 */
export const JOIN_MAX_SCORE = 5000;
export const BURST_SCORE = 500;
export const SLACK_SCORE = 10;
export const RATE_SCORE_PER_SEC = 8;
export const MAX_DELTA_SCORE = 20000;
export const MAX_SCORE = 200000;

/**
 * いま送ってよい得点の上限(送信済みの得点 + 増やせる分)。
 * lastSyncedAtMs は、前回サーバーへ送れた時刻。わからない(古い版のデータ)ときは、BURST_SCORE分だけ進める。
 * 端末の時刻は、送れた瞬間(サーバーの記録より少しあと)を記録しているので、経過時間は実際より短めになり、上限を超えることはない。
 */
export function maxSendableScore(lastSyncedScore: number, lastSyncedAtMs: number | null, nowMs: number): number {
  if (lastSyncedAtMs === null) return Math.min(MAX_SCORE, lastSyncedScore + BURST_SCORE);
  const elapsedSec = Math.max(0, (nowMs - lastSyncedAtMs) / 1000);
  const delta = Math.min(MAX_DELTA_SCORE, SLACK_SCORE + Math.floor(elapsedSec * RATE_SCORE_PER_SEC));
  return Math.min(MAX_SCORE, lastSyncedScore + delta);
}
