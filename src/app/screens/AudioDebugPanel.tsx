import { useState, useSyncExternalStore } from "react";
import {
  clearAudioDebug,
  copyAudioDebug,
  getAudioDebugEntries,
  getAudioDebugState,
  markAudioDebug,
  setAudioDebugEnabled,
  setAudioDebugFull,
  setAudioExperiment,
  subscribeAudioDebug,
} from "@/lib/audioDebug";

/**
 * 設定画面の「音のログ」の項目(スイッチ・コピー・クリア)。ふだんのプレイヤーには見えない。
 * 出すのは、`?audiodebug=1` を付けて開いたあと・バージョン表記を5回続けてタップしたあと(SettingsScreen が、revealed で決める)。
 * 使い方は、src/lib/audioDebug.ts の先頭に書いてある。
 */
export function AudioDebugPanel() {
  const { enabled, full, rebuild, bufferOff } = useSyncExternalStore(subscribeAudioDebug, getAudioDebugState);
  const [message, setMessage] = useState("");

  async function handleCopy() {
    const count = getAudioDebugEntries().length;
    setMessage((await copyAudioDebug()) ? `${count}件を コピーしました` : "コピーできませんでした");
  }

  // 「いま高い」: 高いピッチが聞こえたその瞬間に押す。3つの時計などを MARK の行で記録する
  function handleMark() {
    setMessage(markAudioDebug() ? "きろくしました" : "");
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
      <label className="settings-switch-row">
        <span>ぜんぶ きろく(約2秒ごと)</span>
        <input
          type="checkbox"
          role="switch"
          className="settings-switch"
          checked={full}
          disabled={!enabled}
          onChange={(e) => setAudioDebugFull(e.target.checked)}
        />
      </label>
      {enabled && (
        <>
          {/* ピッチ異常の対策を試す、2つのスイッチ(ふだんはオフ。オンのあいだだけ、その処理が働く) */}
          <label className="settings-switch-row">
            <span>A 復帰で作り直す</span>
            <input
              type="checkbox"
              role="switch"
              className="settings-switch"
              checked={rebuild}
              onChange={(e) => setAudioExperiment("rebuild", e.target.checked)}
            />
          </label>
          {/* 短い曲は、ふだん AudioBuffer で鳴らす。不具合のときの逃げ道: オンにすると、すべて <audio> 方式 */}
          <label className="settings-switch-row">
            <span>B無効(audio方式)</span>
            <input
              type="checkbox"
              role="switch"
              className="settings-switch"
              checked={bufferOff}
              onChange={(e) => setAudioExperiment("bufferOff", e.target.checked)}
            />
          </label>
          <button type="button" className="audio-debug-mark" onClick={handleMark}>
            いま高い
          </button>
        </>
      )}
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
