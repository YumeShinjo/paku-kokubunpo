import { expect, test, type Page } from "@playwright/test";
import { getAllQuestions } from "../src/data/questionLoader";
import { getStagesForArea } from "../src/data/stages";
import { startApp } from "./helpers";

/**
 * 小ボス戦に負けたときの画面(「もういちど」「先へすすむ」「もどる」)と、連敗の救済(ライフ+1)のE2E。
 * ライフ1の途中経過を差し込んで、外れの選択肢を押し、ライフがなくなるところまで、実際の画面で進める。
 */
const AREA = "kotobaNoIchiba";
const STAGE = `${AREA}-subboss`;
const choiceQuestions = getAllQuestions()
  .filter((q) => q.engine === "choice" && q.display !== "tapInSentence")
  .slice(0, 4);

async function seed(page: Page, losses: number) {
  const before = ["prologue"].flatMap((a) => getStagesForArea(a).map((s) => s.id));
  const normals = getStagesForArea(AREA).filter((s) => s.type === "normal").map((s) => s.id);
  await page.addInitScript(
    ([cleared, stage, ids, lossCount]) => {
      localStorage.setItem(
        "paku-kokubunpo:progress",
        JSON.stringify({ state: { clearedStageIds: cleared, totalScore: 100, bossLosses: lossCount > 0 ? { [stage]: lossCount } : {}, assistedStageIds: [] }, version: 0 }),
      );
      localStorage.setItem("paku-kokubunpo:tutorial", JSON.stringify({ state: { seenGuides: ["zukan", "sorting", "choice", "assembly"] }, version: 0 }));
      localStorage.setItem(
        "paku-kokubunpo:session",
        JSON.stringify({
          state: { active: { stageId: stage, areaId: "kotobaNoIchiba", questionIds: ids, index: 0, correctCount: 0, combo: 0, maxCombo: 0, hp: 12, lives: 1 } },
          version: 0,
        }),
      );
    },
    [[...before, ...normals], STAGE, choiceQuestions.map((q) => q.id), losses] as const,
  );
}

/** ライフ1の小ボス戦で、外れを押して、負けた画面まで進める */
async function loseOnce(page: Page) {
  await startApp(page);
  await page.evaluate(async (stage) => {
    const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/app\/store\/navigationStore\.ts/.test(u))!;
    (await import(/* @vite-ignore */ entry)).useNavigationStore.getState().goTo({ name: "stage", areaId: "kotobaNoIchiba", stageId: stage });
  }, STAGE);
  await page.locator(".engine-choice").waitFor();
  const q = choiceQuestions[0];
  if (q.engine !== "choice") throw new Error("choice only");
  const wrongIndex = q.choices.findIndex((c) => c.id !== q.correctChoiceId);
  await page.locator(".engine-choice-list button").nth(wrongIndex).click();
  await page.locator(".feedback-next").first().click();
  await expect(page.locator("h2")).toHaveText("ライフが なくなっちゃった…");
}

async function boxes(page: Page, selectors: string[]) {
  const out: Record<string, { x: number; y: number; width: number; height: number }> = {};
  for (const s of selectors) out[s] = (await page.locator(s).first().boundingBox())!;
  return out;
}

const noScroll = (page: Page) => page.evaluate(() => ({ x: document.documentElement.scrollWidth - innerWidth, y: document.documentElement.scrollHeight - innerHeight }));

test.describe("小ボスに負けた画面", () => {
  test("1回目に負けたとき: 「もういちど」は横いっぱい、その下に平らな「もどる」。「先へすすむ」は出ない", async ({ page }) => {
    await seed(page, 0);
    await loseOnce(page);
    await expect(page.getByRole("button", { name: "先へすすむ" })).toHaveCount(0);
    const b = await boxes(page, [".stage-result-primary", ".stage-result-back"]);
    expect(b[".stage-result-primary"].height).toBeGreaterThanOrEqual(48);
    expect(b[".stage-result-back"].height).toBeGreaterThanOrEqual(48);
    expect(b[".stage-result-back"].y).toBeGreaterThan(b[".stage-result-primary"].y + b[".stage-result-primary"].height - 1);
    const vp = page.viewportSize()!;
    expect(b[".stage-result-primary"].width).toBeGreaterThan(vp.width - 80); // 横いっぱい
    // 「もどる」は平ら(影・背景なし)
    expect(await page.locator(".stage-result-back").evaluate((e) => getComputedStyle(e).boxShadow)).toBe("none");
    expect(await noScroll(page)).toEqual({ x: 0, y: expect.any(Number) });
    expect((await noScroll(page)).y).toBeLessThanOrEqual(0);
    await expect(page).toHaveScreenshot("boss-loss-first.png");
  });

  test("同じボスに2回目に負けたとき: 「もういちど」と「先へすすむ」が同じ幅で横に並ぶ(1行)。「もどる」は、その下", async ({ page }) => {
    await seed(page, 1);
    await loseOnce(page);
    const b = await boxes(page, [".stage-result-primary", ".stage-result-secondary", ".stage-result-back"]);
    const p = b[".stage-result-primary"];
    const s = b[".stage-result-secondary"];
    expect(Math.abs(p.width - s.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(p.y - s.y)).toBeLessThanOrEqual(1); // 1行に並ぶ
    expect(s.x).toBeGreaterThan(p.x + p.width - 1);
    expect(p.height).toBeGreaterThanOrEqual(48);
    expect(s.height).toBeGreaterThanOrEqual(48);
    expect(Math.abs(p.height - s.height)).toBeLessThanOrEqual(1);
    expect(b[".stage-result-back"].y).toBeGreaterThan(p.y + p.height - 1);
    // 文字が折り返さない(1行の高さ)
    for (const sel of [".stage-result-primary", ".stage-result-secondary"]) {
      expect(await page.locator(sel).evaluate((e) => e.scrollHeight <= e.clientHeight + 1 && e.scrollWidth <= e.clientWidth + 1), sel).toBe(true);
    }
    expect((await noScroll(page)).x).toBe(0);
    expect((await noScroll(page)).y).toBeLessThanOrEqual(0);
    await expect(page).toHaveScreenshot("boss-loss-assist.png");
  });

  test("文字サイズ「大」でも、折り返し・はみ出し・縦スクロールが出ない(「先へすすむ」あり)", async ({ page }) => {
    await seed(page, 1);
    await loseOnce(page);
    await page.evaluate(() => {
      document.documentElement.dataset.textSize = "large";
    });
    const b = await boxes(page, [".stage-result-primary", ".stage-result-secondary", ".stage-result-back"]);
    expect(Math.abs(b[".stage-result-primary"].y - b[".stage-result-secondary"].y)).toBeLessThanOrEqual(1);
    expect(b[".stage-result-primary"].height).toBeGreaterThanOrEqual(48);
    for (const sel of [".stage-result-primary", ".stage-result-secondary"]) {
      expect(await page.locator(sel).evaluate((e) => e.scrollHeight <= e.clientHeight + 1 && e.scrollWidth <= e.clientWidth + 1), sel).toBe(true);
    }
    const scroll = await noScroll(page);
    expect(scroll.x).toBe(0);
    expect(scroll.y).toBeLessThanOrEqual(0);
  });

  test("「もういちど」で、ライフが1ふえて(6つ)、「ライフが 1 ふえたよ!」の一言が出る", async ({ page }) => {
    await seed(page, 0);
    await loseOnce(page);
    await page.getByRole("button", { name: "もういちど" }).click();
    await expect(page.locator(".boss-life-note")).toHaveText("ライフが 1 ふえたよ!(ぜんぶで 6つ)");
    await page.locator(".stage-intro .feedback-next").click();
    await expect(page.locator(".player-lives")).toHaveAttribute("aria-label", "ライフ 6 / 6");
    expect(await page.locator(".player-lives .life-icon").count()).toBe(6);
  });

  test("「先へすすむ」で、コトの助太刀の場面へ。場面のあと、撃破後の会話へ進み、ステージ選択に「たすけてもらった」の印が出る", async ({ page }) => {
    await seed(page, 1);
    await loseOnce(page);
    await page.getByRole("button", { name: "先へすすむ" }).click();
    await expect(page.locator(".story-textbox")).toContainText("コトに まかせて");
    for (let i = 0; i < 4; i++) {
      await page.locator(".screen-story").click({ position: { x: 20, y: 120 } });
      await page.waitForTimeout(120);
    }
    // 撃破後の会話を飛ばして、ステージ選択へ
    for (let i = 0; i < 6; i++) {
      const skip = page.locator(".story-skip");
      if (await skip.isVisible().catch(() => false)) {
        await skip.click();
        await page.waitForTimeout(120);
      }
    }
    await expect(page.locator(".stage-assisted-mark")).toBeVisible();
    await expect(page.locator(".stage-assisted-mark")).toContainText("たすけてもらった");
  });
});
