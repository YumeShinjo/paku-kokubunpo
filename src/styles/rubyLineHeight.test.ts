import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/global.css", "utf-8");

/** ふりがなを含む文章は、行の高さを固定値にして、ふりがなの有無で行の間隔が変わらないようにする */
describe("ふりがなを含む文章の行の高さ(CSS)", () => {
  it("固定の行の高さ(--ruby-line-height)は、ふりがなが行を押し広げない値(1.8以上)", () => {
    const value = Number(css.match(/--ruby-line-height:\s*([\d.]+)\s*;/)?.[1]);
    expect(value).toBeGreaterThanOrEqual(1.8);
  });

  it("ふりがな(.ruby-text)を直接もつブロックに、その高さが掛かる。ふりがな(rt)自身の行の高さは1", () => {
    expect(css).toMatch(/:has\(> \.ruby-text\)[^{]*\{[^}]*line-height: var\(--ruby-line-height\);/);
    expect(css).toMatch(/ruby rt \{[^}]*line-height: 1;/);
  });

  it("会話ウィンドウ: 文字サイズ「大」では、5〜6行の台詞が、スクロールなしで入る高さにしている", () => {
    const standard = Number(css.match(/\.story-textbox \{[^}]*height: ([\d.]+)rem/)?.[1]);
    const large = Number(css.match(/html\[data-text-size="large"\] \.story-textbox \{[^}]*height: ([\d.]+)rem/)?.[1]);
    expect(standard).toBe(12);
    expect(large).toBeGreaterThan(standard);
  });
});
