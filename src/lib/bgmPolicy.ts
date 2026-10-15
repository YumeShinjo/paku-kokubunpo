import { AUDIO_DURATION_SEC } from "@/assets/audioLevels";
import { bgmDurationForUrl } from "@/assets/registry";

/**
 * BGMの再生方式を、曲ごとに決める。
 *  - "buffer": fetch → decodeAudioData → AudioBufferSourceNode(loop)。曲の直前に、1回だけデコードする。アプリの切り替えからの復帰・長い連続再生でも、ピッチも時計も正常だった(実機のログ)
 *  - "audio" : <audio> 要素 → MediaElementSource。長い曲は、デコード後のメモリが大きいので、こちらのまま
 * 基準は、デコード後のメモリ(長さ × 44100 × 2チャンネル × 4バイト)が BUFFER_MAX_BYTES 以下なら "buffer"。
 * 長さが分からない曲(表にない曲)は、"audio"(これまでと同じ)。
 */

/** AudioBuffer で鳴らす曲の、デコード後のメモリの上限(バイト)。あとから変えやすいように、ここだけに書く */
export const BUFFER_MAX_BYTES = 36 * 1024 * 1024;

/** デコード後(32ビット浮動小数・ステレオ・44.1kHz)のメモリの大きさ(バイト) */
export const decodedBytes = (seconds: number): number => Math.round(seconds * 44100 * 2 * 4);

export type BgmMethod = "buffer" | "audio";

/** 長さ(秒)から、方式を決める。メモリが上限ちょうどなら、"buffer" */
export function methodForDuration(seconds: number | undefined): BgmMethod {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) return "audio";
  return decodedBytes(seconds) <= BUFFER_MAX_BYTES ? "buffer" : "audio";
}

/** 曲のファイル(URL)の方式。長さが分からなければ "audio" */
export const methodForUrl = (url: string): BgmMethod => methodForDuration(bgmDurationForUrl(url));

/** 導入曲つきの2曲は、2曲とも "buffer" のときだけ "buffer"(導入曲だけ・くり返しだけが違う方式、にはしない) */
export function methodForTracks(urls: ReadonlyArray<string | undefined>): BgmMethod {
  const known = urls.filter((u): u is string => typeof u === "string");
  return known.length > 0 && known.every((u) => methodForUrl(u) === "buffer") ? "buffer" : "audio";
}

const MIB = 1024 * 1024;

/** 曲の対応表(どの曲が buffer / audio か。メモリの見積もり つき)。ログとドキュメントに出す */
export function bgmMethodTable(): Array<{ name: string; seconds: number; mib: number; method: BgmMethod }> {
  return Object.entries(AUDIO_DURATION_SEC).map(([name, seconds]) => ({
    name,
    seconds,
    mib: Math.round((decodedBytes(seconds) / MIB) * 10) / 10,
    method: methodForDuration(seconds),
  }));
}

/** ログの1行に入れる対応表: 「title=buffer(28.9MiB) kotonoha=audio(56.6MiB) …」 */
export function bgmMethodTableText(): string {
  return bgmMethodTable()
    .map((t) => `${t.name.replace(/^bgm\//, "")}=${t.method}(${t.mib}MiB)`)
    .join(" ");
}
