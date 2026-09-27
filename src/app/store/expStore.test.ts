import { beforeEach, describe, expect, it } from "vitest";
import { useExpStore } from "./expStore";

describe("経験値ストア", () => {
  beforeEach(() => {
    useExpStore.setState({ totalExp: 0, lastSyncedExp: 0 });
  });

  it("経験値を加算できる(累計は減らない)", () => {
    useExpStore.getState().addExp(10);
    useExpStore.getState().addExp(5);
    expect(useExpStore.getState().totalExp).toBe(15);
  });

  it("0以下の量は加算しない・小数は切り捨てる", () => {
    useExpStore.getState().addExp(0);
    useExpStore.getState().addExp(-5);
    useExpStore.getState().addExp(2.9);
    expect(useExpStore.getState().totalExp).toBe(2);
  });

  it("送信済みの累計は、大きいほうを残す(古い結果で戻らない)", () => {
    useExpStore.getState().markSynced(50);
    useExpStore.getState().markSynced(30);
    expect(useExpStore.getState().lastSyncedExp).toBe(50);
  });
});
