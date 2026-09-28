import { beforeEach, describe, expect, it } from "vitest";
import { useMasteryStore } from "./masteryStore";

describe("累計正解数ストア(全224問中のユニークな正解数)", () => {
  beforeEach(() => {
    useMasteryStore.setState({ correctQuestionIds: [], lastSyncedCount: 0 });
  });

  it("正解した問題を記録する", () => {
    useMasteryStore.getState().recordCorrect("q1");
    useMasteryStore.getState().recordCorrect("q2");
    expect(useMasteryStore.getState().correctQuestionIds).toEqual(["q1", "q2"]);
  });

  it("同じ問題に周回プレイで再度正解しても、2重には数えない", () => {
    useMasteryStore.getState().recordCorrect("q1");
    useMasteryStore.getState().recordCorrect("q1");
    useMasteryStore.getState().recordCorrect("q1");
    expect(useMasteryStore.getState().correctQuestionIds).toEqual(["q1"]);
  });

  it("送信済みの件数は、大きいほうを残す(古い結果で戻らない)", () => {
    useMasteryStore.getState().markSynced(50);
    useMasteryStore.getState().markSynced(30);
    expect(useMasteryStore.getState().lastSyncedCount).toBe(50);
  });
});
