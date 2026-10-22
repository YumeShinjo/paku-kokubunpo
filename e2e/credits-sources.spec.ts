import { expect, test, type Page } from "@playwright/test";
import { startApp } from "./helpers";

/**
 * 講義の提出に向けた画面(自作証明・クレジット・くわしい出典)のE2E。
 * どの画面でも、横はみ出しがなく、押せるものは高さ44px以上で、「情報通信技術活用論 2026」が12px以上で見えること。(あそびかたは e2e/howto.spec.ts)
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

test.describe("講義の自作証明", () => {
  test("最初の画面とホーム画面の下に、12px以上で見える。他のボタンと重ならない", async ({ page }) => {
    await page.goto("/");
    await expectProofVisible(page, ".splash-proof");
    const credits = (await page.locator(".splash-credits").boundingBox())!;
    const proofBox = (await page.locator(".splash-proof").boundingBox())!;
    expect(proofBox.y).toBeGreaterThanOrEqual(credits.y + credits.height - 0.5);
    await expectNoHorizontalOverflow(page);

    await startApp(page);
    await expectProofVisible(page, ".title-proof");
    const footer = (await page.locator(".title-footer button").first().boundingBox())!;
    const homeProof = (await page.locator(".title-proof").boundingBox())!;
    expect(homeProof.y).toBeGreaterThanOrEqual(footer.y + footer.height - 0.5);
    // ホームは、縦にスクロールしない(自作証明を足しても、1画面に収まる)
    expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeLessThanOrEqual(0);
    await expectNoHorizontalOverflow(page);
  });

  test("クレジットの末尾・くわしい出典の末尾に出る", async ({ page }) => {
    await startApp(page);
    await page.locator(".title-credits").click();
    await expect(page.getByRole("heading", { name: "クレジット" })).toBeVisible();
    await expectProofVisible(page, ".credits-proof");
    // 画面の最後の要素である
    expect(await page.evaluate(() => document.querySelector(".screen-credits")!.lastElementChild!.classList.contains("credits-proof"))).toBe(true);
    await expectNoHorizontalOverflow(page);
    expect(await smallTapTargets(page)).toEqual([]);
  });
});

test.describe("くわしい出典", () => {
  test("クレジット → くわしい出典 → 警告のあと「ひらく」を押すまで一覧は出ない → 開くと全素材が出る → もどる", async ({ page }) => {
    await startApp(page);
    await page.locator(".title-credits").click();
    await page.getByRole("button", { name: "くわしい出典" }).click();
    await expect(page.getByRole("heading", { name: "くわしい出典" })).toBeVisible();
    await expect(page.locator(".sources-warning")).toContainText("ストーリーのネタバレを");
    await expect(page.locator(".sources-item")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("禁忌の詠唱");
    await expectNoHorizontalOverflow(page);
    expect(await smallTapTargets(page)).toEqual([]);
    await expectProofVisible(page, ".sources-proof");

    await page.getByRole("button", { name: "ひらく" }).click();
    expect(await page.locator(".sources-item").count()).toBeGreaterThan(40);
    await expect(page.locator(".screen-sources")).toContainText("禁忌の詠唱");
    await expect(page.locator('a.sources-link[href="https://youtu.be/AdWxKyHYQM0"]')).toHaveCount(1);
    await expect(page.locator(".sources-badge")).toHaveCount(3); // 表記必須の印(ポケットサウンド・Prairie4・OtoLogic)
    await expect(page.locator(".screen-sources")).toContainText("効果音：ポケットサウンド – https://pocket-se.info/");
    await expectNoHorizontalOverflow(page);
    expect(await smallTapTargets(page)).toEqual([]);
    await expectProofVisible(page, ".sources-proof");

    await page.getByRole("button", { name: "◀ もどる" }).click();
    await expect(page.getByRole("heading", { name: "クレジット" })).toBeVisible();
  });
});
