import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProgressStore } from "@/app/store/progressStore";
import { useRankingStore } from "@/app/store/rankingStore";
import type { RankingApi } from "@/lib/rankingApi";
import {
  BURST_SCORE,
  SLACK_SCORE,
  JOIN_MAX_SCORE,
  MAX_DELTA_SCORE,
  MAX_SCORE,
  RATE_SCORE_PER_SEC,
  maxSendableScore,
} from "./scoreLimits";
import { syncScore } from "./scoreSync";

const rules = readFileSync("firestore.rules", "utf-8");

describe("得点の増え方の上限(不正対策)", () => {
  it("firestore.rules の数値と、端末側の定数(scoreLimits.ts)が一致している", () => {
    expect(rules).toContain(`request.resource.data.score <= ${JOIN_MAX_SCORE};`);
    expect(rules).toContain(`resource.data.score + ${MAX_DELTA_SCORE}`);
    expect(rules).toContain(`data.score <= ${MAX_SCORE}`);
    expect(rules).toContain(`${SLACK_SCORE} * 1000 + (request.time.toMillis() - resource.data.updatedAt.toMillis()) * ${RATE_SCORE_PER_SEC}`);
  });

  it("前回送った時刻がわからない(古い版のデータ)ときは、BURST_SCORE(1ステージ分に余裕を持たせた大きさ)だけ進められる", () => {
    expect(maxSendableScore(1000, null, 0)).toBe(1000 + BURST_SCORE);
    expect(BURST_SCORE).toBeGreaterThanOrEqual(150);
  });

  it("経過時間がほとんどないのに、続けて増やすことはできない(1回の上乗せは SLACK_SCORE だけ)", () => {
    expect(maxSendableScore(1000, 5000, 5000)).toBe(1000 + SLACK_SCORE);
  });

  it("1ステージ分(最大150点)は、ステージを遊んでいるあいだの経過時間で、必ず収まる(最短でも19秒あれば150点)", () => {
    expect(maxSendableScore(0, 0, 19_000)).toBeGreaterThanOrEqual(150);
  });

  it("時間がたつほど、増やせる量が増える(1秒に8点まで)。上限は MAX_DELTA と MAX_SCORE", () => {
    expect(maxSendableScore(0, 0, 60_000)).toBe(SLACK_SCORE + 60 * RATE_SCORE_PER_SEC);
    expect(maxSendableScore(0, 0, 24 * 3600_000)).toBe(MAX_DELTA_SCORE);
    expect(maxSendableScore(MAX_SCORE - 10, 0, 24 * 3600_000)).toBe(MAX_SCORE);
  });

  it("端末の時計が戻っても(経過が負でも)、上限は下がらず、増えすぎもしない", () => {
    expect(maxSendableScore(100, 10_000, 0)).toBe(100 + SLACK_SCORE);
  });
});

describe("得点の送信: たまった得点が多いときは、上限までを送り、残りは次の機会に送る", () => {
  beforeEach(() => {
    vi.useRealTimers();
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 0, lastSyncedAt: null, syncedIcon: "x" });
  });
  const fakeApi = () =>
    ({ isConfigured: () => true, submitScore: vi.fn().mockResolvedValue(undefined) }) as unknown as RankingApi & {
      submitScore: ReturnType<typeof vi.fn>;
    };

  it("極端に大きな得点(改ざんされた値など)を、そのまま送らない。上限を超える分は送らない", async () => {
    useProgressStore.setState({ totalScore: 150000 });
    useRankingStore.setState({ lastSyncedScore: 1000, lastSyncedAt: Date.now() - 60_000 });
    const api = fakeApi();
    await syncScore(api);
    const sent = api.submitScore.mock.calls[0][2] as number;
    expect(sent).toBeLessThanOrEqual(1000 + SLACK_SCORE + 60 * RATE_SCORE_PER_SEC + 20);
    expect(sent).toBeGreaterThan(1000);
  });

  it("上限まで送ったあと、時間をおかずに続けて呼んでも、上限を超えて送らない(「いまは送れない」で終わる)", async () => {
    useProgressStore.setState({ totalScore: 150000 });
    useRankingStore.setState({ lastSyncedScore: 0, lastSyncedAt: Date.now() });
    const api = fakeApi();
    await syncScore(api);
    const calls = api.submitScore.mock.calls.length;
    expect(await syncScore(api)).toBe("up-to-date");
    expect(api.submitScore.mock.calls.length).toBe(calls);
  });

  it("通常の得点(1ステージ分)は、そのまま送れる", async () => {
    useProgressStore.setState({ totalScore: 120 });
    useRankingStore.setState({ lastSyncedScore: 0, lastSyncedAt: Date.now() - 60_000 });
    const api = fakeApi();
    expect(await syncScore(api)).toBe("synced");
    expect(api.submitScore).toHaveBeenCalledWith("3a", expect.anything(), 120);
  });
});
