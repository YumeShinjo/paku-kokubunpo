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

  test("ユライとコトは、画面の高さに余りがあるぶんだけ大きい(高い画面で 1.5〜1.8 倍)。背の低い画面は、これまでと同じ。押すものは44px以上で、スクロールしない", async ({ page }) => {
    await openEntry(page);
    const size = () => page.evaluate(() => document.querySelector(".kotonoha-scene .yurai")!.getBoundingClientRect().height);
    const rem = 16;
    // これまでの大きさ(画面の高さに合わせた式): 標準 clamp(3.6rem, 10.5dvh, 8rem)、大 clamp(3rem, 9dvh, 6rem)
    const before = (h: number, large: boolean) => (large ? Math.min(Math.max(3 * rem, 0.09 * h), 6 * rem) : Math.min(Math.max(3.6 * rem, 0.105 * h), 8 * rem));
    const cases: { w: number; h: number; large: boolean; min: number; max: number }[] = [
      { w: 360, h: 640, large: false, min: 1.0, max: 1.02 }, // 余りがない: これまでと同じ
      { w: 375, h: 667, large: false, min: 1.0, max: 1.3 },
      { w: 360, h: 740, large: false, min: 1.5, max: 1.82 },
      { w: 390, h: 844, large: false, min: 1.5, max: 1.82 },
      { w: 400, h: 800, large: false, min: 1.5, max: 1.82 },
      { w: 360, h: 640, large: true, min: 1.4, max: 1.5 }, // 一言を出さない分、余りがある
      { w: 375, h: 667, large: true, min: 1.0, max: 1.02 },
      { w: 360, h: 740, large: true, min: 1.4, max: 1.82 },
      { w: 390, h: 844, large: true, min: 1.5, max: 1.82 },
    ];
    for (const { w, h, large, min, max } of cases) {
      await page.setViewportSize({ width: w, height: h });
      await page.evaluate((large) => {
        if (large) document.documentElement.dataset.textSize = "large";
        else delete document.documentElement.dataset.textSize;
      }, large);
      const ratio = (await size()) / before(h, large);
      const label = `${w}×${h} ${large ? "大" : "標準"}`;
      expect(ratio, `${label}: 倍率 ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min - 0.02);
      expect(ratio, `${label}: 倍率 ${ratio.toFixed(2)}`).toBeLessThanOrEqual(max + 0.02);
      expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight), `${label}: スクロール`).toBeLessThanOrEqual(0);
      const heights = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>(".kotonoha-scope-list button, .kotonoha-start, .kotonoha-zukan-link")].map((e) => e.getBoundingClientRect().height));
      for (const hh of heights) expect(hh, `${label}: 押すものの高さ`).toBeGreaterThanOrEqual(43.5);
    }
  });
});
