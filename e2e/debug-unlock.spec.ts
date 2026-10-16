import { expect, test, type Page } from "@playwright/test";

/**
 * 隠しデバッグモード「全解放」(lib/debugUnlock.ts)。進行データが空の端末で、?debug=unlock で、オンにして確かめる。
 * (URLを渡せない PWA では、設定の v0.0.1 を5回タップして、デバッグ項目から切り替える。切り替えのテストは、単体テスト)
 */
const SIZES = [
  { w: 360, h: 640 },
  { w: 375, h: 667 },
  { w: 360, h: 740 },
  { w: 400, h: 800 },
  { w: 1280, h: 800 },
];

async function openApp(page: Page, query = "") {
  await page.goto(`/${query}`);
  await page.locator(".tap-to-start").click();
  await page.locator(".title-primary").waitFor();
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "横スクロール").toBeLessThanOrEqual(1);
}

test.describe("全解放(デバッグ)", () => {
  test("オフ(ふだん): ホームに目印がなく、エリアは序章だけ入れる。設定にも、デバッグ項目は出ない", async ({ page }) => {
    await openApp(page);
    await expect(page.locator(".debug-unlock-badge")).toHaveCount(0);
    await page.getByRole("button", { name: "せってい" }).click();
    await expect(page.locator(".debug-unlock-panel")).toHaveCount(0);
    await page.getByRole("button", { name: /もどる/ }).first().click();
    await page.locator(".title-primary").click();
    const disabled = await page.locator(".area-list button").evaluateAll((els) => els.filter((e) => (e as HTMLButtonElement).disabled).length);
    expect(disabled).toBe(7);
  });

  test("オン(?debug=unlock): 進行データが空でも、全エリア・全ステージ・ラスボス・言の葉の森が解放済みに見える。切ると、もとにもどる", async ({ page }) => {
    await openApp(page, "?debug=unlock");
    await expect(page.locator(".debug-unlock-badge")).toHaveText("全解放 オン");
    // 言の葉の森: 鍵なし
    await expect(page.locator(".title-forest")).not.toHaveClass(/is-locked/);
    // エリア: すべて押せる
    await page.locator(".title-primary").click();
    const disabled = await page.locator(".area-list button").evaluateAll((els) => els.filter((e) => (e as HTMLButtonElement).disabled).length);
    expect(disabled).toBe(0);
    // 王座の間: ラスボスも、伏せずに、押せる
    await page.locator(".area-list button").last().click();
    // (入口のストーリーが出るときは、スキップして、ステージ選択まで進む)
    for (let i = 0; i < 4; i++) {
      if (await page.locator(".stage-list").count()) break;
      const skip = page.getByRole("button", { name: /スキップ/ });
      if (await skip.count()) await skip.first().click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator(".stage-list")).toBeVisible();
    await expect(page.locator(".stage-list")).not.toContainText("？？？");
    const lockedButtons = await page.locator(".stage-list > li > button:not(.stage-restart)").evaluateAll((els) => els.filter((e) => (e as HTMLButtonElement).disabled).length);
    expect(lockedButtons).toBe(0);
    // 進行データは、空のまま
    const progress = await page.evaluate(() => localStorage.getItem("paku-kokubunpo:progress"));
    expect(progress === null || JSON.parse(progress).state.clearedStageIds.length === 0).toBe(true);
  });

  test("「データを初期化する」のあとも、全解放は、オンのまま(保存されている)", async ({ page }) => {
    await openApp(page, "?debug=unlock");
    await page.getByRole("button", { name: "せってい" }).click();
    await expect(page.locator(".debug-unlock-panel")).toBeVisible(); // オンのときは、5回タップしなくても、項目が出ている
    await page.locator(".settings-reset .quit-button").click();
    await page.getByRole("button", { name: "はい" }).click();
    await page.waitForLoadState("load");
    await page.locator(".tap-to-start").waitFor();
    expect(await page.evaluate(() => localStorage.getItem("paku-kokubunpo-debug:unlock"))).toBe("1");
    expect(await page.evaluate(() => localStorage.getItem("paku-kokubunpo:progress"))).toBeNull();
    await page.locator(".tap-to-start").click();
    await page.locator(".title-primary").waitFor();
    await expect(page.locator(".debug-unlock-badge")).toHaveText("全解放 オン");
  });

  for (const { w, h } of SIZES) {
    for (const large of [false, true]) {
      test(`崩れなし ${w}x${h} ${large ? "大" : "標準"}: ホームの目印(12px)・設定の全解放の項目(スイッチ48px以上)`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await openApp(page, "?debug=unlock");
        if (large) {
          await page.getByRole("button", { name: "せってい" }).click();
          await page.getByRole("radio", { name: "大" }).click();
          await page.getByRole("button", { name: /もどる/ }).first().click();
        }
        // ホーム
        const badge = page.locator(".debug-unlock-badge");
        await expect(badge).toBeVisible();
        const fontSize = await badge.evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
        expect(fontSize).toBe(12);
        const box = (await badge.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(w);
        await expectNoHorizontalOverflow(page);
        // ホームの高さは、目印があっても、変わらない(目印は、レイアウトに入らない)
        const withBadge = await page.evaluate(() => document.documentElement.scrollHeight);
        await badge.evaluate((e) => ((e as HTMLElement).style.display = "none"));
        expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(withBadge);
        // 設定
        await page.getByRole("button", { name: "せってい" }).click();
        const panel = page.locator(".debug-unlock-panel");
        await expect(panel).toBeVisible();
        await expect(panel).toContainText("全解放は、初期化では解除されません");
        const rowH = await panel.locator(".settings-switch-row").evaluate((e) => e.getBoundingClientRect().height);
        expect(rowH).toBeGreaterThanOrEqual(47.5);
        await expectNoHorizontalOverflow(page);
        const clipped = await panel.evaluate((e) => [...e.querySelectorAll<HTMLElement>("p, span, h3")].filter((x) => x.scrollWidth > x.clientWidth + 1).length);
        expect(clipped).toBe(0);
        if (w === 360 && h === 740 && !large) await expect(page.locator(".screen-settings")).toHaveScreenshot("settings-debug-unlock.png");
      });
    }
  }
});
