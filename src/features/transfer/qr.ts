import qrcode from "qrcode-generator";

/**
 * 引き継ぎコードの QR コード(表示と読み取り)。どちらも端末の中だけで行い、サーバーは使わない。
 *  - 表示: qrcode-generator(MIT License)で、コードの文字列から、QRの点の並びを作る
 *  - 読み取り: jsQR(Apache-2.0)。ふつうの QR コードの読み取りなので、カメラで映した画面・写真から読める
 * 読み取り側(jsQR)は、重いので、使うときに初めて読み込む。
 */

/** QRコードの点の並び(true=黒)。長すぎて QR にできないときは null */
export function buildQrMatrix(text: string): boolean[][] | null {
  try {
    // 誤り訂正は最小(L)。コードの長さに合わせて、大きさ(型番)は自動で決まる
    const qr = qrcode(0, "L");
    qr.addData(text, "Byte");
    qr.make();
    const size = qr.getModuleCount();
    return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => qr.isDark(row, col)));
  } catch {
    return null;
  }
}

/** 黒い点を、1本の SVG パス(1点=1×1の四角)にする。まわりの余白は、呼び出し側の viewBox で取る */
export function matrixToPath(matrix: boolean[][]): string {
  let d = "";
  matrix.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x++;
        continue;
      }
      let end = x;
      while (end < row.length && row[end]) end++;
      d += `M${x} ${y}h${end - x}v1h${-(end - x)}z`; // 横に続く黒い点は、1つの長方形にまとめる
      x = end;
    }
  });
  return d;
}

/** 点の並びを、画像(RGBA)にする。scale=1点あたりの画素数、quiet=まわりの余白(点の数。QRの規格は4) */
export function matrixToImageData(matrix: boolean[][], scale: number, quiet = 4) {
  const size = (matrix.length + quiet * 2) * scale;
  const data = new Uint8ClampedArray(size * size * 4).fill(255);
  matrix.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (!dark) return;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = (((y + quiet) * scale + dy) * size + (x + quiet) * scale + dx) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
    }),
  );
  return { data, width: size, height: size };
}

/** 読み取りの部品(jsQR)を、先に読み込んでおく。読み込めない(オフラインなど)ときは、例外を投げる */
export function preloadQrReader(): Promise<unknown> {
  return import("jsqr");
}

/** 画像から QR コードを読み取る。読めなければ null */
export async function scanQr(data: Uint8ClampedArray, width: number, height: number): Promise<string | null> {
  const { default: jsQR } = await import("jsqr");
  const result = jsQR(data, width, height, { inversionAttempts: "dontInvert" });
  return result ? result.data : null;
}

/** 写真(画像ファイル)から QR コードを読み取る。カメラが使えないときの代わり */
export async function scanQrFromFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return scanQr(image.data, image.width, image.height);
}
