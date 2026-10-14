import { expect, test, type Page } from "@playwright/test";
import { startApp } from "./helpers";

/**
 * 「あそびかた」画面のE2E(ホームの「?」ボタンから開く)。横はみ出しがなく、押せるものは高さ44px以上であること。
 */
const PROOF = "情報通信技術活用論 2026";

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "横スクロールが発生している").toBeLessThanOrEqual(1);
}

/** 画面の中で、押せるもの(ボタン・リンク)のうち、高さ44px未満のものの一覧(フッターの小さな文字リンクは、既存の設計なので除く) */
async function smallTapTargets(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("button, a")]
      .filter((e) => e.offsetParent !== null && !e.closest(".title-footer") && !e.closest(".splash-footer") && !e.classList.contains("visually-hidden"))
      .map((e) => ({ t: (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 16), h: e.getBoundingClientRect().height }))
      .filter((x) => x.h > 0 && x.h < 44)
      .map((x) => `${x.t}(${Math.round(x.h)}px)`),
  );
}

async function expectProofVisible(page: Page, selector: string) {
  const proof = page.locator(selector);
  await proof.scrollIntoViewIfNeeded();
  await expect(proof).toBeVisible();
  await expect(proof).toHaveText(PROOF);
  const fontSize = await proof.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(12);
  // 画面の中に、全体が見えている(切れていない)
  const box = (await proof.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
}


test.describe("あそびかた", () => {
  test("ホームの「あそびかた」ボタンから開き、カード6枚が順に出て、もどるとホームへ戻る", async ({ page }) => {
    await startApp(page);
    const entry = page.getByRole("button", { name: "あそびかた" });
    const box = (await entry.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    await entry.click();
    await expect(page.getByRole("heading", { name: "あそびかた" })).toBeVisible();
    await expect(page.locator(".howto-card")).toHaveCount(6);
    const titles = await page.locator(".howto-title").allTextContents();
    expect(titles.map((t) => t.replace(/\s+/g, ""))).toHaveLength(6);
    await expectNoHorizontalOverflow(page);
    expect(await smallTapTargets(page)).toEqual([]);
    for (const spoiler of ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"]) {
      await expect(page.locator("body")).not.toContainText(spoiler);
    }
    await page.getByRole("button", { name: "◀ もどる" }).click();
    await expect(page.locator(".title-primary")).toBeVisible();
  });

  test("文字サイズ「大」でも、横はみ出しがなく、押せるものは44px以上", async ({ page }) => {
    await startApp(page);
    await page.evaluate(() => {
      document.documentElement.dataset.textSize = "large";
    });
    await page.getByRole("button", { name: "あそびかた" }).click();
    await expectNoHorizontalOverflow(page);
    expect(await smallTapTargets(page)).toEqual([]);
    await page.getByRole("button", { name: "◀ もどる" }).click();
    await expectProofVisible(page, ".title-proof");
    await expectNoHorizontalOverflow(page);
  });
});
