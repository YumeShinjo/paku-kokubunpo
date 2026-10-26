import { expect, test, type Page } from "@playwright/test";
import { getAllQuestions } from "../src/data/questionLoader";
import type { ChoiceQuestion } from "../src/data/schema";
import { clearedStagesThrough, seedProgress, startApp } from "./helpers";

/**
 * 正誤の見出し: 固定のラベル(「せいかい!」「ざんねん」)+ 記号(○・×)。変わる一言は、その下の小さい文。
 * 360×640・375×667・文字サイズ「大」でも、判定のポップアップが画面に収まり、見出しと一言が崩れないこと。
 */

const STAGE_ID = "kotobaNoIchiba-stage1";
const choice = getAllQuestions().find((q): q is ChoiceQuestion => q.engine === "choice" && q.id.startsWith("ichiba"))!;

async function openChoice(page: Page) {
  await seedProgress(page, clearedStagesThrough(["prologue"]));
  await page.addInitScript(
    ([stageId, questionId]) => {
      localStorage.setItem("paku-kokubunpo:tutorial", JSON.stringify({ state: { seenGuides: ["zukan", "sorting", "choice", "assembly", "paku"] }, version: 0 }));
      localStorage.setItem(
        "paku-kokubunpo:session",
        JSON.stringify({ state: { active: { stageId, areaId: "kotobaNoIchiba", questionIds: [questionId, questionId, questionId], index: 0, correctCount: 0, combo: 0, maxCombo: 0, hp: 0 } }, version: 0 }),
      );
    },
    [STAGE_ID, choice.id],
  );
  await startApp(page);
  await page.evaluate(async (stageId) => {
    const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/app\/store\/navigationStore\.ts/.test(u))!;
    (await import(/* @vite-ignore */ entry)).useNavigationStore.getState().goTo({ name: "stage", areaId: "kotobaNoIchiba", stageId });
  }, STAGE_ID);
  await page.locator(".engine").waitFor();
}

for (const [width, height] of [[360, 640], [375, 667]] as const) {
  for (const large of [false, true]) {
    for (const correct of [true, false]) {
      test(`${width}×${height} ${large ? "大" : "標準"}: ${correct ? "正解" : "不正解"}の見出しは固定のラベルと記号。一言は別の行で、ポップアップは画面に収まる`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await openChoice(page);
        if (large) await page.evaluate(() => (document.documentElement.dataset.textSize = "large"));
        const target = correct ? choice.correctChoiceId : choice.choices.find((c) => c.id !== choice.correctChoiceId)!.id;
        await page.locator(".engine-choice-list button").nth(choice.choices.findIndex((c) => c.id === target)).click();
        const dialog = page.getByRole("dialog", { name: correct ? "せいかい" : "ざんねん" });
        await expect(dialog).toBeVisible();
        const verdict = dialog.locator(".verdict");
        await expect(verdict).toHaveText(correct ? "せいかい!" : "ざんねん");
        await expect(verdict.locator("svg")).toBeVisible(); // ○(正解)・×(不正解)の記号
        const message = dialog.locator(".feedback-message");
        await expect(message).toBeVisible();
        expect(((await message.textContent()) ?? "").length).toBeGreaterThan(0);
        // 見出しは1行(折り返さない)で、一言は、見出しより小さい
        const v = (await verdict.boundingBox())!;
        const m = (await message.boundingBox())!;
        expect(m.y).toBeGreaterThanOrEqual(v.y + v.height - 1);
        expect(v.height).toBeLessThan(48 * (large ? 1.3 : 1));
        const sizes = await page.evaluate(() => ({
          label: parseFloat(getComputedStyle(document.querySelector(".feedback-overlay .verdict-label")!).fontSize),
          message: parseFloat(getComputedStyle(document.querySelector(".feedback-overlay .feedback-message")!).fontSize),
        }));
        expect(sizes.message).toBeLessThan(sizes.label);
        // ポップアップは、画面に収まる(横にはみ出さない)
        const box = (await dialog.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
        const dir = process.env.VERDICT_SHOTS;
        if (dir) await page.screenshot({ path: `${dir}/S2-${correct ? "correct" : "incorrect"}-${width}x${height}${large ? "-large" : ""}.png` });
      });
    }
  }
}
