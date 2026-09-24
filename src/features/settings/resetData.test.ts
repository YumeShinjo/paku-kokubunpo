import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRankingStore } from "@/app/store/rankingStore";
import { RankingError } from "@/lib/rankingApi";
import { KEPT_KEYS, resetAllData } from "./resetData";

const GAME_KEYS = [
  "paku-kokubunpo:progress",
  "paku-kokubunpo:review",
  "paku-kokubunpo:mascot",
  "paku-kokubunpo:story",
  "paku-kokubunpo:stats",
  "paku-kokubunpo:tutorial",
  "paku-kokubunpo:session",
  "paku-kokubunpo:ranking",
  "paku-kokubunpo:profile",
];

describe("データの初期化", () => {
  beforeEach(() => {
    localStorage.clear();
    useRankingStore.setState({ classCode: null, nickname: null, lastSyncedScore: 0, syncedIcon: null });
    for (const key of [...GAME_KEYS, ...KEPT_KEYS]) localStorage.setItem(key, '{"state":{}}');
    localStorage.setItem("other-app:data", "1"); // このアプリのものではないデータ
  });

  it("ゲームのデータをすべて消す。音量・ミュートの設定と、他のアプリのデータは残す", async () => {
    const api = { leaveClass: vi.fn() };
    const result = await resetAllData(api);
    for (const key of GAME_KEYS) expect(localStorage.getItem(key), key).toBeNull();
    expect(localStorage.getItem("paku-kokubunpo:settings")).not.toBeNull();
    expect(localStorage.getItem("other-app:data")).toBe("1");
    expect(result.removedKeys.sort()).toEqual([...GAME_KEYS].sort());
  });

  it("ランキングに参加していなければ、通信しない", async () => {
    const api = { leaveClass: vi.fn() };
    expect((await resetAllData(api)).ranking).toBe("not-joined");
    expect(api.leaveClass).not.toHaveBeenCalled();
  });

  it("ランキング参加中は、先にクラスから抜けて(自分の順位データを消して)から、端末のデータを消す", async () => {
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 50, syncedIcon: "mint-circle" });
    const order: string[] = [];
    const api = {
      leaveClass: vi.fn(async () => {
        order.push(`leave(残っているキー: ${localStorage.getItem("paku-kokubunpo:progress") ? "あり" : "なし"})`);
      }),
    };
    const result = await resetAllData(api);
    expect(api.leaveClass).toHaveBeenCalledWith("3a");
    expect(order).toEqual(["leave(残っているキー: あり)"]);
    expect(result.ranking).toBe("left");
    expect(localStorage.getItem("paku-kokubunpo:progress")).toBeNull();
  });

  it("通信できずクラスから抜けられなくても、端末のデータは初期化する(結果は failed で知らせる)", async () => {
    useRankingStore.setState({ classCode: "3a", nickname: "たろう" });
    const api = { leaveClass: vi.fn().mockRejectedValue(new RankingError("offline")) };
    const result = await resetAllData(api);
    expect(result.ranking).toBe("failed");
    for (const key of GAME_KEYS) expect(localStorage.getItem(key), key).toBeNull();
  });
});
