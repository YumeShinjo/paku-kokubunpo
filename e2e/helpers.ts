import type { Page } from "@playwright/test";
import { getStagesForArea } from "../src/data/stages";

/**
 * 出題の選び方(selectQuestions)や、正誤メッセージの選び方は Math.random を使っている。
 * スクリーンショットを毎回同じ内容にする(出題される問題や文言が、実行のたびに変わらないようにする)ため、
 * ページを読み込む前に、決まった並びを返す疑似乱数に差し替えておく。
 */
async function seedRandom(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let seed = 42;
    Math.random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  });
}

/** 起動直後の「タップして はじめる」を押して、音声を解禁し、タイトル画面まで進める */
export async function startApp(page: Page): Promise<void> {
  await seedRandom(page);
  await page.goto("/");
  await page.locator(".tap-to-start").click();
  await page.getByRole("heading", { name: "パクっと国文法" }).waitFor().catch(() => {}); // ロゴ画像のときは見出しテキストがないので、失敗しても続ける
  await page.locator(".title-primary").waitFor();
}

/** 会話シーン(ストーリー)が出ていれば、続けて「スキップ」する(出ていなければ何もしない) */
export async function skipStories(page: Page, times = 3): Promise<void> {
  for (let i = 0; i < times; i++) {
    const skip = page.locator(".story-skip");
    if (!(await skip.isVisible().catch(() => false))) return;
    await skip.click();
    await page.waitForTimeout(150);
  }
}

/** ステージ冒頭の説明ポップアップ(「はじめる」/「たたかう!」)が出ていれば閉じる */
export async function dismissStageIntro(page: Page): Promise<void> {
  const button = page.locator(".stage-intro .feedback-next");
  if (await button.isVisible().catch(() => false)) await button.click();
}

/** 初回だけ出る操作ガイド(「わかった!」)が出ていれば閉じる */
export async function dismissEngineGuide(page: Page): Promise<void> {
  const button = page.getByRole("button", { name: "わかった!" });
  if (await button.isVisible().catch(() => false)) await button.click();
}

/**
 * 進み具合を、指定したエリアのステージまでクリア済みにして、そこからすぐ試せるようにする(E2Eの近道)。
 * 本物のステージ構成(src/data/stages.ts)から実際のidを取るので、問題データを見直しても、ここは直さなくてよい。
 * ページを開く前に addInitScript で仕込むこと(アプリの起動より先に、保存内容を用意しておく必要があるため)。
 */
export function clearedStagesThrough(areaIds: string[]): string[] {
  return areaIds.flatMap((areaId) => getStagesForArea(areaId).map((s) => s.id));
}

/** 進み具合(clearedStageIds)を、端末の保存(localStorage)にあらかじめ仕込む */
export async function seedProgress(page: Page, clearedStageIds: string[], totalScore = 500): Promise<void> {
  await page.addInitScript(
    ([cleared, score]) => {
      localStorage.setItem(
        "paku-kokubunpo:progress",
        JSON.stringify({ state: { clearedStageIds: cleared, totalScore: score }, version: 0 }),
      );
    },
    [clearedStageIds, totalScore] as const,
  );
}

/**
 * 出題画面の上の背景の帯(.stage-visual の背景画像)の読み込みを待つ。1枚の cover の大きな画像なので、
 * 読み込みが終わる前にスクリーンショットを撮ると、帯が空(背景色だけ)で撮れてしまう。
 */
export async function waitForStageVisual(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const el = document.querySelector(".stage-visual");
    if (!el) return true;
    const url = getComputedStyle(el).backgroundImage.match(/url\("?([^")]+)"?\)/)?.[1];
    if (!url) return true; // 画像が置かれていない(単色・仮の帯)
    const img = new Image();
    img.src = url;
    return img.complete && img.naturalWidth > 0;
  });
  await page.waitForTimeout(100);
}
