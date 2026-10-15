import { useState, useSyncExternalStore } from "react";
import {
  clearAudioDebug,
  copyAudioDebug,
  getAudioDebugEntries,
  getAudioDebugState,
  setAudioDebugEnabled,
  subscribeAudioDebug,
} from "@/lib/audioDebug";

/**
 * 設定画面の「音のログ」の項目(スイッチ・コピー・クリア)。ふだんのプレイヤーには見えない。
 * 出すのは、`?audiodebug=1` を付けて開いたあと・バージョン表記を5回続けてタップしたあと(SettingsScreen が、revealed で決める)。
 * 使い方は、src/lib/audioDebug.ts の先頭に書いてある。
 */
export function AudioDebugPanel() {
  const { enabled } = useSyncExternalStore(subscribeAudioDebug, getAudioDebugState);
  const [message, setMessage] = useState("");

  async function handleCopy() {
    const count = getAudioDebugEntries().length;
    setMessage((await copyAudioDebug()) ? `${count}件を コピーしました` : "コピーできませんでした");
  }

  function handleClear() {
    clearAudioDebug();
    setMessage("クリアしました");
  }

  return (
    <section className="settings-section audio-debug-panel" aria-labelledby="settings-audiolog-heading">
      <h3 className="settings-heading" id="settings-audiolog-heading">音のログ</h3>
      <label className="settings-switch-row">
        <span>ログを とる</span>
        <input
          type="checkbox"
          role="switch"
          className="settings-switch"
          checked={enabled}
          onChange={(e) => {
            setAudioDebugEnabled(e.target.checked);
            setMessage(e.target.checked ? "" : "ログを とめて、空にしました");
          }}
        />
      </label>
      <div className="settings-pair">
        <button type="button" disabled={!enabled} onClick={() => void handleCopy()}>
          コピー
        </button>
        <button type="button" disabled={!enabled} onClick={handleClear}>
          クリア
        </button>
      </div>
      {message && (
        <p className="settings-note" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
