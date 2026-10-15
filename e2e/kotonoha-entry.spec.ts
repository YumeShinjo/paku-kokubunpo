import { expect, test, type Page } from "@playwright/test";
import { clearedStagesThrough, seedProgress, startApp } from "./helpers";

/**
 * 言の葉の森の入口: 範囲のボタン(すべて・ことわざ・故事成語)は「選ぶ」だけで、「すすむ」で始まる。
 * 以前は、範囲のボタンを押すと、「すすむ」を押さなくても、自動で問題の画面に進んでしまった(1.5秒で自動で進む仕組み)。
 * マウスのクリックと、指のタップの、両方で確かめる。
 */
async function openEntry(page: Page) {
  await seedProgress(page, clearedStagesThrough(["prologue"]));
  await page.addInitScript(() => {
    localStorage.setItem("paku-kokubunpo:kotonoha", JSON.stringify({ state: { collectedIds: [], missedIds: [], enteredForest: true, seenEntryFirst: true }, version: 1 }));
  });
  await startApp(page);
  await page.locator(".title-forest").click();
  await expect(page.locator(".kotonoha-scope-list button")).toHaveCount(3);
}

const checked = (page: Page) => page.locator('.kotonoha-scope-list button[aria-checked="true"]');

async function checkSelectionOnly(page: Page, press: (selector: string) => Promise<void>) {
  await openEntry(page);
  await expect(checked(page)).toHaveCount(1);
  await expect(checked(page)).toContainText("すべて"); // 最初は「すべて」
  for (const index of [1, 2, 0]) {
    await press(`.kotonoha-scope-list li:nth-child(${index + 1}) button`);
    // 押しても、出題の画面には進まない(以前の自動で進む時間=1.5秒より長く、待つ)
    await page.waitForTimeout(2200);
    await expect(page.locator(".kotonoha-choices")).toHaveCount(0);
    await expect(page.locator(".kotonoha-scope-list")).toBeVisible();
    await expect(page.locator(`.kotonoha-scope-list li:nth-child(${index + 1}) button`)).toHaveAttribute("aria-checked", "true");
    await expect(checked(page)).toHaveCount(1); // 選んでいるのは、いつも1つだけ
  }
  // 「ことわざ」を選んで、「すすむ」で始まる
  await press(".kotonoha-scope-list li:nth-child(2) button");
  expect((await page.locator(".kotonoha-start").boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await press(".kotonoha-start");
  await expect(page.locator(".kotonoha-progress")).toContainText("1 / 10");
  await expect(page.locator(".kotonoha-progress")).toContainText("ことわざ");
}

test.describe("言の葉の森の入口: 範囲は選ぶだけ、「すすむ」で始まる", () => {
  test("マウスのクリック", async ({ page }) => {
    await checkSelectionOnly(page, async (selector) => {
      await page.locator(selector).click();
    });
  });

  test.describe("指のタップ", () => {
    test.use({ hasTouch: true });
    test("タップしても、自動では進まない", async ({ page }) => {
      await checkSelectionOnly(page, async (selector) => {
        await page.locator(selector).tap();
      });
    });
  });

  test("入口の画面は、縦にスクロールしない(「すすむ」のボタンを足しても)。5つの画面サイズ × 文字サイズ「標準」「大」で確かめる", async ({ page }) => {
    await openEntry(page);
    const scroll = () => page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (const [width, height] of [
      [360, 640],
      [375, 667],
      [360, 740],
      [400, 800],
      [1280, 800],
    ]) {
      await page.setViewportSize({ width, height });
      for (const large of [false, true]) {
        await page.evaluate((large) => {
          if (large) document.documentElement.dataset.textSize = "large";
          else delete document.documentElement.dataset.textSize;
        }, large);
        expect(await scroll(), `${width}×${height} ${large ? "大" : "標準"}`).toBeLessThanOrEqual(0);
        // 「すすむ」のボタンは、画面の中にあり、44px以上
        const box = (await page.locator(".kotonoha-start").boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.y + box.height).toBeLessThanOrEqual(height);
      }
    }
  });
});
