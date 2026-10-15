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
    });
  }
}

test("せってい: 画面の全体(スクロールした全体)のスクリーンショット", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await openSettings(page, false);
  await expect(page).toHaveScreenshot("settings-full.png", { fullPage: true });
});
