import { useMemo } from "react";
import { buildQrMatrix, matrixToPath } from "@/features/transfer/qr";

/** 文字列を QR コードとして表示する(白い地に黒。まわりに規格どおりの余白をとる)。長すぎて作れないときは何も出さない */
export function QrCode({ text, label }: { text: string; label: string }) {
  const matrix = useMemo(() => buildQrMatrix(text), [text]);
  if (!matrix) return null;
  const quiet = 4;
  const size = matrix.length + quiet * 2;
  return (
    <svg
      className="qr-code"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="#fff" />
      <path d={matrixToPath(matrix)} transform={`translate(${quiet} ${quiet})`} fill="#000" />
    </svg>
  );
}
