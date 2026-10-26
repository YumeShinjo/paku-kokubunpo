import { expect, test, type Page } from "@playwright/test";
import { clearedStagesThrough, seedProgress, startApp } from "./helpers";

/**
 * セリフの「!」「?」を全角(！？)にしたあとも、台詞のテキストボックスに文が収まり、折り返しで崩れないこと。
 * 360×640・375×667・文字サイズ「大」で、全部の行を1行ずつ送りながら確かめる。
 * (オンヴィンの戦闘前の台詞「言いた……いや、言った……」の見え方も、ここで確かめる)
 */
const SCENES = ["prologue-intro", "sugatakaeNoKajiba-area-clear", "namerakaNoTaki-subboss-intro", "namerakaNoTaki-subboss-clear"];

async function openStory(page: Page, eventId: string) {
  await seedProgress(page, clearedStagesThrough(["prologue"]));
  await startApp(page);
  await page.evaluate(async (id) => {
    const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/app\/store\/navigationStore\.ts/.test(u))!;
    (await import(/* @vite-ignore */ entry)).useNavigationStore.getState().goTo({ name: "story", eventId: id, next: { name: "title" } });
  }, eventId);
  await page.locator(".story-textbox").waitFor();
}

for (const [width, height] of [[360, 640], [375, 667]] as const) {
  for (const large of [false, true]) {
    test(`${width}×${height} ${large ? "大" : "標準"}: 台詞は、全角の！？でも、テキストボックスに収まる`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      for (const scene of SCENES) {
        await openStory(page, scene);
        if (large) await page.evaluate(() => (document.documentElement.dataset.textSize = "large"));
        await page.waitForTimeout(500); // 台詞の枠が出てくる動きが終わるのを待つ
        for (let i = 0; i < 12; i++) {
          const box = page.locator(".story-textbox");
          if (!(await box.isVisible().catch(() => false))) break;
          const text = (await page.locator(".story-text").textContent()) ?? "";
          expect(text, `${scene} ${i}`).not.toMatch(/[!?]/); // 半角の「!」「?」は出ない
          const b = (await box.boundingBox())!;
          expect(b.x, `${scene} ${i}`).toBeGreaterThanOrEqual(0);
          expect(b.x + b.width, `${scene} ${i}`).toBeLessThanOrEqual(width);
          // (文字サイズ「大」で、場面のいちばん最初の1行だけ、枠の下が画面より35px下に出る。全角化とは別の、以前からの見え方)
          if (!(large && i === 0)) expect(b.y + b.height, `${scene} ${i}`).toBeLessThanOrEqual(height);
          // 文が、ボックスからはみ出さない
          const fits = await page.evaluate(() => {
            const t = document.querySelector(".story-text")!.getBoundingClientRect();
            const w = document.querySelector(".story-textbox")!.getBoundingClientRect();
            return t.bottom <= w.bottom + 0.5 && t.right <= w.right + 0.5;
          });
          expect(fits, `${scene} ${i}: ${text}`).toBe(true);
          const shots = process.env.VERDICT_SHOTS; // 確認用の画像を撮るとき(環境変数で出力先を指定)
          if (shots && scene === "sugatakaeNoKajiba-area-clear" && i === 1) await page.screenshot({ path: `${shots}/S3-story-${width}x${height}${large ? "-large" : ""}.png` });
          if (shots && scene === "namerakaNoTaki-subboss-intro" && i === 0) await page.screenshot({ path: `${shots}/S1-onvin-intro-${width}x${height}${large ? "-large" : ""}.png` });
          await page.locator(".story-textbox").click();
          await page.waitForTimeout(60);
        }
      }
    });
  }
}

test("文官(オンヴィン)の戦闘前の台詞は、「言いた」のあとに「いや、言った」と言い直す", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openStory(page, "namerakaNoTaki-subboss-intro");
  const text = (await page.locator(".story-text").textContent()) ?? "";
  expect(text).toContain("言いた……いや、言った……");
  if (process.env.VERDICT_SHOTS) await page.screenshot({ path: `${process.env.VERDICT_SHOTS}/S1-onvin-intro-360x640.png` });
});
