import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Rb } from "@/components/Rb";
import { QrScanner, type ScanError } from "@/components/QrScanner";
import { scanQrFromFile } from "@/features/transfer/qr";
import { useNavigationStore } from "@/app/store/navigationStore";
import {
  applyTransferData,
  decodeTransferCode,
  summarize,
  transferErrorMessage,
  type TransferData,
} from "@/features/transfer/transferCode";

/**
 * 引き継ぎコードを入れて、データを復元する画面(新しい端末で開く)。
 * コードを読み取ると、まず中身の概要を見せて、「復元する」を押したときだけ、この端末のデータを上書きする。
 */
export function TransferRestoreScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<TransferData | null>(null);
  const [done, setDone] = useState(false);
  const [scanning, setScanning] = useState(false);

  async function read(text: string = input) {
    setError(null);
    try {
      setPending(await decodeTransferCode(text));
    } catch (e) {
      setPending(null);
      setError(transferErrorMessage(e));
    }
  }

  /** QRコードから読み取れた文字列。入力欄に入れて、そのまま、いつもの復元の流れ(中身の確認 → 復元)へ渡す */
  function handleScanned(text: string) {
    setScanning(false);
    setInput(text);
    void read(text);
  }

  function handleScanError(code: ScanError) {
    setScanning(false);
    setPending(null);
    setError(
      code === "denied"
        ? "カメラが使えなかったよ。カメラの許可[きょか]をたしかめてね。コードを貼[は]り付[つ]けても、復元[ふくげん]できるよ。"
        : code === "unsupported"
          ? "この端末[たんまつ]では、カメラが使[つか]えないよ。コードを貼[は]り付[つ]けてね。"
          : "カメラを起動[きどう]できなかったよ。コードを貼[は]り付[つ]けてね。",
    );
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const text = await scanQrFromFile(file);
      if (text) handleScanned(text);
      else setError("QRコードが見[み]つからなかったよ。QRコードが大[おお]きく映[うつ]った写真[しゃしん]で、もう一度[いちど]ためしてね。");
    } catch {
      setError("写真[しゃしん]を読[よ]み込[こ]めなかったよ。コードを貼[は]り付[つ]けてね。");
    }
  }

  function restore() {
    if (!pending) return;
    applyTransferData(pending);
    setPending(null);
    setInput("");
    setDone(true);
  }

  if (done) {
    return (
      <div className="screen screen-transfer">
        <h2>ふっきゅうできたよ!</h2>
        <p>
          <Rb t="進[すす]み具合[ぐあい]を、この端末[たんまつ]に移[うつ]したよ。続[つづ]きから遊[あそ]べるよ。" />
        </p>
        <button type="button" onClick={() => goTo({ name: "title" })}>
          ホームへ
        </button>
      </div>
    );
  }

  const summary = pending ? summarize(pending) : null;
  return (
    <div className="screen screen-transfer">
      <BackButton onClick={() => goTo({ name: "settings" })} />
      <h2>ひきつぎコードを いれる</h2>
      <p>
        <Rb t="古[ふる]い端末[たんまつ]で作[つく]った「ひきつぎコード」を、下[した]に貼[は]り付[つ]けてね。" />
      </p>
      <textarea
        className="transfer-code"
        rows={6}
        value={input}
        placeholder="PAKU1…"
        aria-label="ひきつぎコード"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => {
          setInput(e.target.value);
          setPending(null);
          setError(null);
        }}
      />
      {error && (
        <p className="transfer-error" role="alert">
          <Rb t={error} />
        </p>
      )}
      {!pending && (
        <button type="button" disabled={input.trim() === ""} onClick={() => void read()}>
          コードを よみとる
        </button>
      )}
      {/* 手で貼り付ける代わりに、古い端末に出した QRコードを読み取ってもよい */}
      {!pending && !scanning && (
        <div className="transfer-scan-buttons">
          <button type="button" onClick={() => setScanning(true)}>
            📷 カメラで QRコードを よみとる
          </button>
          <label className="transfer-file-button">
            🖼 写真から よみとる
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}
      {scanning && <QrScanner onResult={handleScanned} onError={handleScanError} onClose={() => setScanning(false)} />}
      {summary && (
        <div className="transfer-confirm" role="alertdialog" aria-label="復元の確認">
          <p>
            <Rb t="このコードの中身[なかみ]:" />
          </p>
          <ul>
            <li>クリアしたステージ: {summary.clearedStages}こ</li>
            <li>とくてん: {summary.score}</li>
            <li>コトの成長: {summary.growth} / 7</li>
            <li>
              <Rb t={`にがて問題[もんだい]: ${summary.starred}こ`} />
            </li>
          </ul>
          <p>
            <Rb t="この端末[たんまつ]にいまあるデータは、上書[うわが]きされるよ。復元[ふくげん]する?" />
          </p>
          <div className="quit-confirm-buttons">
            <button type="button" className="quit-yes" onClick={restore}>
              ふっきゅうする
            </button>
            <button type="button" onClick={() => setPending(null)}>
              やめる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
