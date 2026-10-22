import { describe, expect, it } from "vitest";
import { AUDIO_GAIN_DB, AUDIO_MEASURED, AUDIO_TRIM_DB, BGM_TARGET_LUFS, SE_PEAK_CEILING_DB, dbToGain, gainDbFor } from "./audioLevels";
import { BGM_SCENES, bgmGainForUrl, findAudio, seGain } from "./registry";

describe("音量の補正(素材ごとのゲイン)", () => {
  it("BGMは、補正のあと、-16 LUFS前後(±0.1dB)にそろう", () => {
    for (const [name, m] of Object.entries(AUDIO_MEASURED).filter(([n]) => n.startsWith("bgm/"))) {
      expect(m.lufs + AUDIO_GAIN_DB[name], name).toBeCloseTo(BGM_TARGET_LUFS, 0);
      expect(Math.abs(m.lufs + AUDIO_GAIN_DB[name] - BGM_TARGET_LUFS), name).toBeLessThanOrEqual(0.05 + 1e-9);
    }
  });

  it("効果音は、補正のあと、ピークが -1 dBFS 以下。音を大きくする補正はない", () => {
    for (const [name, m] of Object.entries(AUDIO_MEASURED).filter(([n]) => n.startsWith("se/"))) {
      expect(AUDIO_GAIN_DB[name], name).toBeLessThanOrEqual(0);
      expect(m.peak + AUDIO_GAIN_DB[name], name).toBeLessThanOrEqual(SE_PEAK_CEILING_DB + 1e-9);
    }
  });

  it("補正の値の例(補正の一覧は docs/AUDIO_INVENTORY.md)", () => {
    expect(AUDIO_GAIN_DB["bgm/stage"]).toBe(-8.4);
    expect(AUDIO_GAIN_DB["bgm/talk"]).toBe(0.1);
    expect(AUDIO_GAIN_DB["se/subBossPurify"]).toBe(-3); // 測定値からは補正なし(ピーク -2.2)。聴感で -3dB(AUDIO_TRIM_DB)
    expect(AUDIO_GAIN_DB["se/correct"]).toBe(-0.6);
    expect(AUDIO_GAIN_DB["se/roundEnd"]).toBe(0);
    expect(gainDbFor("se/x", { lufs: -10, peak: -0.35 })).toBe(-0.7); // 0.65下げる必要 → 0.1dB単位で下げる側に丸める
  });

  it("dB → 倍率", () => {
    expect(dbToGain(0)).toBe(1);
    expect(dbToGain(-6.0206)).toBeCloseTo(0.5, 3);
  });

  it("効果音の種類ごとのゲイン: subBossClear(称号の授与)は専用のファイルを持たず、subBossPurify の補正を使う。表にないものは 1", () => {
    expect(seGain("subBossPurify")).toBeCloseTo(dbToGain(-3), 6);
    expect(seGain("subBossClear")).toBeCloseTo(dbToGain(-3), 6);
    expect(seGain("roundEnd")).toBe(1);
    expect(seGain("nothing")).toBe(1);
  });

  it("BGMのファイル(URL)から、その曲の補正を引ける(置かれている曲だけ)。引けなければ 1", () => {
    expect(bgmGainForUrl(undefined)).toBe(1);
    expect(bgmGainForUrl("/not-found.mp3")).toBe(1);
    for (const scene of BGM_SCENES) {
      const url = findAudio(`bgm/${scene}`);
      if (url) expect(bgmGainForUrl(url), scene).toBeCloseTo(dbToGain(AUDIO_GAIN_DB[`bgm/${scene}`] ?? 0), 6);
    }
  });

  it("聴感の補正(AUDIO_TRIM_DB)を足しても、効果音のピークは -1 dBFS 以下。キラキラの音(subBossPurify)は、統合ラウドネスが、ステージクリア音と正解音のあいだになる", () => {
    for (const name of Object.keys(AUDIO_TRIM_DB)) {
      expect(AUDIO_TRIM_DB[name], name).toBeLessThanOrEqual(0);
      expect(AUDIO_MEASURED[name].peak + AUDIO_GAIN_DB[name], name).toBeLessThanOrEqual(SE_PEAK_CEILING_DB);
    }
    const loudness = (name: string) => AUDIO_MEASURED[name].lufs + AUDIO_GAIN_DB[name];
    expect(loudness("se/subBossPurify")).toBeLessThan(loudness("se/clear"));
    expect(loudness("se/subBossPurify")).toBeGreaterThan(loudness("se/correct"));
  });

  it("測定した素材は、BGM11ファイル・効果音10ファイル(docs/AUDIO_INVENTORY.md と同じ)", () => {
    const names = Object.keys(AUDIO_MEASURED);
    expect(names.filter((n) => n.startsWith("bgm/"))).toHaveLength(11);
    expect(names.filter((n) => n.startsWith("se/"))).toHaveLength(10);
  });
});
