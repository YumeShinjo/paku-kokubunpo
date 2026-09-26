import { describe, expect, it } from "vitest";
import { getAllQuestions } from "@/data/questionLoader";
import { storyEvents } from "@/data/story/events";
import { playableAreas } from "@/data/areas";
import { getStagesForArea } from "@/data/stages";
import { useProgressStore } from "@/app/store/progressStore";
import {
  TransferError,
  checksum,
  collectTransferData,
  decodeTransferCode,
  encodeTransferCode,
  encodeTransferCodeV1,
  toBase64Url,
  type TransferData,
} from "./transferCode";
import { fingerprint, fingerprintCollisions, knownIds } from "./transferV2";

function fullData(): TransferData {
  const stages = playableAreas.flatMap((a) => getStagesForArea(a.id));
  const questions = getAllQuestions();
  const choiceEvent = storyEvents.find((e) => e.choice);
  return {
    cleared: stages.map((s) => s.id),
    score: 45230,
    growth: 7,
    seen: storyEvents.map((e) => e.id),
    choices: choiceEvent ? { [choiceEvent.id]: choiceEvent.choice!.options[0].key } : {},
    starred: questions.slice(0, 60).map((q) => q.id),
    recent: questions.slice(0, 20).map((q) => q.id),
    unitRecent: Object.fromEntries([...new Set(questions.map((q) => q.unit))].map((u) => [u, "1011011101"])),
    guides: ["sorting", "assembly", "choice", "tapInSentence", "zukan"],
    icon: "gold-star",
  };
}

describe("引き継ぎコード 版2(指紋)", () => {
  it("同じ種類のidどうしで、指紋がぶつかっていない(ぶつかると、別のidに復元されてしまう)", () => {
    const ids = knownIds();
    for (const [kind, list] of Object.entries(ids)) {
      expect(fingerprintCollisions(list), `${kind} の指紋がぶつかっている`).toEqual([]);
    }
  });

  it("指紋の計算は変わらない(変えると、以前のコードが読めなくなる)", () => {
    // FNV-1a 32bit の既知の値(空文字=0x811c9dc5、"a"=0xe40c292c)の下位24ビット
    expect(fingerprint("")).toBe(0x811c9dc5 & 0xffffff);
    expect(fingerprint("a")).toBe(0xe40c292c & 0xffffff);
  });

  it("全部を遊び終えたデータでも、約1000文字。QRコード(1つ)に収まる長さ", async () => {
    const code = await encodeTransferCode(fullData());
    expect(code.startsWith("PAKU2R.")).toBe(true);
    expect(code.length).toBeLessThan(1500);
  });

  it("コード → 復元で、内容がそっくり戻る", async () => {
    const data = fullData();
    expect(await decodeTransferCode(await encodeTransferCode(data))).toEqual(data);
  });

  it("以前の版(版1)のコードも、引き続き読める", async () => {
    const data = fullData();
    const v1 = await encodeTransferCodeV1(data);
    expect(v1.startsWith("PAKU1")).toBe(true);
    expect(await decodeTransferCode(v1)).toEqual(data);
  });

  it("アプリの一覧に無いid(データの更新で消えたもの)は、飛ばして復元する。ほかは、そのまま戻る", async () => {
    const first = getAllQuestions()[0].id;
    const data = { ...fullData(), cleared: ["prologue-stage1", "removed-stage"], starred: [first, "removed-question"] };
    const back = await decodeTransferCode(await encodeTransferCode(data));
    expect(back.cleared).toEqual(["prologue-stage1"]);
    expect(back.starred).toEqual([first]);
  });

  it("途中で切れた・でたらめな中身・個数が異常に大きいコードは、壊れているとして断る", async () => {
    const good = await encodeTransferCode(fullData());
    const [head, payload] = good.split(".");
    const forge = (bytes: number[]) => {
      const p = toBase64Url(Uint8Array.from(bytes));
      return `${head}.${p}.${checksum(p)}`;
    };
    const cut = payload.slice(0, Math.floor(payload.length / 2));
    await expect(decodeTransferCode(`${head}.${cut}.${checksum(cut)}`)).rejects.toBeInstanceOf(TransferError);
    await expect(decodeTransferCode(forge([]))).rejects.toBeInstanceOf(TransferError);
    await expect(decodeTransferCode(forge([1, 2, 3, 4, 5]))).rejects.toBeInstanceOf(TransferError);
    await expect(decodeTransferCode(forge([0, 0, 1, 2, 3, 0xff, 0xff, 0xff, 0xff, 0x0f]))).rejects.toBeInstanceOf(TransferError);
  });

  it("いまの端末のデータからでも発行できて、内容が同じ", async () => {
    useProgressStore.setState({ totalScore: 4321 });
    const code = await encodeTransferCode();
    expect((await decodeTransferCode(code)).score).toBe(4321);
    expect(collectTransferData().score).toBe(4321);
  });
});
