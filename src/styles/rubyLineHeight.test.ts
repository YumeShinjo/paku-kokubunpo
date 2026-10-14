import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/global.css", "utf-8");

/** ふりがなを含む文章は、行の高さを固定値にして、ふりがなの有無で行の間隔が変わらないようにする */
describe("ふりがなを含む文章の行の高さ(CSS)", () => {
  it("固定の行の高さ(--ruby-line-height)は、実測した最小値(Chromium・WebKit、標準・大のすべてで、ふりがなが前の行に食い込まない1.8)。これより狭めない", () => {
    const value = Number(css.match(/--ruby-line-height:\s*([\d.]+)\s*;/)?.[1]);
    expect(value).toBeGreaterThanOrEqual(1.8);
    expect(value).toBeLessThanOrEqual(1.9);
  });

  it("ホームの吹き出しだけは、行間を狭める(1.5〜1.6)", () => {
    const text = css.match(/\n\.title-bubble-text \{[^}]*line-height: ([\d.]+);/)?.[1];
    expect(Number(text)).toBeGreaterThanOrEqual(1.5);
    expect(Number(text)).toBeLessThanOrEqual(1.6);
    expect(css).toMatch(/\.title-bubble \.title-bubble-part \{[^}]*line-height: 1\.55;/);
  });

  it("ふりがな(.ruby-text)を直接もつブロックに、その高さが掛かる。ふりがな(rt)自身の行の高さは1", () => {
    expect(css).toMatch(/:has\(> \.ruby-text\)[^{]*\{[^}]*line-height: var\(--ruby-line-height\);/);
    expect(css).toMatch(/ruby rt \{[^}]*line-height: 1;/);
  });

  it("ふりがなは、標準の配置(ブラウザごとに間隔・行の広がり方が違う)ではなく、grid で漢字の真上に置く。漢字は span.ruby-base に入れる", () => {
    expect(css).toMatch(/\nruby \{[^}]*display: inline-grid;[^}]*line-height: 1;/);
    expect(css).toMatch(/\nruby > \* \{[^}]*grid-area: 1 \/ 1;/);
    expect(css).toMatch(/\nruby > rt \{[^}]*transform: translateY\(-100%\);/);
    for (const f of ["src/components/Ruby.tsx", "src/features/kotonoha/IdiomText.tsx"]) {
      expect(readFileSync(f, "utf-8")).toMatch(/<span className="ruby-base">\{seg\.text\}<\/span>\s*<rt>/);
    }
  });

  it("会話ウィンドウ: 文字サイズ「大」では、5〜6行の台詞が、スクロールなしで入る高さにしている", () => {
    const standard = Number(css.match(/\.story-textbox \{[^}]*height: ([\d.]+)rem/)?.[1]);
    const large = Number(css.match(/html\[data-text-size="large"\] \.story-textbox \{[^}]*height: ([\d.]+)rem/)?.[1]);
    expect(standard).toBe(12);
    expect(large).toBeGreaterThan(standard);
  });
});
