/**
 * アプリの版の情報。ビルドのたびに、vite.config.ts が作って、画面(設定)と version.json に、同じ値を入れる。
 * 元になるのは、package.json の version(バージョン)・git の短いコミットID・ビルドした日時(日本時間)。
 * 開発サーバー・テストでは、コミットIDが取れないので、commit は "dev"(表示は「v0.9.0(dev)」)。
 */
export interface VersionInfo {
  /** package.json の version(例: "0.9.0") */
  version: string;
  /** git の短いコミットID(例: "abc1234")。取れなければ "dev" */
  commit: string;
  /** ビルドした日時(日本時間。"2026-10-23 12:34") */
  buildTime: string;
}

/** コミットIDが取れない(開発サーバー・テスト・git がない環境)ときの値 */
export const DEV_COMMIT = "dev";

const pad = (n: number): string => String(n).padStart(2, "0");

/** 日時を、日本時間の "2026-10-23 12:34" の形にする(実行する環境のタイムゾーンによらない) */
export function formatBuildTimeJst(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000); // UTC に 9 時間を足して、UTC の読み方で取り出す
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
}

export function buildVersionInfo(version: string, commit: string | undefined, now: Date): VersionInfo {
  const trimmed = (commit ?? "").trim();
  return { version, commit: /^[0-9a-f]{7,40}$/i.test(trimmed) ? trimmed : DEV_COMMIT, buildTime: formatBuildTimeJst(now) };
}

/** 設定の表示: 「v0.9.0(abc1234・2026-10-23 12:34)」。開発・テストでは「v0.9.0(dev)」 */
export function formatVersionLabel(info: VersionInfo): string {
  return info.commit === DEV_COMMIT ? `v${info.version}(${DEV_COMMIT})` : `v${info.version}(${info.commit}・${info.buildTime})`;
}

/** public の version.json の中身 */
export function versionJsonText(info: VersionInfo): string {
  return `${JSON.stringify({ version: info.version, commit: info.commit, buildTime: info.buildTime }, null, 2)}\n`;
}

export type VersionCheckResult = "same" | "newer" | "failed";

/** version.json(取得した中身)と、いま動いている版を比べる。同じなら "same"、違えば "newer"、読めなければ "failed" */
export function compareVersion(current: VersionInfo, latest: unknown): VersionCheckResult {
  if (typeof latest !== "object" || latest === null) return "failed";
  const { version, commit, buildTime } = latest as Record<string, unknown>;
  if (typeof version !== "string" || typeof commit !== "string" || typeof buildTime !== "string") return "failed";
  return version === current.version && commit === current.commit && buildTime === current.buildTime ? "same" : "newer";
}
