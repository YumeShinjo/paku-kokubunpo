import { compareVersion, type VersionCheckResult, type VersionInfo } from "@/lib/versionInfo";

/** version.json を、キャッシュを使わずに取りに行って、いまの版と比べる。通信できない・読めないときは "failed" */
export async function checkLatestVersion(
  current: VersionInfo,
  fetchImpl: typeof fetch = fetch,
  url = "/version.json",
): Promise<VersionCheckResult> {
  try {
    const response = await fetchImpl(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return "failed";
    return compareVersion(current, await response.json());
  } catch {
    return "failed";
  }
}

/** 「最新の版をたしかめる」の結果の文(設定に出す) */
export const VERSION_CHECK_MESSAGE = {
  checking: "たしかめています…",
  same: "最新の版です",
  newer: "新しい版があります。再読み込みします",
  failed: "たしかめられませんでした",
} as const;
