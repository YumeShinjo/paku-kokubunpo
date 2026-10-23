import { expect, test, type Page } from "@playwright/test";
import { getAllQuestions } from "../src/data/questionLoader";
import type { SortingQuestion } from "../src/data/schema";
import { clearedStagesThrough, seedProgress, startApp } from "./helpers";

/**
 * 仕分け(「ある」の問題): カードをカゴに入れると、カードは対象の語だけの表示になり、問題文が見えなくなっていた。
 * そこで、入れたカードの文を「もんだいぶんを みる」の欄に出す(①②の番号つき)。
 * カード・カゴの押しやすさ(44px)・ドラッグは、これまでどおり。
 */
const QUESTION_ID = "ichiba-pos-batch-01";
const STAGE_ID = "kotobaNoIchiba-stage1";
const found = getAllQuestions().find((q) => q.id === QUESTION_ID)!;
if (found.engine !== "sorting") throw new Error("sorting only");
const question: SortingQuestion = found;

async function openQuestion(page: Page) {
  await seedProgress(page, clearedStagesThrough(["prologue"]));
  await page.addInitScript(
    ([stageId, questionId]) => {
      localStorage.setItem("paku-kokubunpo:tutorial", JSON.stringify({ state: { seenGuides: ["zukan", "sorting", "choice", "assembly", "paku"] }, version: 0 }));
      localStorage.setItem(
        "paku-kokubunpo:session",
        JSON.stringify({ state: { active: { stageId, areaId: "kotobaNoIchiba", questionIds: [questionId, questionId, questionId], index: 0, correctCount: 0, combo: 4, maxCombo: 4, hp: 0 } }, version: 0 }),
      );
    },
    [STAGE_ID, QUESTION_ID],
  );
  await startApp(page);
  await page.evaluate(async (stageId) => {
    const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/app\/store\/navigationStore\.ts/.test(u))!;
    (await import(/* @vite-ignore */ entry)).useNavigationStore.getState().goTo({ name: "stage", areaId: "kotobaNoIchiba", stageId });
  }, STAGE_ID);
  await page.locator(".engine-sorting").waitFor();
}

/** カードをタップして選び、カゴのラベルをタップして入れる */
async function place(page: Page, itemId: string, categoryId: string) {
  await page.locator(`[data-item-id="${itemId}"]`).first().click();
  await page.locator(`.sorting-basket[data-category-id="${categoryId}"] .sorting-basket-label`).click();
}

const submit = (page: Page) => page.getByRole("button", { name: "こたえる" });

const sentences = (page: Page) => page.locator(".sorting-sentences");
const toggle = (page: Page) => page.locator(".sorting-sentences-toggle");
const scrollToBottom = (page: Page) => page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
const overflowX = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const [width, height] of [[360, 640], [375, 667]] as const) {
  for (const large of [false, true]) {
    test(`${width}×${height} ${large ? "大" : "標準"}: カゴに入れたあとも、問題文が①②つきで見える。カード・カゴは押せる大きさのまま`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await openQuestion(page);
      if (large) await page.evaluate(() => (document.documentElement.dataset.textSize = "large"));
      await expect(sentences(page)).toHaveCount(0); // 入れる前は、欄は出ない(文は、カードに出ている)

      const [verb, adnoun] = [question.items[1], question.items[2]];
      await place(page, verb.id, verb.correctCategoryId);
      await place(page, adnoun.id, adnoun.correctCategoryId);

      // 欄が開いていて、①②の「ある」が見える
      await expect(toggle(page)).toHaveText("もんだいぶんを とじる");
      const rows = page.locator(".sorting-sentences-list li");
      await expect(rows).toHaveCount(2);
      const marks = await rows.locator(".target-mark").allTextContents();
      expect(marks.sort()).toEqual(["①", "②"]);
      await scrollToBottom(page); // 欄は、カゴの下。小さな端末では、いちばん下までスクロールして見る(下の「こたえる」の枠のうしろには、余白がある)
      for (const row of await rows.all()) {
        await expect(row.locator(".target-card")).toContainText("ある");
        await expect(row).toBeInViewport();
      }
      // カゴの中のカードの番号と、文の中の番号が、同じ
      const basketMarks = await page.locator(".sorting-basket-items .target-mark").allTextContents();
      expect(basketMarks.sort()).toEqual(["①", "②"]);

      // 横にはみ出さない。ボタンは44px以上。カゴのラベルも、これまでの大きさ
      expect(await overflowX(page)).toBeLessThanOrEqual(0);
      const t = await toggle(page).boundingBox();
      expect(t!.height).toBeGreaterThanOrEqual(43.5);
      for (const label of await page.locator(".sorting-basket-label").all()) {
        expect((await label.boundingBox())!.height).toBeGreaterThanOrEqual(26);
      }
      // 閉じる・開く
      await toggle(page).click();
      await expect(rows).toHaveCount(0);
      await expect(toggle(page)).toHaveText("もんだいぶんを みる");
      await toggle(page).click();
      await expect(rows).toHaveCount(2);

      // 残りのカードを入れて、確定できる(欄が、操作のじゃまをしない)
      for (const item of question.items) {
        if (item.id !== verb.id && item.id !== adnoun.id) await place(page, item.id, item.correctCategoryId);
      }
      await expect(submit(page)).toBeEnabled();
      await submit(page).click();
      await expect(page.locator(".sorting-results")).toBeVisible();
      await expect(sentences(page)).toHaveCount(0);
      await page.screenshot({ path: `test-results/shots/sorting-sentences-${width}x${height}${large ? "-large" : ""}-result.png` });
    });
  }
}

test("360×640 標準: 入れた直後の画面(欄が開いている)を撮る", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openQuestion(page);
  await place(page, question.items[1].id, question.items[1].correctCategoryId);
  await place(page, question.items[2].id, question.items[2].correctCategoryId);
  await page.screenshot({ path: "test-results/shots/sorting-sentences-360x640-top.png" });
  await scrollToBottom(page);
  await page.screenshot({ path: "test-results/shots/sorting-sentences-360x640.png" });
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: "test-results/shots/sorting-sentences-375x667.png" });
  await page.evaluate(() => (document.documentElement.dataset.textSize = "large"));
  await page.screenshot({ path: "test-results/shots/sorting-sentences-375x667-large.png" });
});

test("ドラッグ(タッチ)で入れても、欄に文が出る。欄の文はドラッグの対象ではない", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openQuestion(page);
  const item = question.items[1];
  const card = page.locator(`.sorting-items [data-item-id="${item.id}"]`);
  const basket = page.locator(`.sorting-basket[data-category-id="${item.correctCategoryId}"]`);
  const from = (await card.boundingBox())!;
  const to = (await basket.boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const pt = (x: number, y: number) => [{ x, y }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: pt(from.x + from.width / 2, from.y + from.height / 2) });
  for (let i = 1; i <= 6; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: pt(from.x + from.width / 2 + ((to.x + to.width / 2 - from.x - from.width / 2) * i) / 6, from.y + from.height / 2 + ((to.y + to.height / 2 - from.y - from.height / 2) * i) / 6),
    });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(`.sorting-basket[data-category-id="${item.correctCategoryId}"] [data-item-id="${item.id}"]`)).toHaveCount(1);
  await expect(page.locator(".sorting-sentences-list li")).toHaveCount(1);
  await expect(page.locator(".sorting-sentences [data-item-id]")).toHaveCount(0);
});
