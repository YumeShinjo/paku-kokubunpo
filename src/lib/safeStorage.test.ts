import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage, useStorageStatus } from "./safeStorage";

describe("端末への保存(safeStorage)", () => {
  beforeEach(() => {
    localStorage.clear();
    useStorageStatus.setState({ saveFailed: false, dismissed: false });
  });
  afterEach(() => vi.restoreAllMocks());

  const makeStore = (name: string) =>
    create<{ n: number; inc: () => void }>()(
      persist((set) => ({ n: 0, inc: () => set((s) => ({ n: s.n + 1 })) }), { name, storage: safeJSONStorage }),
    );

  it("保存できるときは、これまでどおり保存され、再読み込み後も残る", () => {
    const store = makeStore("t-ok");
    store.getState().inc();
    expect(JSON.parse(localStorage.getItem("t-ok")!).state.n).toBe(1);
    expect(useStorageStatus.getState().saveFailed).toBe(false);
  });

  it("容量いっぱい等で保存に失敗しても、例外を投げず(ゲームが止まらず)、メモリ上の進み具合は続く。「保存できていない」と知らせる", () => {
    const store = makeStore("t-full");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    expect(() => store.getState().inc()).not.toThrow();
    expect(store.getState().n).toBe(1);
    expect(useStorageStatus.getState().saveFailed).toBe(true);
  });

  it("あとで保存できるようになったら、お知らせは自動でなくなる", () => {
    const store = makeStore("t-recover");
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    store.getState().inc();
    expect(useStorageStatus.getState().saveFailed).toBe(true);
    spy.mockRestore();
    store.getState().inc();
    expect(useStorageStatus.getState().saveFailed).toBe(false);
  });

  it("保存されていた内容が壊れていても、落ちずに最初の状態で始まり、壊れた内容は別のキーへ退避される", async () => {
    localStorage.setItem("t-broken", "{not json");
    const store = makeStore("t-broken");
    await store.persist.rehydrate();
    expect(store.getState().n).toBe(0);
    expect(localStorage.getItem("t-broken:corrupt")).toBe("{not json");
  });

  it("保存の領域そのものが使えなくても(読み込みが例外)、落ちない", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const store = makeStore("t-denied");
    await expect(store.persist.rehydrate()).resolves.not.toThrow();
    expect(store.getState().n).toBe(0);
  });
});
