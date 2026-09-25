import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/global.css", "utf-8");
const main = readFileSync("src/main.tsx", "utf-8");

/**
 * ボタンのタップ演出。jsdom では :active も transition も再現できないので、共通CSSの取り決めそのものを確かめる
 * (実際の見た目・動きはブラウザで確認する)。
 */
describe("ボタンのタップ演出(共通CSS)", () => {
  it("すべてのボタンに、100〜150msの transform の変化がつく(個別のクラスは要らない)", () => {
    const match = css.match(/(?:^|\n)button \{\s*transition: transform ([\d.]+)s ease-out;\s*\}/);
    expect(match, "button の transition").not.toBeNull();
    const ms = Number(match![1]) * 1000;
    expect(ms).toBeGreaterThanOrEqual(100);
    expect(ms).toBeLessThanOrEqual(150);
  });

  it("押している間(:active)に scale(0.95) まで縮む", () => {
    expect(css).toMatch(/button:not\(:disabled\)[^{]*:active \{\s*transform: scale\(0\.95\);/);
  });

  it("押せない(disabled / aria-disabled)ボタンには付けない。画面いっぱいの「タップしてはじめる」も除く", () => {
    const selector = css.match(/(button:not\(:disabled\)[^{]*:active) \{\s*transform: scale/)![1];
    expect(selector).toContain(":not(:disabled)");
    expect(selector).toContain(':not([aria-disabled="true"])');
    expect(selector).toContain(":not(.tap-to-start)");
  });

  it("「動きを減らす」設定(prefers-reduced-motion)では、transition をなくして、すぐに切り替える", () => {
    const media = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce) {\n  button {"));
    expect(media.slice(0, 120)).toContain("transition: none;");
  });

  it("iOSで :active が働くよう、touchstart のリスナーを文書に置いている", () => {
    expect(main).toContain('document.addEventListener("touchstart"');
  });
});
