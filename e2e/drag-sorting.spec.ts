import { existsSync } from "node:fs";
import { expect, test, webkit, type CDPSession, type Locator, type Page } from "@playwright/test";
import { clearedStagesThrough, seedProgress, startApp } from "./helpers";

/**
 * 仕分け(ドラッグ式)の問題を、本物のブラウザ(Chromium・WebKit。マウスと指)で、連続して何度もドラッグして確かめる。
 * 「ドラッグが引っかかって動かなくなる」ことがないか: どのドラッグも、終わったらゴースト(ドラッグ中の複製)が残らず、
 * 狙ったカゴに入り、次のドラッグがすぐ始められること。ウィンドウの外で離す・ほとんど動かさない・すばやく動かす、も混ぜる。
 * 出題は、同じ表記の「ある」が2枚ある問題(①②の番号つき)を、保存した途中経過で最初に出す。
 */
const QUESTION_ID = "ichiba-pos-batch-01";
const STAGE_ID = "kotobaNoIchiba-stage1";
const WEBKIT_INSTALLED = (() => {
  try {
    return existsSync(webkit.executablePath());
  } catch {
    return false;
  }
})();

async function seedSortingStage(page: Page) {
  await page.addInitScript(
    ([stageId, questionId]) => {
      localStorage.setItem("paku-kokubunpo:tutorial", JSON.stringify({ state: { seenGuides: ["zukan", "sorting", "choice", "assembly"] }, version: 0 }));
      localStorage.setItem(
        "paku-kokubunpo:session",
        JSON.stringify({
          state: { active: { stageId, areaId: "kotobaNoIchiba", questionIds: [questionId, questionId, questionId], index: 0, correctCount: 0, combo: 0, maxCombo: 0, hp: 0 } },
          version: 0,
        }),
      );
    },
    [STAGE_ID, QUESTION_ID],
  );
}

async function openSortingQuestion(page: Page) {
  await seedProgress(page, clearedStagesThrough(["prologue"])); // ことばの市場を、遊べる状態にしておく
  await seedSortingStage(page);
  await startApp(page);
  await page.evaluate(async (stageId) => {
    const entry = performance.getEntriesByType("resource").map((r) => r.name).find((u) => /\/src\/app\/store\/navigationStore\.ts/.test(u))!;
    (await import(/* @vite-ignore */ entry)).useNavigationStore.getState().goTo({ name: "stage", areaId: "kotobaNoIchiba", stageId });
  }, STAGE_ID);
  await page.locator(".engine-sorting").waitFor();
}

interface Point {
  x: number;
  y: number;
}

/** 画面に全体が見えている、押せる単語(カード)と、カゴのラベルの中心 */
async function visibleTargets(page: Page) {
  return page.evaluate(() => {
    const limit = innerHeight - 110; // 下の端(自動スクロールの帯・「こたえる」の固定バー)に近いものは、狙わない
    const inside = (r: DOMRect) => r.top > 8 && r.bottom < limit && r.left >= 0 && r.right <= innerWidth;
    const items = [...document.querySelectorAll<HTMLElement>("[data-item-id]")]
      .map((e) => ({ id: e.dataset.itemId!, r: e.getBoundingClientRect() }))
      .filter((x) => inside(x.r))
      .map((x) => ({ id: x.id, x: x.r.left + x.r.width / 2, y: x.r.top + x.r.height / 2 }));
    const baskets = [...document.querySelectorAll<HTMLElement>(".sorting-basket")]
      .map((e, index) => ({ index, r: e.querySelector(".sorting-basket-label")!.getBoundingClientRect() }))
      .filter((x) => inside(x.r))
      .map((x) => ({ index: x.index, x: x.r.left + x.r.width / 2, y: x.r.top + x.r.height / 2 }));
    return { items, baskets };
  });
}

const basketOf = (page: Page, itemId: string) =>
  page.evaluate((id) => [...document.querySelectorAll(".sorting-basket")].findIndex((b) => b.querySelector(`[data-item-id="${id}"]`)), itemId);

const dragState = (page: Page) =>
  page.evaluate(() => ({ ghost: document.querySelectorAll(".sorting-ghost").length, dragging: document.querySelectorAll(".is-dragging").length }));

type Pointer = {
  down: (p: Point) => Promise<void>;
  move: (p: Point) => Promise<void>;
  up: (p?: Point) => Promise<void>;
};

function mousePointer(page: Page): Pointer {
  return {
    down: async (p) => {
      await page.mouse.move(p.x, p.y);
      await page.mouse.down();
    },
    move: (p) => page.mouse.move(p.x, p.y),
    up: () => page.mouse.up(),
  };
}

function touchPointer(client: CDPSession): Pointer {
  return {
    down: (p) => client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y, id: 1 }] }),
    move: (p) => client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x, y: p.y, id: 1 }] }),
    up: () => client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }),
  };
}

type Kind = "normal" | "fast" | "slow" | "outside" | "tiny" | "offscreen";
const KINDS: Kind[] = ["normal", "fast", "slow", "outside", "tiny", "offscreen", "normal", "fast", "normal", "slow"];

/** いろいろな動かし方で、連続してドラッグする。どれも、ゴーストが残らず、狙ったカゴに入る(入らない動かし方は、もとの場所のまま) */
async function dragMany(page: Page, pointer: Pointer, rounds: number) {
  const viewport = page.viewportSize()!;
  let placedCount = 0;
  for (let round = 0; round < rounds; round++) {
    await page.evaluate(() => scrollTo(0, 0));
    const { items, baskets } = await visibleTargets(page);
    expect(items.length, `round ${round}: 見えているカード`).toBeGreaterThan(0);
    expect(baskets.length, `round ${round}: 見えているカゴ`).toBeGreaterThan(0);
    const item = items[round % items.length];
    const basket = baskets[(round * 3 + 1) % baskets.length];
    const kind = KINDS[round % KINDS.length];
    const before = await basketOf(page, item.id);
    const from = { x: item.x, y: item.y };
    let to: Point = { x: basket.x, y: basket.y };
    if (kind === "outside") to = { x: 4, y: viewport.height - 4 };
    if (kind === "tiny") to = { x: from.x + 2, y: from.y + 2 };
    if (kind === "offscreen") to = { x: viewport.width + 30, y: from.y };
    const steps = kind === "fast" ? 2 : kind === "slow" ? 20 : 8;

    await pointer.down(from);
    for (let i = 1; i <= steps; i++) {
      await pointer.move({ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps });
      if (kind === "slow") await page.waitForTimeout(6);
    }
    await pointer.up(to);
    await page.waitForTimeout(30);

    const state = await dragState(page);
    expect(state, `round ${round} (${kind}): ドラッグが終わったのに、ゴーストなどが残っている`).toEqual({ ghost: 0, dragging: 0 });
    const after = await basketOf(page, item.id);
    const expected = kind === "normal" || kind === "fast" || kind === "slow" ? basket.index : before;
    expect(after, `round ${round} (${kind}): カード ${item.id} が、狙ったカゴに入っていない`).toBe(expected);
    if (after >= 0) placedCount++;
  }
  return placedCount;
}

test.describe("仕分け(ドラッグ式)を、連続してドラッグしても、引っかからない", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("Chromium・マウス: 10回連続(速い・遅い・外で離す・ほとんど動かさない・ウィンドウの外で離す)", async ({ page }) => {
    await openSortingQuestion(page);
    expect(await dragMany(page, mousePointer(page), 10)).toBeGreaterThan(0);
  });

  test("Chromium・マウス: ウィンドウの外で離したあとも、すぐ次のドラッグができる(取りこぼし)", async ({ page }) => {
    await openSortingQuestion(page);
    const { items, baskets } = await visibleTargets(page);
    const item = items[0];
    // カードを押して動かし、ウィンドウの外へ出して離す
    await page.mouse.move(item.x, item.y);
    await page.mouse.down();
    await page.mouse.move(item.x + 20, item.y + 20, { steps: 4 });
    await page.mouse.move(-30, -30, { steps: 4 });
    await page.mouse.up();
    expect(await dragState(page)).toEqual({ ghost: 0, dragging: 0 });
    // すぐ次のドラッグ
    const next = (await visibleTargets(page)).items[0];
    await page.mouse.move(next.x, next.y);
    await page.mouse.down();
    await page.mouse.move(baskets[0].x, baskets[0].y, { steps: 6 });
    await page.mouse.up();
    expect(await basketOf(page, next.id)).toBe(baskets[0].index);
    expect(await dragState(page)).toEqual({ ghost: 0, dragging: 0 });
  });

  test("Chromium・指(タッチ): 10回連続", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "指の操作の送信は、Chromiumだけ");
    await openSortingQuestion(page);
    const client = await page.context().newCDPSession(page);
    expect(await dragMany(page, touchPointer(client), 10)).toBeGreaterThan(0);
  });

  test("WebKit(iPhoneのSafariと同じエンジン)・マウス: 10回連続(WebKitが入っているときだけ)", async () => {
    test.skip(!WEBKIT_INSTALLED, "WebKit が入っていない(npx playwright install webkit)ので、飛ばす");
    const browser = await webkit.launch();
    try {
      const context = await browser.newContext({ baseURL: "http://localhost:5183", viewport: { width: 375, height: 667 } });
      const page = await context.newPage();
      await openSortingQuestion(page);
      expect(await dragMany(page, mousePointer(page), 10)).toBeGreaterThan(0);
    } finally {
      await browser.close();
    }
  });

  test("PC(1280×800)・マウス: 10回連続", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openSortingQuestion(page);
    expect(await dragMany(page, mousePointer(page), 10)).toBeGreaterThan(0);
  });
});

test.describe("同じ表記のカード(「ある」が2枚)を、①②で見分けられる", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("文の中の対象の語に①②が付き、カゴに入れたあとも、同じ番号が残る", async ({ page }) => {
    await openSortingQuestion(page);
    const aruChips: Locator = page.locator("[data-item-id]").filter({ has: page.locator(".target-card", { hasText: "ある" }) });
    await expect(aruChips).toHaveCount(2);
    const marksBefore = (await aruChips.locator(".target-mark").allTextContents()).sort();
    expect(marksBefore).toEqual(["①", "②"]);
    // 番号と、そのカードの対応(idごと)を控える
    const byId = await page.evaluate(() =>
      Object.fromEntries([...document.querySelectorAll<HTMLElement>("[data-item-id]")].filter((e) => e.querySelector(".target-mark")).map((e) => [e.dataset.itemId!, e.querySelector(".target-mark")!.textContent])),
    );
    // 2枚とも、ドラッグでカゴに入れる(それぞれ、別のカゴへ)
    for (const [index, id] of Object.keys(byId).entries()) {
      await page.evaluate(() => scrollTo(0, 0));
      const { items, baskets } = await visibleTargets(page);
      const item = items.find((x) => x.id === id)!;
      const basket = baskets[index + 1];
      await page.mouse.move(item.x, item.y);
      await page.mouse.down();
      await page.mouse.move(basket.x, basket.y, { steps: 8 });
      await page.mouse.up();
      expect(await basketOf(page, id)).toBe(basket.index);
    }
    const after = await page.evaluate(() =>
      Object.fromEntries([...document.querySelectorAll<HTMLElement>(".sorting-basket-items [data-item-id]")].filter((e) => e.querySelector(".target-mark")).map((e) => [e.dataset.itemId!, e.querySelector(".target-mark")!.textContent])),
    );
    expect(after).toEqual(byId); // カゴの中のカードに、同じ番号が残っている
    // 品詞名などの答えのヒントは、番号に含まれない
    for (const mark of Object.values(after)) expect(mark).toMatch(/^[①②]$/);
  });
});
