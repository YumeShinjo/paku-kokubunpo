import { expect, test, type Page } from "@playwright/test";
import { startApp } from "./helpers";

/**
 * せってい画面の整理(5つの見出し・おと・つかいかた・ひきつぎコード・このアプリについて・いちばん下の初期化)。
 * 5つの画面サイズ × 文字サイズ(標準・大)で、横はみ出しがなく、押せるものが十分な大きさで、見出しの上の余白が下より大きいことを確かめる。
 */
const SIZES = [
  { w: 360, h: 640 },
  { w: 375, h: 667 },
  { w: 360, h: 740 },
  { w: 400, h: 800 },
  { w: 1280, h: 800 },
];

async function openSettings(page: Page, large: boolean) {
  await startApp(page);
  await page.getByRole("button", { name: "せってい" }).click();
  await expect(page.getByRole("heading", { name: "せってい" })).toBeVisible();
  if (large) await page.getByRole("radio", { name: "大" }).click();
}

for (const { w, h } of SIZES) {
  for (const large of [false, true]) {
    test(`せってい ${w}x${h} ${large ? "大" : "標準"}: 並び・大きさ・余白`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await openSettings(page, large);

      await page.evaluate(() => document.fonts.ready); // フォントの読み込みが終わってから測る(読み込み前は、文字の幅・行の高さが違う)
      const report = await page.evaluate(() => {
        const rect = (e: Element) => e.getBoundingClientRect();
        const screen = document.querySelector(".screen-settings")!;
        const headings = [...screen.querySelectorAll<HTMLElement>(".settings-heading")];
        const spacing = headings.map((hd) => {
          const section = hd.closest(".settings-section")!;
          const prev = section.previousElementSibling!;
          const next = hd.nextElementSibling!;
          return { name: hd.textContent!.trim(), above: rect(hd).top - rect(prev).bottom, below: rect(next).top - rect(hd).bottom };
        });
        const buttons = [...screen.querySelectorAll<HTMLElement>("button, a.contact-link")].filter((b) => !b.closest(".text-size-buttons") || true);
        const small = buttons
          .filter((b) => rect(b).height < 47.5 && !b.classList.contains("back-button") && !b.closest(".back-button"))
          .map((b) => `${(b.textContent || "").trim().slice(0, 12)}(${Math.round(rect(b).height)})`);
        const ranges = [...screen.querySelectorAll<HTMLInputElement>('input[type="range"]')].map((i) => rect(i).height);
        const sw = screen.querySelector<HTMLElement>(".settings-switch-row")!;
        const pairs = [...screen.querySelectorAll<HTMLElement>(".settings-pair")].map((p) => {
          const [a, b] = [...p.children].map((c) => rect(c));
          return { wA: a.width, wB: b.width, hA: a.height, hB: b.height };
        });
        const rowLabels = [...screen.querySelectorAll<HTMLElement>(".settings-row > span:first-child")].map((s) => ({
          h: rect(s).height,
          fs: parseFloat(getComputedStyle(s).fontSize),
        }));
        const clipped = [...screen.querySelectorAll<HTMLElement>("button")].filter((b) => b.scrollHeight > b.clientHeight + 1 || b.scrollWidth > b.clientWidth + 1).map((b) => (b.textContent || "").trim());
        const reset = screen.querySelector<HTMLElement>(".settings-reset .quit-button")!;
        const lastLinkRow = [...screen.querySelectorAll<HTMLElement>(".settings-version")][0];
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          spacing,
          small,
          ranges,
          switchH: rect(sw).height,
          pairs,
          rowLabels,
          clipped,
          resetH: rect(reset).height,
          resetGap: rect(reset).top - rect(lastLinkRow).bottom,
          resetBottom: rect(reset).bottom + window.scrollY,
          docH: document.documentElement.scrollHeight,
          order: [...screen.querySelectorAll<HTMLElement>(".settings-heading, .settings-reset")].map((e) => (e.textContent || "").trim()),
        };
      });

      expect(report.overflow, "横スクロール").toBeLessThanOrEqual(1);
      // 見出しの順(最後は、ふりがな付きの「データを初期化する」)
      const expectedOrder = ["もじのおおきさ", "おと", "つかいかた", "ひきつぎコード", "このアプリについて", "データを初期化"];
      expect(report.order).toHaveLength(expectedOrder.length);
      expectedOrder.forEach((head, i) => expect(report.order[i].replace(/\s+/g, "").startsWith(head), `${i}番目: ${report.order[i]}`).toBe(true));
      for (const sp of report.spacing) expect(sp.above, `${sp.name}: 上の余白が、下の余白の2倍以上`).toBeGreaterThanOrEqual(sp.below * 2);
      expect(report.small, "高さ48px未満のボタン").toEqual([]);
      for (const rh of report.ranges) expect(rh).toBeGreaterThanOrEqual(44);
      expect(report.switchH).toBeGreaterThanOrEqual(48);
      for (const p of report.pairs) {
        expect(Math.abs(p.wA - p.wB), "横2つは、同じ幅").toBeLessThanOrEqual(1);
        expect(Math.abs(p.hA - p.hB), "横2つは、同じ高さ").toBeLessThanOrEqual(1);
      }
      for (const l of report.rowLabels) expect(l.h, "このアプリについての行は、1行に収まる").toBeLessThan(l.fs * 1.7);
      expect(report.clipped, "文字が、ボタンからはみ出していない").toEqual([]);
      expect(report.resetGap, "初期化は、ほかと十分に離れている").toBeGreaterThanOrEqual(36);
      console.log(`SETTINGS ${w}x${h} ${large ? "大" : "標準"}: docHeight=${report.docH}`);
      // デバッグ項目を出していないとき、設定画面の高さは、これまでと変わらない(幅360のとき: 標準 1,232px / 大 1,498px)
      if (w === 360) expect(report.docH, "デバッグ項目を出していない設定画面の高さ").toBe(large ? 1498 : 1232);
    });
  }
}

test("せってい: 画面の全体(スクロールした全体)のスクリーンショット", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openSettings(page, false);
  await expect(page).toHaveScreenshot("settings-full.png", { fullPage: true });
});

test.describe("せってい: 音のログ(調査用。ふだんは見えない)", () => {
  test("ふだんは出ない。バージョン表記の当たり判定は44px以上で、5回続けてタップすると出る", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await openSettings(page, false);
    await expect(page.locator(".audio-debug-panel")).toHaveCount(0);

    // 当たり判定(::after で広げた領域)を、見た目の位置から下へたどって確かめる: バージョン表記の少し下をタップしても反応する
    const version = page.locator(".settings-version");
    await version.scrollIntoViewIfNeeded();
    const box = (await version.boundingBox())!;
    const hit = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.className ?? "",
      { x: box.x + box.width / 2, y: box.y + box.height + 20 },
    );
    expect(hit).toContain("settings-version");
    const extent = await page.evaluate(() => {
      const e = document.querySelector<HTMLElement>(".settings-version")!;
      const after = getComputedStyle(e, "::after");
      return e.getBoundingClientRect().height + parseFloat(after.top) * -1 + parseFloat(after.bottom) * -1;
    });
    expect(extent).toBeGreaterThanOrEqual(44);

    for (let i = 0; i < 5; i++) await version.click({ position: { x: 20, y: 4 } });
    await expect(page.locator(".audio-debug-panel")).toBeVisible();
    await expect(page.locator(".audio-debug-panel input[role='switch']").first()).not.toBeChecked();
  });

  test("?audiodebug=1 で一度開くと、そのあとURLなしで開き直しても(ホーム画面から起動しても)出る", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/?audiodebug=1");
    await page.locator(".tap-to-start").click();
    await page.locator(".title-primary").waitFor();
    await page.getByRole("button", { name: "せってい" }).click();
    await expect(page.locator(".audio-debug-panel")).toBeVisible();
    await expect(page.locator(".audio-debug-panel input[role='switch']").first()).toBeChecked();
    // URLにパラメータなしで開き直す
    await page.goto("/");
    await startApp(page);
    await page.getByRole("button", { name: "せってい" }).click();
    await expect(page.locator(".audio-debug-panel")).toBeVisible();
    await expect(page.locator(".audio-debug-panel input[role='switch']").first()).toBeChecked();
    // 押せるものは、48px以上
    const heights = await page.locator(".audio-debug-panel button, .audio-debug-panel .settings-switch-row").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(47.5);
    expect(await page.locator(".audio-debug-mark").count()).toBe(1);
    await expect(page.locator(".screen-settings")).toHaveScreenshot("settings-audiolog.png");
  });
});

for (const { w, h } of [SIZES[0], SIZES[2], SIZES[4]]) {
  for (const large of [false, true]) {
    test(`せってい(音のログを出したとき) ${w}x${h} ${large ? "大" : "標準"}: 崩れない`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/?audiodebug=1");
      await page.locator(".tap-to-start").click();
      await page.locator(".title-primary").waitFor();
      await page.getByRole("button", { name: "せってい" }).click();
      if (large) await page.getByRole("radio", { name: "大" }).click();
      await expect(page.locator(".audio-debug-mark")).toBeVisible();
      const report = await page.evaluate(() => {
        const panel = document.querySelector(".audio-debug-panel")!;
        const rect = (e: Element) => e.getBoundingClientRect();
        const targets = [...panel.querySelectorAll("button, .settings-switch-row")].map((e) => ({ t: (e.textContent || "").trim(), h: rect(e).height }));
        const clipped = [...panel.querySelectorAll<HTMLElement>("button, .settings-switch-row span")].filter((b) => b.scrollWidth > b.clientWidth + 1).map((b) => (b.textContent || "").trim());
        return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, targets, clipped };
      });
      expect(report.overflow).toBeLessThanOrEqual(1);
      for (const t of report.targets) expect(t.h, t.t).toBeGreaterThanOrEqual(47.5);
      expect(report.clipped).toEqual([]);
    });
  }
}
