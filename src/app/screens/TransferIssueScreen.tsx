import { useEffect, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Rb } from "@/components/Rb";
import { QrCode } from "@/components/QrCode";
import { useNavigationStore } from "@/app/store/navigationStore";
import { collectTransferData, encodeTransferCode, summarize } from "@/features/transfer/transferCode";

/** 引き継ぎコードを発行する画面(機種変更・アプリの入れ直しの前に、古い端末で開く) */
export function TransferIssueScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<"done" | "failed" | null>(null);
  const summary = summarize(collectTransferData());

  useEffect(() => {
    let alive = true;
    encodeTransferCode().then(
      (c) => alive && setCode(c),
      () => alive && setError(true),
    );
    return () => {
      alive = false;
    };
  }, []);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied("done");
    } catch {
      // クリップボードが使えないとき: 文字を選択状態にして、手でコピーしてもらう
      const box = document.querySelector<HTMLTextAreaElement>(".transfer-code");
      box?.focus();
      box?.select();
      setCopied("failed");
    }
  }

  return (
    <div className="screen screen-transfer">
      <BackButton onClick={() => goTo({ name: "settings" })} />
      <h2>ひきつぎコードを つくる</h2>
      <p>
        <Rb t="いまの進[すす]み具合[ぐあい](クリアしたステージ・得点[とくてん]・コトの成長[せいちょう]など)を、コードにするよ。新[あたら]しい端末[たんまつ]で「ひきつぎコードを入[い]れる」を開[ひら]いて、このコードを貼[は]り付[つ]けてね。" />
      </p>
      <p className="transfer-summary">
        <Rb
          t={`クリアしたステージ ${summary.clearedStages}こ / とくてん ${summary.score} / にがて問題[もんだい] ${summary.starred}こ`}
        />
      </p>
      {error && (
        <p className="transfer-error" role="alert">
          <Rb t="コードを作[つく]れなかったよ。あとで、もう一度[いちど]ためしてね。" />
        </p>
      )}
      {!error && (
        <textarea
          className="transfer-code"
          readOnly
          rows={6}
          value={code ?? "つくっているよ…"}
          aria-label="ひきつぎコード"
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
      <button type="button" disabled={!code} onClick={() => void copy()}>
        コードを コピーする
      </button>
      {/* QRコード: 新しい端末で、カメラで読み取れる(コピーして送る代わり。同じコード) */}
      {code && (
        <div className="transfer-qr">
          <p>
            <Rb t="または、新[あたら]しい端末[たんまつ]の「ひきつぎコードを入[い]れる」で、この QRコードをカメラで読[よ]み取[と]ってね。" />
          </p>
          <QrCode text={code} label="ひきつぎコードの QRコード" />
        </div>
      )}
      {copied === "done" && (
        <p role="status">
          <Rb t="コピーしたよ!メモやメッセージに貼[は]り付[つ]けて、新[あたら]しい端末[たんまつ]へ送[おく]ってね。" />
        </p>
      )}
      {copied === "failed" && (
        <p role="status">
          <Rb t="自動[じどう]でコピーできなかったよ。上[うえ]の文字[もじ]を選[えら]んだ状態[じょうたい]にしたので、コピーしてね。" />
        </p>
      )}
      <p className="settings-note">
        <Rb t="⚠ このコードは、あなたのデータそのものだよ。ほかの人[ひと]には見[み]せないでね。ランキングの参加[さんか]は引[ひ]き継[つ]がれないので、新[あたら]しい端末[たんまつ]でもう一度[いちど]クラスに入[はい]ってね(得点[とくてん]は続[つづ]きから)。" />
      </p>
    </div>
  );
}
