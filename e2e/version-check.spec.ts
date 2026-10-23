import { expect, test, type Page } from "@playwright/test";
import { startApp } from "./helpers";

/**
 * 設定の、バージョン表示と「最新の版をたしかめる」のE2E。
 * 開発サーバーでは、コミットIDを取らないので、表示は「v0.9.0(dev)」。version.json は、通信を差し替えて、同じ版・違う版・読めない場合を作る。
 */
async function openSettings(page: Page, large = false) {
  await startApp(page);
  await page.getByRole("button", { name: "せってい" }).click();
  await expect(page.getByRole("heading", { name: "せってい" })).toBeVisible();
  if (large) await page.getByRole("radio", { name: "大" }).click();
}

const check = (page: Page) => page.getByRole("button", { name: "最新の版をたしかめる" });
const status = (page: Page) => page.locator(".version-check-status");

/** いま動いている版(vite が埋め込んだ値)を、アプリから取る */
const runningVersion = (page: Page) =>
  page.evaluate(async () => {
    const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/lib\/appVersion\.ts/.test(u))!;
    return (await import(/* @vite-ignore */ entry)).APP_VERSION_INFO as { version: string; commit: string; buildTime: string };
  });

test.describe("設定: バージョン表示と「最新の版をたしかめる」", () => {
  test("バージョン表示は「v0.9.0(dev)」(開発サーバー)。押す前は、結果の文は出ない", async ({ page }) => {
    await openSettings(page);
    await expect(page.locator(".settings-version")).toHaveText("v0.9.0(dev)");
    await expect(check(page)).toBeVisible();
    await expect(status(page)).toBeHidden();
  });

  test("同じ版の version.json なら「最新の版です」。ページは読み込み直さない", async ({ page }) => {
    await openSettings(page);
    const v = await runningVersion(page);
    await page.route("**/version.json*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(v) }));
    let loads = 0;
    page.on("load", () => loads++);
    await check(page).click();
    await expect(status(page)).toHaveText("最新の版です");
    await page.waitForTimeout(500);
    expect(loads).toBe(0);
  });

  test("違う版の version.json なら「新しい版があります。再読み込みします」と出て、ページを読み込み直す", async ({ page }) => {
    await openSettings(page);
    await page.route("**/version.json*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ version: "9.9.9", commit: "abc1234", buildTime: "2030-01-01 00:00" }) }));
    const reloaded = page.waitForEvent("load", { timeout: 15_000 });
    await check(page).click();
    await expect(status(page)).toHaveText("新しい版があります。再読み込みします");
    await reloaded;
  });

  test("通信できない・version.json が読めないときは「たしかめられませんでした」。ほかの動作に影響しない", async ({ page }) => {
    await openSettings(page);
    await page.route("**/version.json*", (route) => route.abort());
    await check(page).click();
    await expect(status(page)).toHaveText("たしかめられませんでした");
    await page.unroute("**/version.json*");
    await page.route("**/version.json*", (route) => route.fulfill({ status: 404, body: "not found" }));
    await check(page).click();
    await expect(status(page)).toHaveText("たしかめられませんでした");
    // 設定の、ほかの操作(文字の大きさ)は、そのまま使える
    await page.getByRole("radio", { name: "大" }).click();
    await expect(page.getByRole("radio", { name: "大" })).toBeChecked();
  });

  for (const { w, h } of [
    { w: 360, h: 640 },
    { w: 375, h: 667 },
  ]) {
    for (const large of [false, true]) {
      test(`${w}x${h} ${large ? "大" : "標準"}: 結果の文が出ても、横にはみ出さず、バージョン表記(5回タップの場所)に重ならない`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await openSettings(page, large);
        await page.route("**/version.json*", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ version: "9.9.9", commit: "abc1234", buildTime: "2030-01-01 00:00" }) }));
        // 結果の文が出た状態を、すぐに測る(「新しい版があります」の文は、いちばん長い。読み込み直しまでは、最低1.2秒ある)
        await check(page).click();
        await expect(status(page)).toHaveText("新しい版があります。再読み込みします");
        const report = await page.evaluate(() => {
          const rect = (e: Element) => e.getBoundingClientRect();
          const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("最新の版をたしかめる"))!;
          const st = document.querySelector(".version-check-status")!;
          const ver = document.querySelector(".settings-version")!;
          return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, btnH: rect(btn).height, stBottom: rect(st).bottom, stRight: rect(st).right, vw: window.innerWidth, verTop: rect(ver).top };
        });
        expect(report.overflow).toBe(0);
        expect(report.btnH).toBeGreaterThanOrEqual(47.5);
        expect(report.stRight).toBeLessThanOrEqual(report.vw);
        expect(report.stBottom).toBeLessThanOrEqual(report.verTop + 1);
      });
    }
  }
});
