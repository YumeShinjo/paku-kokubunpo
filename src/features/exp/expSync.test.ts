import { beforeEach, describe, expect, it, vi } from "vitest";
import { useExpStore } from "@/app/store/expStore";
import type { ExpApi } from "@/lib/expApi";
import { hasPendingExp, syncExp } from "./expSync";

function fakeApi(overrides: Partial<ExpApi> = {}): ExpApi & { submitExp: ReturnType<typeof vi.fn> } {
  return {
    isConfigured: () => true,
    submitExp: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as ExpApi & { submitExp: ReturnType<typeof vi.fn> };
}

describe("経験値の同期(オフラインで貯めて、つながったら送る)", () => {
  beforeEach(() => {
    useExpStore.setState({ totalExp: 0, lastSyncedExp: 0 });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("未送信の分があれば、いまの累計を送って、送信済みの累計を更新する", async () => {
    const api = fakeApi();
    useExpStore.setState({ totalExp: 120, lastSyncedExp: 40 });
    expect(hasPendingExp()).toBe(true);
    expect(await syncExp(api)).toBe("synced");
    expect(api.submitExp).toHaveBeenCalledWith(120);
    expect(useExpStore.getState().lastSyncedExp).toBe(120);
    expect(hasPendingExp()).toBe(false);
  });

  it("送るものがなければ送らない", async () => {
    const api = fakeApi();
    useExpStore.setState({ totalExp: 100, lastSyncedExp: 100 });
    expect(await syncExp(api)).toBe("up-to-date");
    expect(api.submitExp).not.toHaveBeenCalled();
  });

  it("設定されていなければ送らない", async () => {
    const api = fakeApi({ isConfigured: () => false });
    useExpStore.setState({ totalExp: 50, lastSyncedExp: 0 });
    expect(await syncExp(api)).toBe("failed");
    expect(api.submitExp).not.toHaveBeenCalled();
  });

  it("オフラインなら送らない", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const api = fakeApi();
    useExpStore.setState({ totalExp: 50, lastSyncedExp: 0 });
    expect(await syncExp(api)).toBe("offline");
    expect(api.submitExp).not.toHaveBeenCalled();
  });

  it("送信に失敗しても、ローカルの経験値は残る(次回また送られる)", async () => {
    const api = fakeApi({ submitExp: vi.fn().mockRejectedValue(new Error("network")) });
    useExpStore.setState({ totalExp: 50, lastSyncedExp: 0 });
    expect(await syncExp(api)).toBe("failed");
    expect(useExpStore.getState().totalExp).toBe(50);
    expect(useExpStore.getState().lastSyncedExp).toBe(0);
  });

  it("同時に呼ばれても、1本にまとめる", async () => {
    const api = fakeApi();
    useExpStore.setState({ totalExp: 30, lastSyncedExp: 0 });
    const [a, b] = await Promise.all([syncExp(api), syncExp(api)]);
    expect(a).toBe("synced");
    expect(b).toBe("synced");
    expect(api.submitExp).toHaveBeenCalledTimes(1);
  });
});
