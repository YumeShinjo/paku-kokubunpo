import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * 音声素材のサンプルレートは、すべて44.1kHzにそろえる。
 * BGMは <audio> の音を、AudioContext に通して鳴らす。48kHzと44.1kHzの素材が混ざっていると、
 * iOSでは、機種や状況によって、片方が速く・高く(ピッチがずれて)鳴ることがあるため。
 * 素材は git の管理外なので、置かれていない環境(CIなど)では、何も確かめない。
 */
const SAMPLE_RATES = [
  [44100, 48000, 32000], // MPEG1
  [22050, 24000, 16000], // MPEG2
  [11025, 12000, 8000], // MPEG2.5
];

function mp3SampleRate(path: string): number | null {
  const data = readFileSync(path);
  let i = 0;
  if (data.toString("latin1", 0, 3) === "ID3") {
    i = 10 + (((data[6] & 0x7f) << 21) | ((data[7] & 0x7f) << 14) | ((data[8] & 0x7f) << 7) | (data[9] & 0x7f));
  }
  for (; i < data.length - 4; i++) {
    if (data[i] === 0xff && (data[i + 1] & 0xe0) === 0xe0) {
      const version = (data[i + 1] >> 3) & 3; // 3=MPEG1 2=MPEG2 0=MPEG2.5
      const index = (data[i + 2] >> 2) & 3;
      const table = version === 3 ? SAMPLE_RATES[0] : version === 2 ? SAMPLE_RATES[1] : SAMPLE_RATES[2];
      return index < 3 ? table[index] : null;
    }
  }
  return null;
}

describe("音声素材のサンプルレート", () => {
  const files = ["bgm", "se"].flatMap((dir) => {
    const path = `src/assets/audio/${dir}`;
    return existsSync(path)
      ? readdirSync(path)
          .filter((f) => f.endsWith(".mp3"))
          .map((f) => `${path}/${f}`)
      : [];
  });

  it("置かれているMP3は、すべて44.1kHz", () => {
    for (const file of files) expect(mp3SampleRate(file), file).toBe(44100);
  });
});
