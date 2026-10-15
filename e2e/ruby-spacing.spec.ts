import { existsSync } from "node:fs";
import { expect, test, webkit, type Page } from "@playwright/test";
import { startApp } from "./helpers";

/**
 * ふりがな(rt)と漢字の間隔・行間を、Chromium と WebKit(iPhone の Safari と同じエンジン)の両方で測る。
 * 標準のふりがな(<ruby>)の配置は、ブラウザごとに間隔・行の広がり方が大きく違った(iPhone では、Chromium の約3倍)ため、
 * CSS grid で漢字の真上に置いている(styles/global.css の「ruby」)。これが、どのエンジンでも同じ寸法になっているかを確かめる。
 *  - 間隔: ふりがなの見える下端から、漢字の見える上端まで(拡大した画像で測る)。文字の大きさの 0.05〜0.30 倍
 *  - ばらつき: 3行以上の文章で、隣り合う行の間隔の最大 − 最小。0(ふりがなのある行だけが広がらない)
 *  - 重なり: ふりがなが、1つ前の行の文字に食い込まない
 * WebKit は、インストールされているときだけ測る(npx playwright install webkit)。入っていない環境(CIなど)では、飛ばす。
 */
const WEBKIT_INSTALLED = (() => {
  try {
    return existsSync(webkit.executablePath());
  } catch {
    return false;
  }
})();

/** ことだまの書「ぶんぽう」の、はじめの項目を開いて、ふりがな付きの文章を出す */
async function openGrammarPage(page: Page) {
  await startApp(page);
  await page.locator(".sub-book").click();
  await page.getByRole("tab", { name: "ぶんぽうの ずかん" }).click();
  await page.locator("details.zukan-page summary").first().click();
  await page.waitForTimeout(300);
}

/** 画面に見えているふりがなの、間隔(文字の大きさに対する倍率)を、拡大した画像から測る */
async function measureGaps(page: Page): Promise<number[]> {
  const dpr = await page.evaluate(() => window.devicePixelRatio);
  const shot = (await page.screenshot()).toString("base64");
  const rects = await page.evaluate(() =>
    [...document.querySelectorAll("ruby")]
      .filter((r) => r.offsetParent !== null)
      .map((r) => {
        const b = r.getBoundingClientRect();
        const rt = r.querySelector("rt")!.getBoundingClientRect();
        const base = r.querySelector(".ruby-base")!.getBoundingClientRect();
        return { x: b.left, y: rt.top - 4, w: b.width, h: base.bottom - rt.top + 6, fs: parseFloat(getComputedStyle(r).fontSize), visible: rt.top > 6 && base.bottom < innerHeight - 6 && b.width > 4 };
      })
      .filter((r) => r.visible),
  );
  return page.evaluate(
    async ([b64, dpr, rects]) => {
      const img = new Image();
      img.src = "data:image/png;base64," + b64;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const g = canvas.getContext("2d")!;
      g.drawImage(img, 0, 0);
      const out: number[] = [];
      for (const r of rects as { x: number; y: number; w: number; h: number; fs: number }[]) {
        const x0 = Math.max(0, Math.floor(r.x * (dpr as number)));
        const y0 = Math.max(0, Math.floor(r.y * (dpr as number)));
        const w = Math.min(canvas.width - x0, Math.ceil(r.w * (dpr as number)));
        const h = Math.min(canvas.height - y0, Math.ceil(r.h * (dpr as number)));
        if (w <= 0 || h <= 0) continue;
        const d = g.getImageData(x0, y0, w, h).data;
        const dark: boolean[] = [];
        for (let y = 0; y < h; y++) {
          let any = false;
          for (let x = 0; x < w && !any; x++) {
            const i = (y * w + x) * 4;
            if (d[i] < 150 && d[i + 1] < 150 && d[i + 2] < 150) any = true;
          }
          dark.push(any);
        }
        const groups: [number, number][] = [];
        dark.forEach((v, y) => {
          if (!v) return;
          const last = groups[groups.length - 1];
          if (last && y - last[1] <= 1) last[1] = y;
          else groups.push([y, y]);
        });
        // 上の塊=ふりがな、次の塊=漢字。2つに分かれて見えるものだけ測る
        if (groups.length >= 2) out.push((groups[1][0] - groups[0][1] - 1) / (dpr as number) / r.fs);
      }
      return out;
    },
    [shot, dpr, rects] as const,
  );
}

/** 3行以上の文章の、行の間隔のばらつき(最大 − 最小)の最大値と、ふりがなが前の行に食い込む量の最大値 */
async function measureLines(page: Page) {
  return page.evaluate(() => {
    const blocks = [...new Set([...document.querySelectorAll(".ruby-text")].map((e) => e.parentElement!))].filter(
      (el) => el.offsetParent !== null && el.querySelector("rt") && getComputedStyle(el).display !== "inline",
    );
    let spread = 0;
    let overlap = 0;
    let measured = 0;
    for (const el of blocks) {
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const rects: DOMRect[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent!.trim() || n.parentElement!.closest("rt")) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) rects.push(r);
      }
      const lines: { top: number; bottom: number }[] = [];
      for (const r of rects.sort((a, b) => a.top - b.top)) {
        const last = lines[lines.length - 1];
        if (last && Math.abs(r.top - last.top) < fs * 0.35) {
          last.top = Math.min(last.top, r.top);
          last.bottom = Math.max(last.bottom, r.bottom);
        } else lines.push({ top: r.top, bottom: r.bottom });
      }
      for (const rt of el.querySelectorAll("rt")) {
        const box = rt.getBoundingClientRect();
        if (box.width === 0) continue;
        const k = lines.findIndex((l) => box.bottom <= l.bottom + 0.5 && box.bottom >= l.top - fs);
        if (k > 0) overlap = Math.max(overlap, lines[k - 1].bottom - box.top);
      }
      if (lines.length < 3) continue;
      const pitches = lines.slice(1).map((l, i) => l.top - lines[i].top);
      spread = Math.max(spread, Math.max(...pitches) - Math.min(...pitches));
      measured++;
    }
    return { spread, overlap, measured };
  });
}

async function checkEngine(page: Page) {
  await openGrammarPage(page);
  const gaps = await measureGaps(page);
  expect(gaps.length, "測れたふりがなの数").toBeGreaterThanOrEqual(3);
  const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  expect(mean, `間隔の平均(文字の大きさの倍率)。測った値: ${gaps.map((g) => g.toFixed(2)).join(" ")}`).toBeGreaterThanOrEqual(0.08);
  expect(mean).toBeLessThanOrEqual(0.3);
  const lines = await measureLines(page);
  expect(lines.measured, "3行以上の、ふりがな付きの文章の数").toBeGreaterThan(0);
  expect(lines.spread, "行の間隔のばらつき(px)。ふりがなのある行だけ広がると、0より大きくなる").toBeLessThan(0.5);
  expect(lines.overlap, "ふりがなが、1つ前の行に食い込む量(px)").toBeLessThanOrEqual(0.5);
}

test.describe("ふりがなの間隔と行間", () => {
  // 間隔(約3px)を測るため、拡大して撮る
  test.use({ deviceScaleFactor: 3, viewport: { width: 360, height: 740 } });

  test("Chromium: 間隔は文字の大きさの0.08〜0.3倍、行のばらつき0、前の行に重ならない", async ({ page }) => {
    await checkEngine(page);
  });

  test("WebKit(iPhoneのSafariと同じエンジン): Chromiumと同じ寸法になる(WebKitが入っているときだけ)", async () => {
    test.skip(!WEBKIT_INSTALLED, "WebKit が入っていない(npx playwright install webkit)ので、飛ばす");
    test.setTimeout(60_000); // WebKit は、ほかのテストと同時に動くと遅くなることがある
    const browser = await webkit.launch();
    try {
      const context = await browser.newContext({ baseURL: "http://localhost:5183", viewport: { width: 360, height: 740 }, deviceScaleFactor: 3 });
      const page = await context.newPage();
      await checkEngine(page);
    } finally {
      await browser.close();
    }
  });
});
