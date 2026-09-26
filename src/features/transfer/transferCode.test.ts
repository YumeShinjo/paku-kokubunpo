import { beforeEach, describe, expect, it } from "vitest";
import { getAllQuestions } from "@/data/questionLoader";
import { storyEvents } from "@/data/story/events";
import { playableAreas } from "@/data/areas";
import { getStagesForArea } from "@/data/stages";
import { useMascotStore } from "@/app/store/mascotStore";
import { useProfileStore } from "@/app/store/profileStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { useStatsStore } from "@/app/store/statsStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import {
  TransferError,
  applyTransferData,
  checksum,
  collectTransferData,
  decodeTransferCode,
  encodeTransferCode,
  encodeTransferCodeV1,
  transferErrorMessage,
  validateTransferData,
} from "./transferCode";

function resetAll() {
  useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
  useMascotStore.setState({ growthStage: 0 });
  useStoryStore.setState({ seenStoryIds: [], choices: {} });
  useReviewStore.setState({ starredQuestionIds: [] });
  useStatsStore.setState({ recentQuestionIds: [], unitRecent: {} });
  useTutorialStore.setState({ seenGuides: [] });
  useProfileStore.setState({ iconId: "mint-circle" });
}

/** ほぼ全部を遊び終えたデータ(コードが一番長くなる場合) */
function fillEverything() {
  const stages = playableAreas.flatMap((a) => getStagesForArea(a.id));
  const questions = getAllQuestions();
  useProgressStore.setState({ clearedStageIds: stages.map((s) => s.id), totalScore: 45230 });
  useMascotStore.setState({ growthStage: 7 });
  useStoryStore.setState({
    seenStoryIds: storyEvents.map((e) => e.id),
    choices: (() => {
      const event = storyEvents.find((e) => e.choice)!;
      return { [event.id]: event.choice!.options[0].key };
    })(),
  });
  useReviewStore.setState({ starredQuestionIds: questions.slice(0, 60).map((q) => q.id) });
  useStatsStore.setState({
    recentQuestionIds: questions.slice(0, 20).map((q) => q.id),
    unitRecent: Object.fromEntries([...new Set(questions.map((q) => q.unit))].map((u) => [u, [true, false, true, true, false, true, true, true, false, true]])),
  });
  useTutorialStore.setState({ seenGuides: ["sorting", "assembly", "choice", "tapInSentence", "zukan"] });
  useProfileStore.setState({ iconId: "gold-star" });
}

describe("データの引き継ぎコード", () => {
  beforeEach(resetAll);

  it("発行したコードから、進み具合がそっくり戻る(コード → 別の端末 → 復元)", async () => {
    fillEverything();
    const before = collectTransferData();
    const code = await encodeTransferCode();
    expect(code).toMatch(/^PAKU2[ZR]\.[A-Za-z0-9_-]+\.[A-Z0-9]{4}$/);

    resetAll(); // 新しい端末(何も入っていない)
    expect(collectTransferData().cleared).toEqual([]);
    applyTransferData(await decodeTransferCode(code));
    expect(collectTransferData()).toEqual(before);
    expect(useProgressStore.getState().totalScore).toBe(45230);
    expect(useMascotStore.getState().growthStage).toBe(7);
    expect(useProfileStore.getState().iconId).toBe("gold-star");
  });

  it("すべてを遊び終えたデータでも、コードは、メッセージで送れる長さ(1500文字以内)に収まる", async () => {
    fillEverything();
    const code = await encodeTransferCode();
    expect(code.length).toBeLessThan(1500);
  });

  it("貼り付けのときに混ざる、空白・改行・全角の空白が入っていても読める", async () => {
    useProgressStore.setState({ totalScore: 300 });
    const code = await encodeTransferCode();
    const messy = `  ${code.slice(0, 20)}\n${code.slice(20, 40)}${"　"}${code.slice(40)}  \n`;
    expect((await decodeTransferCode(messy)).score).toBe(300);
  });

  it("写し間違い・途中で切れたコードは「壊れている」として断る。データは書き換わらない", async () => {
    useProgressStore.setState({ totalScore: 300 });
    const code = await encodeTransferCode();
    const wrong = code.replace(/\.([A-Za-z0-9_-])/, (_, c: string) => `.${c === "A" ? "B" : "A"}`);
    await expect(decodeTransferCode(wrong)).rejects.toMatchObject({ code: "broken" });
    await expect(decodeTransferCode(code.slice(0, code.length - 10))).rejects.toBeInstanceOf(TransferError);
    expect(useProgressStore.getState().totalScore).toBe(300);
  });

  it("空・別の形式・知らない版のコードは、それぞれ理由つきで断る", async () => {
    await expect(decodeTransferCode("   ")).rejects.toMatchObject({ code: "empty" });
    await expect(decodeTransferCode("こんにちは")).rejects.toMatchObject({ code: "format" });
    const payload = "e30";
    await expect(decodeTransferCode(`PAKU9R.${payload}.${checksum(payload)}`)).rejects.toMatchObject({ code: "unsupported" });
    for (const code of ["empty", "format", "unsupported", "broken"] as const) {
      expect(transferErrorMessage(new TransferError(code))).toMatch(/[コード。]/);
    }
  });

  it("中身の形が正しくない(型・範囲がおかしい)コードは、チェックサムが合っていても受け付けない", async () => {
    const forged = (obj: unknown) => {
      const payload = btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      return `PAKU1R.${payload}.${checksum(payload)}`;
    };
    const base = collectTransferData();
    await expect(decodeTransferCode(forged({ ...base, score: -5 }))).rejects.toMatchObject({ code: "broken" });
    await expect(decodeTransferCode(forged({ ...base, score: 1e15 }))).rejects.toMatchObject({ code: "broken" });
    await expect(decodeTransferCode(forged({ ...base, growth: 99 }))).rejects.toMatchObject({ code: "broken" });
    await expect(decodeTransferCode(forged({ ...base, icon: "no-such-icon" }))).rejects.toMatchObject({ code: "broken" });
    await expect(decodeTransferCode(forged({ ...base, cleared: "x" }))).rejects.toMatchObject({ code: "broken" });
    await expect(decodeTransferCode(forged("text"))).rejects.toMatchObject({ code: "broken" });
  });

  it("存在しないステージ・問題・ガイドのidは、取り除いて復元する(データの更新・壊れた値への備え)", () => {
    const some = getAllQuestions()[0].id;
    const data = validateTransferData({
      ...collectTransferData(),
      cleared: ["prologue-stage1", "no-such-stage"],
      starred: [some, "no-such-question"],
      recent: [some, "zzz"],
      guides: ["sorting", "unknown-guide"],
    });
    expect(data?.cleared).not.toContain("no-such-stage");
    expect(data?.starred).toEqual([some]);
    expect(data?.recent).toEqual([some]);
    expect(data?.guides).toEqual(["sorting"]);
  });

  it("圧縮が使えない端末(CompressionStreamがない)でも、発行も復元もできる(圧縮なし=R)", async () => {
    fillEverything();
    const original = globalThis.CompressionStream;
    // @ts-expect-error テストのため、いったん使えなくする
    delete globalThis.CompressionStream;
    try {
      const code = await encodeTransferCodeV1();
      expect(code.startsWith("PAKU1R.")).toBe(true);
      resetAll();
      applyTransferData(await decodeTransferCode(code));
      expect(useProgressStore.getState().totalScore).toBe(45230);
    } finally {
      globalThis.CompressionStream = original;
    }
  });
});
