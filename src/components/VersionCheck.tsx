import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { APP_VERSION_INFO } from "@/lib/appVersion";
import { checkLatestVersion, VERSION_CHECK_MESSAGE } from "@/lib/versionCheck";
import type { VersionInfo } from "@/lib/versionInfo";
import { reloadApp } from "@/features/settings/resetData";
import { prepareServiceWorkerUpdate } from "@/features/settings/versionUpdate";

type Status = "idle" | "checking" | "same" | "newer" | "failed";

interface Props {
  /** いま動いている版(テストで差し替える) */
  current?: VersionInfo;
  /** version.json の取得(テストで差し替える) */
  fetchImpl?: typeof fetch;
  /** 新しい版があったときの、更新の準備と、読み込み直し(テストで差し替える) */
  applyUpdate?: () => Promise<void>;
  className?: string;
}

/** 「新しい版があります」の文を読めるよう、読み込み直すまでに、最低これだけ待つ(ミリ秒) */
const MIN_MESSAGE_MS = 1200;

const defaultApplyUpdate = async () => {
  // Service Worker に、新しい版を取りに行かせる(最長4秒待つ)。文を読む時間のぶんは、最低でも待つ
  await Promise.all([prepareServiceWorkerUpdate(), new Promise<void>((resolve) => setTimeout(resolve, MIN_MESSAGE_MS))]);
  reloadApp(); // 読み込み直す
};

/**
 * 設定の「最新の版をたしかめる」。version.json(いつも通信して取る)を、いま動いている版と比べて、
 * 同じなら「最新の版です」、違えば「新しい版があります。再読み込みします」と出して、再読み込みする。
 * 通信できないときは「たしかめられませんでした」。押しても、ほかの動作には影響しない。
 */
export function VersionCheck({ current = APP_VERSION_INFO, fetchImpl, applyUpdate = defaultApplyUpdate, className }: Props) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleCheck() {
    if (status === "checking") return;
    setStatus("checking");
    const result = await checkLatestVersion(current, fetchImpl);
    setStatus(result);
    if (result === "newer") await applyUpdate();
  }

  return (
    <>
      <button type="button" className={className} onClick={() => void handleCheck()} disabled={status === "checking"} aria-busy={status === "checking"}>
        <span>最新の版をたしかめる</span>
        <RefreshCw aria-hidden="true" size={18} />
      </button>
      <p className="settings-note settings-note-line version-check-status" role="status" aria-live="polite">
        {status === "idle" ? "" : VERSION_CHECK_MESSAGE[status]}
      </p>
    </>
  );
}
