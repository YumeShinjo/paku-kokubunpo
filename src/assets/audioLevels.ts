/**
 * 音声素材の音量の測定値と、そこから決めた、素材ごとのゲイン補正(dB)。
 *
 * 測定(2026-10-15。docs/AUDIO_INVENTORY.md): Chromium で MP3 をデコードして、ITU-R BS.1770 の方式(K特性フィルタ・400msのブロック・ゲート)で、
 * 全体の統合ラウドネス(LUFS)と、ピーク(dBFS)を測った。
 * 補正の決め方:
 *  - BGM: 統合ラウドネスを、-16 LUFS前後にそろえる(補正 = -16 - 測定値。0.1dB単位)。
 *  - 効果音: ピークが -1 dBFS 以下になるようにする。音を大きくはしない(補正 = 0 か、ピークを -1 dBFS にする分だけ下げる)。
 * 補正は、Web Audio のゲインの値を変えるだけ(lib/audio.ts)。再生の仕組み(停止・再開の経路)は変えない。
 * 素材を差し替えたら、同じ名前で、測定値を書き換える(補正は、ここから自動で決まる)。
 */

/** 素材の名前(registry の findAudio に渡す名前。例: "bgm/title"、"se/tap")→ 測定値 */
export const AUDIO_MEASURED: Readonly<Record<string, { lufs: number; peak: number }>> = {
  "bgm/title": { lufs: -15.7, peak: -3.3 },
  "bgm/explore-intro": { lufs: -9.2, peak: -0.5 },
  "bgm/explore": { lufs: -9.2, peak: -0.6 },
  "bgm/stage": { lufs: -7.6, peak: 0.0 },
  "bgm/subBoss": { lufs: -12.5, peak: -2.1 },
  "bgm/lastBoss": { lufs: -11.3, peak: 0.0 },
  "bgm/truth-intro": { lufs: -11.3, peak: -0.7 },
  "bgm/truth": { lufs: -11.3, peak: -0.7 },
  "bgm/ending": { lufs: -11.6, peak: 0.0 },
  "bgm/talk": { lufs: -16.1, peak: -2.4 },
  "bgm/kotonoha": { lufs: -15.9, peak: -4.2 },
  "se/tap": { lufs: -11.0, peak: -0.1 },
  "se/correct": { lufs: -14.0, peak: -0.4 },
  "se/incorrect": { lufs: -15.2, peak: -2.9 },
  "se/clear": { lufs: -11.8, peak: -0.8 },
  "se/subBossClear": { lufs: -7.8, peak: 0.0 },
  "se/lastBossClear": { lufs: -15.7, peak: -6.0 },
  "se/growth": { lufs: -15.1, peak: -3.5 },
  "se/roundEnd": { lufs: -20.1, peak: -4.9 },
  "se/bonus": { lufs: -13.9, peak: -8.6 },
  "se/pageUnlock": { lufs: -9.1, peak: 0.0 },
};

/** BGMの、そろえる音量(LUFS) */
export const BGM_TARGET_LUFS = -16;
/** 効果音の、ピークの上限(dBFS) */
export const SE_PEAK_CEILING_DB = -1;

const round1 = (x: number) => Math.round(x * 10) / 10;

/** 測定値から決めた、ゲイン補正(dB)。BGM は -16 LUFS に、効果音は ピーク -1 dBFS 以下に */
export function gainDbFor(name: string, measured: { lufs: number; peak: number }): number {
  if (name.startsWith("bgm/")) return round1(BGM_TARGET_LUFS - measured.lufs);
  // 効果音: 音は大きくしない。ピークが上限を超えるときだけ、その分(0.1dB単位で切り上げて)下げる
  const need = SE_PEAK_CEILING_DB - measured.peak;
  return need >= 0 ? 0 : Math.floor(need * 10) / 10;
}

/** 素材ごとのゲイン補正(dB)の表(測定値から決まる)。表にない素材は 0 */
export const AUDIO_GAIN_DB: Readonly<Record<string, number>> = Object.fromEntries(
  Object.entries(AUDIO_MEASURED).map(([name, m]) => [name, gainDbFor(name, m)]),
);

/** dB → 倍率 */
export const dbToGain = (db: number): number => 10 ** (db / 20);
