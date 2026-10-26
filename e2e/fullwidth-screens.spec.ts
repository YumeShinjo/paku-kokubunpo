import { expect, test, type Page } from "@playwright/test";
import { getAllQuestions } from "../src/data/questionLoader";
import { getStagesForArea } from "../src/data/stages";
import { startApp } from "./helpers";

/**
 * 画面の文言(コトの口調の案内・メッセージ)の「!」「?」を全角(！？)にしたあとも、
 * 360×640・375×667・文字サイズ「大」で、文が枠に収まり、横にはみ出さないこと。
 * (負けた画面・戦闘に入ったときの説明・最初の画面の吹き出し)
 */
const AREA = "kotobaNoIchiba";
const STAGE = `${AREA}-subboss`;
const choiceQuestions = getAllQuestions()
  .filter((q) => q.engine === "choice" && q.display !== "tapInSentence")
  .slice(0, 4);

async function seed(page: Page, losses: number) {
  const before = ["prologue"].flatMap((a) => getStagesForArea(a).map((s) => s.id));
  const normals = getStagesForArea(AREA).filter((s) => s.type === "normal").map((s) => s.id);
  await page.addInitScript(
    ([cleared, stage, ids, lossCount]) => {
      localStorage.setItem(
        "paku-kokubunpo:progress",
        JSON.stringify({ state: { clearedStageIds: cleared, totalScore: 100, bossLosses: lossCount > 0 ? { [stage]: lossCount } : {}, assistedStageIds: [] }, version: 0 }),
      );
      localStorage.setItem("paku-kokubunpo:tutorial", JSON.stringify({ state: { seenGuides: ["zukan", "sorting", "choice", "assembly"] }, version: 0 }));
      localStorage.setItem(
        "paku-kokubunpo:session",
        JSON.stringify({
          state: { active: { stageId: stage, areaId: "kotobaNoIchiba", questionIds: ids, index: 0, correctCount: 0, combo: 0, maxCombo: 0, hp: 12, lives: 1 } },
          version: 0,
        }),
      );
    },
    [[...before, ...normals], STAGE, choiceQuestions.map((q) => q.id), losses] as const,
  );
}

/** ライフ1の小ボス戦で、外れを押して、負けた画面まで進める */
async function loseOnce(page: Page) {
  await startApp(page);
  await page.evaluate(async (stage) => {
    const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/app\/store\/navigationStore\.ts/.test(u))!;
    (await import(/* @vite-ignore */ entry)).useNavigationStore.getState().goTo({ name: "stage", areaId: "kotobaNoIchiba", stageId: stage });
  }, STAGE);
  await page.locator(".engine-choice").waitFor();
  const q = choiceQuestions[0];
  if (q.engine !== "choice") throw new Error("choice only");
  const wrongIndex = q.choices.findIndex((c) => c.id !== q.correctChoiceId);
  await page.locator(".engine-choice-list button").nth(wrongIndex).click();
  await page.locator(".feedback-next").first().click();
  await expect(page.locator("h2")).toHaveText("ライフが なくなっちゃった…");
}


const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const within = (page: Page, selector: string) =>
  page.evaluate((s) => {
    const r = document.querySelector(s)!.getBoundingClientRect();
    return { left: r.left, right: r.right, width: innerWidth };
  }, selector);

for (const [width, height] of [[360, 640], [375, 667]] as const) {
  for (const large of [false, true]) {
    const tag = `${width}×${height} ${large ? "大" : "標準"}`;
    const shot = (page: Page, name: string) =>
      process.env.VERDICT_SHOTS ? page.screenshot({ path: `${process.env.VERDICT_SHOTS}/S1b-${name}-${width}x${height}${large ? "-large" : ""}.png` }) : Promise.resolve(undefined);

    test(`${tag}: 負けた画面の案内は、全角の！でも、枠に収まる`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await seed(page, 1);
      await loseOnce(page);
      if (large) await page.evaluate(() => (document.documentElement.dataset.textSize = "large"));
      const text = (await page.locator(".screen-boss-loss").textContent()) ?? "";
      expect(text).toContain("でも大丈夫！");
      expect(text).not.toMatch(/[!?]/);
      expect(await noOverflow(page)).toBeLessThanOrEqual(0);
      for (const sel of ["h2", ".screen-boss-loss p"]) {
        const b = await within(page, sel);
        expect(b.left, sel).toBeGreaterThanOrEqual(0);
        expect(b.right, sel).toBeLessThanOrEqual(b.width);
      }
      await shot(page, "loss");
    });

    test(`${tag}: 戦闘に入ったときの「○○が あらわれた！」と説明が、枠に収まる`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await seed(page, 0);
      await page.addInitScript(() => localStorage.removeItem("paku-kokubunpo:session"));
      await startApp(page);
      await page.evaluate(async (stage) => {
        const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/app\/store\/navigationStore\.ts/.test(u))!;
        (await import(/* @vite-ignore */ entry)).useNavigationStore.getState().goTo({ name: "stage", areaId: "kotobaNoIchiba", stageId: stage });
      }, STAGE);
      await page.locator(".stage-intro").waitFor();
      if (large) await page.evaluate(() => (document.documentElement.dataset.textSize = "large"));
      await page.waitForTimeout(300);
      const text = (await page.locator(".stage-intro").textContent()) ?? "";
      expect(text).toContain("が あらわれた！");
      expect(text).not.toMatch(/(?<!たたかう)[!?]/); // ボタン「たたかう!」だけは半角
      expect(await noOverflow(page)).toBeLessThanOrEqual(0);
      const box = (await page.locator(".stage-intro").boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
      await shot(page, "appear");
    });

    test(`${tag}: 最初の画面の吹き出し「ことばを あつめよう！」が、画面に収まる`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await page.locator(".splash-bubble").waitFor();
      if (large) await page.evaluate(() => (document.documentElement.dataset.textSize = "large"));
      await expect(page.locator(".splash-bubble")).toContainText("ことばを あつめよう！");
      const b = await within(page, ".splash-bubble");
      expect(b.left).toBeGreaterThanOrEqual(0);
      expect(b.right).toBeLessThanOrEqual(b.width);
      expect(await noOverflow(page)).toBeLessThanOrEqual(0);
      await shot(page, "splash");
    });
  }
}
