import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRankingStore } from "@/app/store/rankingStore";
import { RankingError } from "@/lib/rankingApi";
import { KEPT_KEYS, reloadApp, resetAllData } from "./resetData";

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
    for (const key of [...GAME_KEYS, "paku-kokubunpo:settings"]) localStorage.setItem(key, '{"state":{}}');
    localStorage.setItem("other-app:data", "1"); // このアプリのものではないデータ
  });

  it("ゲームのデータと、音量・ミュートの設定をすべて消して最初の状態に戻す。他のアプリのデータは残す", async () => {
    const api = { leaveClass: vi.fn() };
    const result = await resetAllData(api);
    for (const key of GAME_KEYS) expect(localStorage.getItem(key), key).toBeNull();
    expect(localStorage.getItem("paku-kokubunpo:settings")).toBeNull();
    expect(localStorage.getItem("other-app:data")).toBe("1");
    expect(result.removedKeys.sort()).toEqual([...GAME_KEYS, "paku-kokubunpo:settings"].sort());
    expect(KEPT_KEYS).toEqual([]);
  });

  it("ミュートや音量0で初期化しても、初期化のあとの設定は既定(ミュートなし・既定の音量)に戻る(BGMが鳴らない状態を持ち越さない)", async () => {
    localStorage.setItem("paku-kokubunpo:settings", JSON.stringify({ state: { bgmVolume: 0, seVolume: 0, muted: true }, version: 0 }));
    await resetAllData({ leaveClass: vi.fn() });
    // 再読み込み後は、保存された設定がないので、ストアは既定値(bgmVolume 0.7 / seVolume 0.8 / muted false)で始まる
    expect(localStorage.getItem("paku-kokubunpo:settings")).toBeNull();
  });

  it("画面を読み込み直す前に、音の後始末(BGMを止める・AudioContextを閉じる)をする", () => {
    const order: string[] = [];
    reloadApp(() => order.push("reload"));
    expect(order).toEqual(["reload"]);
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
