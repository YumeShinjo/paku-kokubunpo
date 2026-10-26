import { expect, test, type Page } from "@playwright/test";
import { getAllQuestions } from "../src/data/questionLoader";
import type { SortingQuestion } from "../src/data/schema";
import { clearedStagesThrough, seedProgress, startApp } from "./helpers";

/**
 * 仕分け: 1回外して、2回目で全部合ったときの表示。
 * 集計は、1回目で決まる(不正解扱い。星がつく)ので、変えない。表示だけ、「2かいめで せいかい!」と、できたことを認める。
 * 不正解向けの文言(「大丈夫、次はいけるよ」など)と、正解の大きな演出(きらきら・コンボの顔)は出さない。
 * 2回目も外したときは、これまでどおり「ざんねん」の表示。
 */
const QUESTION_ID = "ichiba-pos-batch-01";
const STAGE_ID = "kotobaNoIchiba-stage1";
const found = getAllQuestions().find((q) => q.id === QUESTION_ID)!;
if (found.engine !== "sorting") throw new Error("sorting only");
const question: SortingQuestion = found;

async function openQuestion(page: Page) {
  await seedProgress(page, clearedStagesThrough(["prologue"]));
  await page.addInitScript(
    ([stageId, questionId]) => {
      localStorage.setItem("paku-kokubunpo:tutorial", JSON.stringify({ state: { seenGuides: ["zukan", "sorting", "choice", "assembly", "paku"] }, version: 0 }));
      localStorage.setItem(
        "paku-kokubunpo:session",
        JSON.stringify({ state: { active: { stageId, areaId: "kotobaNoIchiba", questionIds: [questionId, questionId, questionId], index: 0, correctCount: 0, combo: 4, maxCombo: 4, hp: 0 } }, version: 0 }),
      );
    },
    [STAGE_ID, QUESTION_ID],
  );
  await startApp(page);
  await page.evaluate(async (stageId) => {
    const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/app\/store\/navigationStore\.ts/.test(u))!;
    (await import(/* @vite-ignore */ entry)).useNavigationStore.getState().goTo({ name: "stage", areaId: "kotobaNoIchiba", stageId });
  }, STAGE_ID);
  await page.locator(".engine-sorting").waitFor();
}

/** カードをタップして選び、カゴのラベルをタップして入れる */
async function place(page: Page, itemId: string, categoryId: string) {
  await page.locator(`[data-item-id="${itemId}"]`).first().click();
  await page.locator(`.sorting-basket[data-category-id="${categoryId}"] .sorting-basket-label`).click();
}

/** 全部、正しいカゴに入れる。wrongItemId のカードだけ、別のカゴに入れる(省略すると、全部正しい) */
async function placeAll(page: Page, wrongItemId?: string) {
  for (const item of question.items) {
    if (item.id === wrongItemId) {
      const other = question.categories.find((c) => c.id !== item.correctCategoryId)!;
      await place(page, item.id, other.id);
    } else {
      await place(page, item.id, item.correctCategoryId);
    }
  }
}

const submit = (page: Page) => page.getByRole("button", { name: "こたえる" });
const firstItem = question.items[0];

test.describe("仕分け: 1回外して、2回目で全部合ったとき", () => {
  test("見出しは「2かいめで せいかい!」と短い一言。不正解向けの文言・きらきら・コンボの顔は出ない。星はつく(集計は不正解のまま)", async ({ page }) => {
    await openQuestion(page);
    await placeAll(page, firstItem.id);
    await submit(page).click(); // 1回目: 1枚外れる → 外したカードだけ戻る(ポップアップは出ない)
    await expect(page.locator(".sorting-retry-note")).toContainText("あと1枚");
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await place(page, firstItem.id, firstItem.correctCategoryId); // 2回目で直す
    await submit(page).click();

    const dialog = page.getByRole("dialog", { name: "2かいめで せいかい" });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".verdict")).toHaveText("2かいめで せいかい!");
    await expect(dialog.locator(".feedback-recovered-hint")).toHaveText("もういちど ふくしゅうしてみよう");
    // 不正解向けの文言は出ない
    const text = (await dialog.textContent()) ?? "";
    for (const word of ["大丈夫", "次はいけるよ", "ちょっと違った", "間違えても", "おしい", "復習しよう", "ざんねん"]) expect(text, word).not.toContain(word);
    // 大きな演出(きらきら・ポップ・きらめき)は出ない。顔は「しょんぼり」でも「コンボ」でもない
    await expect(dialog.locator(".sparkles")).toHaveCount(0);
    expect(await dialog.getAttribute("class")).not.toMatch(/effect-/);
    await expect(dialog).not.toHaveClass(/feedback-incorrect/);
    await expect(dialog).toHaveClass(/feedback-recovered/);
    // 集計は、1回目で決まる(不正解): 星がつく
    const starred = await page.evaluate(() => JSON.parse(localStorage.getItem("paku-kokubunpo:review") ?? "{}").state?.starredQuestionIds ?? []);
    expect(starred).toContain(QUESTION_ID);
    // ポップアップは、画面に収まっている
    const box = (await dialog.boundingBox())!;
    const vp = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
    expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
  });

  test("1回目で全部合ったときは、これまでどおり「せいかい」の表示", async ({ page }) => {
    await openQuestion(page);
    await placeAll(page);
    await submit(page).click();
    const ok = page.getByRole("dialog", { name: "せいかい" });
    await expect(ok).toBeVisible();
    await expect(ok).toHaveClass(/feedback-correct/);
    await expect(ok).not.toContainText("2かいめで");
  });

  test("2回目も外したときは、「ざんねん」の表示(不正解向けの文言)。「2かいめで せいかい!」は出ない", async ({ page }) => {
    await openQuestion(page);
    await placeAll(page, firstItem.id);
    await submit(page).click();
    const other = question.categories.find((c) => c.id !== firstItem.correctCategoryId)!;
    await place(page, firstItem.id, other.id); // 2回目も外す
    await submit(page).click();
    const dialog = page.getByRole("dialog", { name: "ざんねん" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveClass(/feedback-incorrect/);
    await expect(dialog).not.toContainText("2かいめで");
  });
});
