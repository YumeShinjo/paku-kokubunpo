import { useEffect, useRef, useState } from "react";
import { preloadQrReader, scanQr } from "@/features/transfer/qr";
import { Rb } from "@/components/Rb";

export type ScanError = "unsupported" | "denied" | "failed";

const SCAN_INTERVAL_MS = 150;
/** 読み取りに使う画像の大きさ(長い辺)。大きすぎると重く、小さすぎると細かいQRが読めない */
const SCAN_MAX_SIZE = 720;

/**
 * カメラで QR コードを読み取る。読み取れたら onResult に文字列を渡す(カメラは、その時点で止める)。
 * カメラが使えない・許可されないときは、onError で知らせる(手入力・写真からの読み取りは、呼び出し側に残っている)。
 * 映像は端末の中で処理するだけで、どこにも送らない。
 */
export function QrScanner({
  onResult,
  onError,
  onClose,
}: {
  onResult: (text: string) => void;
  onError: (error: ScanError) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [starting, setStarting] = useState(true);
  // 最新の関数を、読み取りのくり返しの中から呼ぶため
  const callbacks = useRef({ onResult, onError });
  callbacks.current = { onResult, onError };

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        callbacks.current.onError("unsupported");
        return;
      }
      try {
        await preloadQrReader(); // 読み取りの部品は、使うときに通信して読み込む(最初の保存には含めていない)。読み込めなければ、ここで知らせる
      } catch {
        callbacks.current.onError("failed");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      } catch (error) {
        const name = (error as { name?: string } | null)?.name;
        callbacks.current.onError(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "failed");
        return;
      }
      if (stopped) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const el = video.current;
      if (!el) return;
      el.srcObject = stream;
      el.setAttribute("playsinline", "true"); // iPhone で、全画面にならず、その場で映す
      try {
        await el.play();
      } catch {
        callbacks.current.onError("failed");
        return;
      }
      setStarting(false);

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const tick = async () => {
        if (stopped) return;
        if (context && el.videoWidth > 0) {
          const scale = Math.min(1, SCAN_MAX_SIZE / Math.max(el.videoWidth, el.videoHeight));
          canvas.width = Math.round(el.videoWidth * scale);
          canvas.height = Math.round(el.videoHeight * scale);
          context.drawImage(el, 0, 0, canvas.width, canvas.height);
          const image = context.getImageData(0, 0, canvas.width, canvas.height);
          const text = await scanQr(image.data, image.width, image.height).catch(() => null);
          if (text && !stopped) {
            stop();
            callbacks.current.onResult(text);
            return;
          }
        }
        if (!stopped) timer = setTimeout(() => void tick(), SCAN_INTERVAL_MS);
      };
      void tick();
    }

    void start();
    return stop;
  }, []);

  return (
    <div className="qr-scanner">
      <video ref={video} className="qr-scanner-video" muted playsInline />
      <p className="qr-scanner-hint">
        <Rb t={starting ? "カメラを起動[きどう]しているよ…" : "古[ふる]い端末[たんまつ]の QRコードを、枠[わく]の中[なか]に映[うつ]してね。"} />
      </p>
      <button type="button" onClick={onClose}>
        カメラを とじる
      </button>
    </div>
  );
}
