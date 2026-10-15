import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AUDIO_DURATION_SEC } from "@/assets/audioLevels";
import { BUFFER_MAX_BYTES, bgmMethodTable, bgmMethodTableText, decodedBytes, methodForDuration } from "./bgmPolicy";

/** 曲ごとの再生方式: デコード後のメモリ(長さ × 44100 × 2 × 4 バイト)が 36MiB 以下なら AudioBuffer、そうでなければ <audio> */
describe("BGMの再生方式(曲ごと)", () => {
  const MIB = 1024 * 1024;

  it("上限は 36MiB。メモリは、長さ × 44100 × 2チャンネル × 4バイト", () => {
    expect(BUFFER_MAX_BYTES).toBe(36 * MIB);
    expect(decodedBytes(1)).toBe(44100 * 2 * 4);
    expect(decodedBytes(85.94)).toBe(Math.round(85.94 * 352800));
  });

  it("境界: 上限ちょうどは buffer、1バイト(より長い曲)でも超えたら audio", () => {
    const limitSeconds = BUFFER_MAX_BYTES / 352800; // 約106.99秒
    expect(limitSeconds).toBeCloseTo(106.998, 3);
    expect(methodForDuration(106.99)).toBe("buffer");
    expect(methodForDuration(limitSeconds)).toBe("buffer"); // ちょうど
    expect(methodForDuration(107.0)).toBe("audio");
    expect(methodForDuration(limitSeconds + 0.01)).toBe("audio");
  });

  it("長さが分からない・おかしい曲は、audio(これまでと同じ)", () => {
    for (const bad of [undefined, 0, -1, NaN, Infinity]) expect(methodForDuration(bad as number | undefined), String(bad)).toBe("audio");
  });

  it("実際の曲: title・stage・explore・truth・各導入曲・talk は buffer。subBoss・lastBoss・kotonoha・ending は audio", () => {
    const methods = Object.fromEntries(bgmMethodTable().map((t) => [t.name.replace("bgm/", ""), t.method]));
    expect(methods).toEqual({
      title: "buffer",
      "explore-intro": "buffer",
      explore: "buffer",
      stage: "buffer",
      subBoss: "audio",
      lastBoss: "audio",
      "truth-intro": "buffer",
      truth: "buffer",
      ending: "audio",
      talk: "buffer",
      kotonoha: "audio",
    });
  });

  it("メモリの見積もり(MiB): 対象の最大は talk の約35.1MiB、audio のままの曲は約56〜69MiB", () => {
    const mib = Object.fromEntries(bgmMethodTable().map((t) => [t.name.replace("bgm/", ""), t.mib]));
    expect(mib.title).toBe(28.9);
    expect(mib.talk).toBe(35.1);
    for (const name of ["kotonoha", "lastBoss", "subBoss", "ending"]) {
      expect(mib[name], name).toBeGreaterThan(55);
      expect(mib[name], name).toBeLessThan(70);
    }
    const bufferMax = Math.max(...bgmMethodTable().filter((t) => t.method === "buffer").map((t) => t.mib));
    expect(bufferMax).toBeLessThanOrEqual(36);
  });

  it("ログの対応表(1行): 「title=buffer(28.9MiB) … ending=audio(69.1MiB)」", () => {
    const text = bgmMethodTableText();
    expect(text).toContain("title=buffer(28.9MiB)");
    expect(text).toContain("talk=buffer(35.1MiB)");
    expect(text).toContain("ending=audio(69.1MiB)");
  });

  it("ドキュメント(docs/AUDIO_INVENTORY.md)の対応表が、ここの判定と食い違わない", () => {
    const doc = readFileSync("docs/AUDIO_INVENTORY.md", "utf-8");
    for (const t of bgmMethodTable()) {
      const name = t.name.replace("bgm/", "");
      const row = doc.split("\n").find((line) => line.startsWith(`| \`${name}.mp3\``) && line.includes("| buffer |") || line.startsWith(`| \`${name}.mp3\``) && line.includes("| audio |"));
      expect(row, `${name} の行`).toBeDefined();
      expect(row, `${name}`).toContain(`| ${t.method} |`);
      expect(row, `${name}`).toContain(`${t.mib}`);
    }
  });

  it("長さの表は、置かれているMP3の実際の長さと合っている(CBRのファイルサイズと、ビットレートから。素材のない環境では、何も確かめない)", () => {
    const bitrates = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
    for (const [name, seconds] of Object.entries(AUDIO_DURATION_SEC)) {
      let data: Buffer;
      try {
        data = readFileSync(`src/assets/audio/${name}.mp3`);
      } catch {
        continue;
      }
      let i = 0;
      if (data.toString("latin1", 0, 3) === "ID3") i = 10 + (((data[6] & 0x7f) << 21) | ((data[7] & 0x7f) << 14) | ((data[8] & 0x7f) << 7) | (data[9] & 0x7f));
      while (i < data.length - 4 && !(data[i] === 0xff && (data[i + 1] & 0xe0) === 0xe0)) i++;
      const kbps = bitrates[(data[i + 2] >> 4) & 15];
      const measured = ((data.length - i) * 8) / (kbps * 1000);
      expect(Math.abs(measured - seconds), `${name}: 表 ${seconds}秒 / 実測 ${measured.toFixed(2)}秒`).toBeLessThan(0.3);
    }
  });
});
