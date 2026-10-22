import { expect, test, type Page } from "@playwright/test";
import { getAllQuestions } from "../src/data/questionLoader";
import { getStagesForArea } from "../src/data/stages";
import { startApp } from "./helpers";

/**
 * 小ボスを撃破(浄化)したときに、新しい効果音(subBossPurify。OtoLogic「オノマトペ キラキラ04」、約2.8秒)が、
 * 1回だけ、聴感の補正(-3 dB)つきで鳴ることのE2E。Web Audio の再生(AudioBufferSourceNode.start)を横取りして、
 * 鳴らしたバッファの長さと、そのときのゲインを記録する(音そのものは、ここでは聞かない)。
 */
const AREA = "kotobaNoIchiba";
const STAGE = `${AREA}-subboss`;
const choiceQuestions = getAllQuestions()
  .filter((q) => q.engine === "choice" && q.display !== "tapInSentence")
  .slice(0, 4);

async function seedAndSpy(page: Page, settings: { seVolume: number; muted: boolean }) {
  const before = getStagesForArea("prologue").map((s) => s.id);
  const normals = getStagesForArea(AREA).filter((s) => s.type === "normal").map((s) => s.id);
  await page.addInitScript(
    ([cleared, stage, ids, audioSettings]) => {
      localStorage.setItem("paku-kokubunpo:settings", JSON.stringify({ state: audioSettings, version: 0 }));
      localStorage.setItem(
        "paku-kokubunpo:progress",
        JSON.stringify({ state: { clearedStageIds: cleared, totalScore: 100, bossLosses: {}, assistedStageIds: [] }, version: 0 }),
      );
      localStorage.setItem("paku-kokubunpo:tutorial", JSON.stringify({ state: { seenGuides: ["zukan", "sorting", "choice", "assembly"] }, version: 0 }));
      // ボスのHPが1の状態から始める(1問正解すれば、浄化できる)
      localStorage.setItem(
        "paku-kokubunpo:session",
        JSON.stringify({ state: { active: { stageId: stage, areaId: "kotobaNoIchiba", questionIds: ids, index: 0, correctCount: 0, combo: 0, maxCombo: 0, hp: 1, lives: 3 } }, version: 0 }),
      );
      // 再生の記録: { duration: 鳴らしたバッファの長さ(秒), gain: そのときのゲイン }
      const played: { duration: number; gain: number }[] = [];
      (window as unknown as { __played: typeof played }).__played = played;
      const gains: GainNode[] = [];
      const createGain = AudioContext.prototype.createGain;
      AudioContext.prototype.createGain = function (this: AudioContext) {
        const g = createGain.call(this);
        gains.push(g);
        return g;
      };
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (this: AudioBufferSourceNode, ...args: [number?, number?, number?]) {
        if (this.buffer && !this.loop) played.push({ duration: this.buffer.duration, gain: gains[gains.length - 1]?.gain.value ?? NaN });
        return start.apply(this, args);
      };
    },
    [[...before, ...normals], STAGE, choiceQuestions.map((q) => q.id), settings] as const,
  );
}

/** 小ボス戦を、HP1から始めて、1問正解して浄化する。鳴らした音の記録を返す */
async function defeatBoss(page: Page) {
  await startApp(page);
  await page.evaluate(async (stage) => {
    const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/app\/store\/navigationStore\.ts/.test(u))!;
    (await import(/* @vite-ignore */ entry)).useNavigationStore.getState().goTo({ name: "stage", areaId: "kotobaNoIchiba", stageId: stage });
  }, STAGE);
  await page.locator(".engine-choice").waitFor();
  await page.waitForTimeout(1500); // 効果音のファイルの読み込み(デコード)を待つ
  const q = choiceQuestions[0];
  if (q.engine !== "choice") throw new Error("choice only");
  const correctIndex = q.choices.findIndex((c) => c.id === q.correctChoiceId);
  await page.locator(".engine-choice-list button").nth(correctIndex).click();
  await page.locator(".feedback-next").first().click();
  await expect(page.getByRole("heading", { name: /小ボスを.*した!/ })).toBeVisible(); // 「小ボスを浄化した!」(ふりがなで文字が分かれる)
  await page.waitForTimeout(300);
  return page.evaluate(() => (window as unknown as { __played: { duration: number; gain: number }[] }).__played);
}

const isPurify = (p: { duration: number }) => p.duration > 2.5 && p.duration < 3.2;

test("小ボスを浄化すると、新しい効果音(約2.8秒)が1回鳴る。ゲインは、効果音の音量 × -3 dB(聴感の補正)", async ({ page }) => {
  await seedAndSpy(page, { seVolume: 0.5, muted: false });
  const purify = (await defeatBoss(page)).filter(isPurify);
  expect(purify).toHaveLength(1);
  expect(purify[0].duration).toBeCloseTo(2.847, 1);
  expect(purify[0].gain).toBeCloseTo(0.5 * 10 ** (-3 / 20), 2); // 効果音の音量スライダー(0.5)が効いている
});

test("ミュートのときは、浄化の音は鳴らない", async ({ page }) => {
  await seedAndSpy(page, { seVolume: 0.8, muted: true });
  expect((await defeatBoss(page)).filter(isPurify)).toHaveLength(0);
});
