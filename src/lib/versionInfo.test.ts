import { describe, expect, it, vi } from "vitest";
import { checkLatestVersion } from "./versionCheck";
import { buildVersionInfo, compareVersion, DEV_COMMIT, formatBuildTimeJst, formatVersionLabel, versionJsonText } from "./versionInfo";
import { APP_VERSION_INFO, APP_VERSION_LABEL } from "./appVersion";
import { readFileSync } from "node:fs";

const info = { version: "0.9.0", commit: "abc1234", buildTime: "2026-10-23 12:34" };

describe("版の情報(バージョン・コミット・ビルド日時)", () => {
  it("ビルド日時は、日本時間の「2026-10-23 12:34」の形(実行する環境のタイムゾーンによらない。日付をまたぐ場合も)", () => {
    expect(formatBuildTimeJst(new Date("2026-10-23T03:34:56Z"))).toBe("2026-10-23 12:34");
    expect(formatBuildTimeJst(new Date("2026-10-22T15:05:00Z"))).toBe("2026-10-23 00:05");
    expect(formatBuildTimeJst(new Date("2026-12-31T15:00:00Z"))).toBe("2027-01-01 00:00");
  });

  it("設定の表示は「v0.9.0(abc1234・2026-10-23 12:34)」。コミットIDが取れないとき(開発・テスト)は「v0.9.0(dev)」", () => {
    expect(formatVersionLabel(info)).toBe("v0.9.0(abc1234・2026-10-23 12:34)");
    expect(formatVersionLabel({ ...info, commit: DEV_COMMIT })).toBe("v0.9.0(dev)");
  });

  it("コミットIDは、16進数の7〜40字だけを受け取る(改行・空・不正な値は、dev)", () => {
    const now = new Date("2026-10-23T03:34:00Z");
    expect(buildVersionInfo("0.9.0", "abc1234\n", now)).toEqual(info);
    expect(buildVersionInfo("0.9.0", undefined, now).commit).toBe("dev");
    expect(buildVersionInfo("0.9.0", "", now).commit).toBe("dev");
    expect(buildVersionInfo("0.9.0", "fatal: not a git repository", now).commit).toBe("dev");
  });

  it("version.json の中身: version・commit・buildTime の3つ", () => {
    expect(JSON.parse(versionJsonText(info))).toEqual({ version: "0.9.0", commit: "abc1234", buildTime: "2026-10-23 12:34" });
  });

  it("package.json の version が元。いま動いている版(テストでは dev)も、それと同じ", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf-8")) as { version: string };
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/); // 版を上げるたびに、このテストを書き換えなくてよいように、形だけ確かめる
    expect(APP_VERSION_INFO.version).toBe(pkg.version);
    expect(APP_VERSION_INFO.commit).toBe("dev");
    expect(APP_VERSION_LABEL).toBe(`v${pkg.version}(dev)`);
  });
});

describe("最新の版をたしかめる(version.json との比較)", () => {
  it("同じ版なら same。バージョン・コミット・ビルド日時の、どれかが違えば newer。読めなければ failed", () => {
    expect(compareVersion(info, { ...info })).toBe("same");
    expect(compareVersion(info, { ...info, version: "0.9.1" })).toBe("newer");
    expect(compareVersion(info, { ...info, commit: "def5678" })).toBe("newer");
    expect(compareVersion(info, { ...info, buildTime: "2026-10-23 13:00" })).toBe("newer");
    for (const bad of [null, undefined, "x", 3, {}, { version: "0.9.0" }, { version: 1, commit: "a", buildTime: "b" }]) expect(compareVersion(info, bad)).toBe("failed");
  });

  const respond = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as Response) as unknown as typeof fetch;

  it("version.json を、キャッシュを使わず(no-store・毎回違う ?t=)に取りに行く", async () => {
    const fetchImpl = respond({ ...info });
    expect(await checkLatestVersion(info, fetchImpl)).toBe("same");
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/^\/version\.json\?t=\d+$/);
    expect(init.cache).toBe("no-store");
  });

  it("違う版なら newer。通信できない・404・JSONでない・形が違うときは failed(例外を投げない)", async () => {
    expect(await checkLatestVersion(info, respond({ ...info, commit: "def5678" }))).toBe("newer");
    expect(await checkLatestVersion(info, vi.fn(async () => { throw new Error("offline"); }) as unknown as typeof fetch)).toBe("failed");
    expect(await checkLatestVersion(info, respond({}, false))).toBe("failed");
    expect(await checkLatestVersion(info, vi.fn(async () => ({ ok: true, json: async () => { throw new Error("not json"); } }) as unknown as Response) as unknown as typeof fetch)).toBe("failed");
    expect(await checkLatestVersion(info, respond("html"))).toBe("failed");
  });
});
