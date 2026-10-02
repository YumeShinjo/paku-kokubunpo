import { expect, test } from "@playwright/test";
import { clearedStagesThrough, dismissEngineGuide, dismissStageIntro, seedProgress, skipStories, startApp, waitForStageVisual } from "./helpers";

/**
 * 主要画面のE2E・ビジュアル回帰テスト(タイトル・出題画面・正誤ポップアップ・ボス戦・ランキング・せってい)。
 * 手動のiPhone確認だけに頼らず、レイアウト崩れ・要素の重なりを自動で検知するためのもの。
 * スクリーンショットは iPhone SEクラスの幅(375px)で撮る(小さい画面での窮屈さも、あわせて見つけられるように)。
 */

/** そのページで、横スクロールが発生していない(要素が画面幅からはみ出していない)ことを確かめる */
async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "横スクロールが発生している(要素が画面幅からはみ出している)").toBeLessThanOrEqual(1);
}

test.describe("タイトル画面", () => {
  test("コトと吹き出し・主役ボタン・サブ機能が表示され、ロゴはなく、横はみ出しがない", async ({ page }) => {
    await startApp(page);
    await expect(page.locator(".title-primary")).toHaveText("はじめる");
    await expect(page.locator(".title-sub-buttons button")).toHaveCount(2); // ことだまの書・ランキング
    // ホームには、ロゴを出さない。コトの頭の上に、一言の吹き出し。ボタンは、押しやすい高さ(48px以上)
    await expect(page.locator(".title-logo")).toHaveCount(0);
    await expect(page.locator(".title-bubble-text")).not.toBeEmpty();
    for (const selector of [".title-back", ".title-settings", ".mute-button", ".title-forest", ".sub-book", ".sub-rank"]) {
      expect((await page.locator(selector).boundingBox())!.height, selector).toBeGreaterThanOrEqual(48);
    }
    // 上のバーに、せってい(歯車)。下のフッターに、クレジットとプライバシーポリシー
    const gear = page.getByRole("button", { name: "せってい" });
    await expect(gear).toBeVisible();
    expect((await gear.boundingBox())!.width).toBeGreaterThanOrEqual(48);
    await expect(page.locator(".title-footer button")).toHaveText(["クレジット", "プライバシーポリシー"]);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("title.png");
  });

  test("左上の「タイトルへもどる」で最初の画面へ戻り、タップでまたホーム画面へ(ホーム → 最初の画面 → ホーム)", async ({ page }) => {
    await startApp(page);
    const historyBefore = await page.evaluate(() => window.history.length);
    const back = page.getByRole("button", { name: "タイトルへもどる" });
    await expect(back).toBeVisible();
    const box = (await back.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);

    await back.click();
    await expect(page.locator(".tap-to-start")).toBeVisible();
    await expect(page.locator(".title-primary")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    // 最初の画面の、どこをタップしても始まる
    await page.locator(".tap-to-start").click({ position: { x: 40, y: 300 } });
    await expect(page.locator(".title-primary")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    // ブラウザの履歴は、増えていない(ブラウザの戻る操作と干渉しない)
    expect(await page.evaluate(() => window.history.length)).toBe(historyBefore);
  });
});

test.describe("出題画面と正誤ポップアップ(通常ステージ)", () => {
  test("問題に答えると、判定と解説のポップアップが出て、「つぎへ」で次の問題へ進む", async ({ page }) => {
    await startApp(page);
    await page.locator(".title-primary").click();
    await page.locator(".area-list button:not(:disabled)").first().click();
    await skipStories(page);
    await page.locator(".stage-list button:not(:disabled)").first().click();
    await dismissStageIntro(page);
    await dismissEngineGuide(page);

    await expect(page.locator(".engine")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await waitForStageVisual(page);
    await expect(page).toHaveScreenshot("quiz-question.png");

    // 選択式・仕分けのどちらでも、最初に見つかったボタンで答える(正誤どちらでもポップアップの見た目は確認できる)
    const choice = page.locator(".engine-choice-list button, .sentence-segment, .sorting-item").first();
    await choice.click();
    // 仕分けは「こたえる」を押すまで判定が出ない
    const submit = page.locator(".answer-submit");
    if (await submit.isVisible().catch(() => false)) {
      for (const item of await page.locator(".sorting-item:not([disabled])").all()) await item.click();
      await submit.click();
    }

    await expect(page.locator(".feedback-overlay")).toBeVisible();
    await expect(page.locator('.feedback-overlay [role="dialog"]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await waitForStageVisual(page);
    await expect(page).toHaveScreenshot("quiz-feedback-popup.png");
  });
});

test.describe("ボス戦", () => {
  test.beforeEach(async ({ page }) => {
    // 「ことばの市場」の小ボスに、通常ステージをすべて終えた状態からすぐ挑めるようにしておく(E2Eの近道)
    await seedProgress(page, clearedStagesThrough(["prologue", "kotobaNoIchiba"]).filter((id) => id !== "kotobaNoIchiba-subboss"));
  });

  test("ボスが現れる演出のあと、HPゲージ・ライフが表示された状態で出題が始まる", async ({ page }) => {
    await startApp(page);
    await page.locator(".title-primary").click();
    await page.locator(".area-list button:not(:disabled)").nth(1).click(); // ことばの市場
    await skipStories(page);
    await page.locator(".stage-list .stage-subboss").click();
    await skipStories(page);

    const encounterStart = page.getByRole("button", { name: "たたかう" });
    await expect(encounterStart).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await waitForStageVisual(page);
    await expect(page).toHaveScreenshot("boss-encounter.png");
    await encounterStart.click();
    await dismissStageIntro(page); // 「たたかう!」(出題形式ではなく対決の説明)

    await expect(page.locator(".boss-panel")).toBeVisible();
    await expect(page.locator(".hp-gauge")).toBeVisible();
    await expect(page.locator(".player-lives")).toHaveAttribute("aria-label", "ライフ 5 / 5");
    await expectNoHorizontalOverflow(page);
    await waitForStageVisual(page);
    await expect(page).toHaveScreenshot("boss-battle.png");
  });
});

test.describe("せってい", () => {
  test("音量・もじの おおきさ・データの引き継ぎなどの項目が並び、文字の大きさを変えられる", async ({ page }) => {
    await startApp(page);
    await page.getByRole("button", { name: "せってい" }).click();

    await expect(page.getByRole("heading", { name: "せってい" })).toBeVisible();
    await expect(page.locator('[role="radiogroup"] button')).toHaveCount(3);
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("settings.png");

    const before = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    await page.getByRole("radio", { name: "大" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-text-size", "large");
    const after = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    expect(parseFloat(after)).toBeGreaterThan(parseFloat(before));
    await expectNoHorizontalOverflow(page); // 文字を大きくしても、横スクロールは発生しない
  });
});

test.describe("ランキング", () => {
  test("Firebase未接続のときは、「まだ使えないよ」の案内が出る(本番のデータへは接続しない)", async ({ page }) => {
    await startApp(page);
    await page.getByRole("button", { name: "ランキング" }).click();
    await expect(page.getByText("ランキングはまだ使えないよ")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("ranking-not-configured.png");
  });
});

test.describe("言の葉の森(ことわざ・故事成語のミニゲーム)", () => {
  test("序章をクリアするまでは、ホームの入口は鍵つきで、押しても入れない", async ({ page }) => {
    await startApp(page);
    const card = page.locator(".title-forest");
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("aria-disabled", "true");
    await expect(card).toContainText("ことばの分かれ道をクリアすると遊べるよ");
    await card.click({ force: true }); // 押せない(aria-disabled)ので、待たずに押して、入れないことを確かめる
    await expect(page.locator(".screen-kotonoha")).toHaveCount(0);
    await expect(page.locator(".title-primary")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("解放後: ホーム → 入口 → 1問答える → 解説 → 結果 → 戻る", async ({ page }) => {
    await seedProgress(page, clearedStagesThrough(["prologue"]));
    await startApp(page);
    const card = page.locator(".title-forest");
    await expect(card).toContainText("0 / 80");
    await card.click();
    // 初めて入ったときは、ユライとコトの台詞(entry_first)。「スキップ」で、範囲の選択へ
    await expect(page.locator('[data-scene="entry_first"] .scene-bubble')).toHaveCount(1);
    await expect(page.locator(".kotonoha-scope-list")).toHaveCount(0);
    expect((await page.locator(".scene-skip").boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0);
    await page.locator(".scene-skip").click();
    await expect(page.locator(".kotonoha-scope-list button")).toHaveCount(3);
    await expectNoHorizontalOverflow(page);
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0);

    await page.locator(".kotonoha-scope-list button").first().click();
    // ラウンド開始の一言。タップですぐ出題へ(放っておいても、1.5秒ほどで進む)
    await expect(page.locator('[data-scene="round_start_all"] .scene-bubble')).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0);
    await page.locator(".scene-next").click();
    await expect(page.locator(".kotonoha-progress")).toContainText("1 / 10");
    await expect(page.locator(".kotonoha-blank")).toHaveCount(1);
    await expectNoHorizontalOverflow(page);
    const choice = page.locator(".kotonoha-choices button").first();
    expect((await choice.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    // 1画面で、スクロールなしで答えられる(縦にはみ出さない)
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0);
    await choice.click();
    await expect(page.locator(".kotonoha-explain")).toBeVisible();
    await expect(page.locator(".kotonoha-scene .yurai-bubble .yurai-text")).not.toBeEmpty(); // ユライの一言は、立ち絵の隣の吹き出し
    // ほかの選択肢は消えて、選んだ答えと正解だけが、1行ずつ残る
    await expect(page.locator(".kotonoha-choices")).toHaveCount(0);
    expect(await page.locator(".kotonoha-answers li").count()).toBeLessThanOrEqual(2);
    // 「つぎへ」は、画面の下に固定され、スクロールしなくても見えて、押せる。音量ボタン(右上)とは重ならない
    const next = page.locator(".kotonoha-bottom .kotonoha-next");
    await expect(next).toBeInViewport();
    const nb = (await next.boundingBox())!;
    expect(nb.height).toBeGreaterThanOrEqual(44);
    const mb = (await page.locator(".mute-button").boundingBox())!;
    expect(mb.y + mb.height).toBeLessThan(nb.y);
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0);
    await expectNoHorizontalOverflow(page);

    for (let i = 1; i < 10; i++) {
      await page.locator(".kotonoha-next").click();
      await page.locator(".kotonoha-choices button").first().click();
      await expect(page.locator(".kotonoha-explain")).toBeVisible();
    }
    await page.locator(".kotonoha-next").click();
    await expect(page.locator(".kotonoha-result")).toBeVisible();
    await expect(page.locator(".kotonoha-score")).toContainText("/ 10");
    await expectNoHorizontalOverflow(page);
    // 結果: 得点帯別の一言(ユライとコト)。縦にはみ出さない
    await expect(page.locator(".kotonoha-result-scene .scene-bubble")).toHaveCount(2);
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(0);

    await page.getByRole("button", { name: "もどる", exact: true }).last().click();
    await expect(page.locator(".kotonoha-scope-list")).toBeVisible();
    await page.locator(".back-button").click();
    await expect(page.locator(".title-primary")).toBeVisible();
    // 本編の「正解した問題」は、増えていない
    await expect(page.locator(".mastery-text")).toContainText("0 /");
  });
});

test.describe("ふりがなを含む文章の行間", () => {
  test("ふりがなのある行だけが広がらない(行の間隔のばらつきが0)。ことだまの書「ぶんぽう」の文章で確かめる", async ({ page }) => {
    await startApp(page);
    await page.locator(".sub-book").click();
    await page.getByRole("tab", { name: "ぶんぽうの ずかん" }).click();
    await page.locator("details.zukan-page summary").first().click();
    // ふりがな(rt)を含み、2行以上になる文章を集めて、隣り合う行の上端の差(行の間隔)の、最大 − 最小を測る
    const result = await page.evaluate(() => {
      const blocks = [...new Set([...document.querySelectorAll(".ruby-text")].map((e) => e.parentElement!))].filter(
        (el) => el.offsetParent !== null && el.querySelector("rt") && getComputedStyle(el).display !== "inline",
      );
      let worst = 0;
      let measured = 0;
      for (const el of blocks) {
        const tops: number[] = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          if (!n.textContent!.trim() || n.parentElement!.closest("rt")) continue;
          const range = document.createRange();
          range.selectNodeContents(n);
          for (const r of range.getClientRects()) if (r.width > 0) tops.push(r.top);
        }
        const lines: number[] = [];
        for (const t of tops.sort((a, b) => a - b)) if (lines.length === 0 || t - lines[lines.length - 1] > 6) lines.push(t);
        if (lines.length < 3) continue;
        const pitches = lines.slice(1).map((t, i) => t - lines[i]);
        worst = Math.max(worst, Math.max(...pitches) - Math.min(...pitches));
        measured++;
      }
      return { worst, measured };
    });
    expect(result.measured).toBeGreaterThan(0);
    expect(result.worst).toBeLessThan(0.5);
  });
});
