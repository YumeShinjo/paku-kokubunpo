import { expect, test, type Page } from "@playwright/test";
import { clearedStagesThrough, seedProgress, startApp } from "./helpers";

/**
 * 物語の台詞の枠が、画面に収まること(文字サイズ「大」でも)。
 * 以前は、文字サイズ「大」のとき、立ち絵の領域の最低の高さ(19rem)と、大きくした台詞の枠(16.5rem)を足すと画面より高くなり、
 * 360×640 で約35px、375×667 で約8px、枠の下が画面より下に出ていた。
 * 画面が縦にスクロールできる状態だったので、タップで次の行に進むと、画面が自動で下に動いて、「最初の1行だけ下に出ている」ように見えた。
 */
const SCENES = ["prologue-intro", "sugatakaeNoKajiba-area-clear", "namerakaNoTaki-subboss-intro", "ohzaNoMa-lastboss-intro"];

async function openStory(page: Page, eventId: string) {
  await seedProgress(page, clearedStagesThrough(["prologue"]));
  await startApp(page);
  await page.evaluate(async (id) => {
    const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/app\/store\/navigationStore\.ts/.test(u))!;
    (await import(/* @vite-ignore */ entry)).useNavigationStore.getState().goTo({ name: "story", eventId: id, next: { name: "title" } });
  }, eventId);
  await page.locator(".story-textbox").waitFor();
}

const scrollable = (page: Page) => page.evaluate(() => ({ over: document.documentElement.scrollHeight - innerHeight, y: scrollY }));

for (const [width, height] of [[360, 640], [375, 667]] as const) {
  for (const large of [false, true]) {
    test(`${width}×${height} ${large ? "大" : "標準"}: 台詞の枠が画面内に収まり、画面は縦にスクロールしない(各場面の1行目から最後まで)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      for (const scene of SCENES) {
        await openStory(page, scene);
        if (large) await page.evaluate(() => (document.documentElement.dataset.textSize = "large"));
        await page.waitForTimeout(400);
        for (let i = 0; i < 40; i++) {
          const wrap = page.locator(".story-textbox-wrap");
          if (!(await wrap.isVisible().catch(() => false))) break;
          const box = (await wrap.boundingBox())!;
          const where = `${scene} 行${i + 1}`;
          expect(box.y + box.height, `${where}: 枠の下`).toBeLessThanOrEqual(height + 0.5);
          const s = await scrollable(page);
          expect(s.over, `${where}: 画面が縦にスクロールできる`).toBeLessThanOrEqual(1);
          expect(s.y, `${where}: 自動で下に動いている`).toBe(0);
          // 立ち絵の領域は、つぶれすぎない
          const stage = (await page.locator(".story-stage").boundingBox())!;
          expect(stage.height, `${where}: 立ち絵の領域`).toBeGreaterThanOrEqual(190);
          // 「▼ タップ」の合図も、画面の中
          const hint = page.locator(".story-tap-hint");
          if (await hint.isVisible().catch(() => false)) expect((await hint.boundingBox())!.y + (await hint.boundingBox())!.height, `${where}: ▼`).toBeLessThanOrEqual(height);
          if (process.env.VERDICT_SHOTS && i === 0 && scene === "prologue-intro") {
            await page.screenshot({ path: `${process.env.VERDICT_SHOTS}/S2-story-first-${width}x${height}${large ? "-large" : ""}.png` });
          }
          await page.locator(".story-textbox").click();
          await page.waitForTimeout(40);
        }
      }
    });
  }
}
