import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMasteryStore } from "@/app/store/masteryStore";
import type { MasteryApi } from "@/lib/masteryApi";
import { hasPendingMastery, syncMastery } from "./masterySync";

function fakeApi(overrides: Partial<MasteryApi> = {}): MasteryApi & { submitCorrectCount: ReturnType<typeof vi.fn> } {
  return {
    isConfigured: () => true,
    submitCorrectCount: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as MasteryApi & { submitCorrectCount: ReturnType<typeof vi.fn> };
}

describe("累計正解数の同期(オフラインで貯めて、つながったら送る)", () => {
  beforeEach(() => {
    useMasteryStore.setState({ correctQuestionIds: [], lastSyncedCount: 0 });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("未送信の分があれば、いまの累計件数を送って、送信済みの件数を更新する", async () => {
    const api = fakeApi();
    useMasteryStore.setState({ correctQuestionIds: Array.from({ length: 120 }, (_, i) => `q${i}`), lastSyncedCount: 40 });
    expect(hasPendingMastery()).toBe(true);
    expect(await syncMastery(api)).toBe("synced");
    expect(api.submitCorrectCount).toHaveBeenCalledWith(120);
    expect(useMasteryStore.getState().lastSyncedCount).toBe(120);
    expect(hasPendingMastery()).toBe(false);
  });

  it("送るものがなければ送らない", async () => {
    const api = fakeApi();
    useMasteryStore.setState({ correctQuestionIds: Array.from({ length: 100 }, (_, i) => `q${i}`), lastSyncedCount: 100 });
    expect(await syncMastery(api)).toBe("up-to-date");
    expect(api.submitCorrectCount).not.toHaveBeenCalled();
  });

  it("設定されていなければ送らない", async () => {
    const api = fakeApi({ isConfigured: () => false });
    useMasteryStore.setState({ correctQuestionIds: ["q1"], lastSyncedCount: 0 });
    expect(await syncMastery(api)).toBe("failed");
    expect(api.submitCorrectCount).not.toHaveBeenCalled();
  });

  it("オフラインなら送らない", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const api = fakeApi();
    useMasteryStore.setState({ correctQuestionIds: ["q1"], lastSyncedCount: 0 });
    expect(await syncMastery(api)).toBe("offline");
    expect(api.submitCorrectCount).not.toHaveBeenCalled();
  });

  it("送信に失敗しても、ローカルの記録は残る(次回また送られる)", async () => {
    const api = fakeApi({ submitCorrectCount: vi.fn().mockRejectedValue(new Error("network")) });
    useMasteryStore.setState({ correctQuestionIds: ["q1"], lastSyncedCount: 0 });
    expect(await syncMastery(api)).toBe("failed");
    expect(useMasteryStore.getState().correctQuestionIds).toEqual(["q1"]);
    expect(useMasteryStore.getState().lastSyncedCount).toBe(0);
  });

  it("同時に呼ばれても、1本にまとめる", async () => {
    const api = fakeApi();
    useMasteryStore.setState({ correctQuestionIds: ["q1", "q2"], lastSyncedCount: 0 });
    const [a, b] = await Promise.all([syncMastery(api), syncMastery(api)]);
    expect(a).toBe("synced");
    expect(b).toBe("synced");
    expect(api.submitCorrectCount).toHaveBeenCalledTimes(1);
  });
});
