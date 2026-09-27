import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/global.css", "utf-8");

/** セレクタで始まる最初のルール(波括弧の中身)を取り出す */
function rule(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) return "";
  const open = css.indexOf("{", start);
  return css.slice(open + 1, css.indexOf("}", open));
}

/** WCAGのコントラスト比(相対輝度から計算) */
function contrast(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  };
  const [a, b] = [lum(hexA.replace("#", "")), lum(hexB.replace("#", ""))].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

function cssVar(name: string): string {
  const match = css.match(new RegExp(`${name}: (#[0-9a-fA-F]{6});`));
  if (!match) throw new Error(`variable not found: ${name}`);
  return match[1];
}

describe("アクセシビリティ: 文字の大きさ", () => {
  it("<html data-text-size> で、rem基準の文字サイズ全体を拡大・縮小できる(小=87.5%・大=118.75%)", () => {
    expect(rule('html[data-text-size="small"]')).toContain("font-size: 87.5%;");
    expect(rule('html[data-text-size="large"]')).toContain("font-size: 118.75%;");
  });
});

describe("アクセシビリティ: 色のコントラスト", () => {
  it("控えめな文字(text-muted)は、背景(bg・surface)に対して4.5:1以上ある(小さな文字でもAA基準を満たす)", () => {
    const muted = cssVar("--color-text-muted");
    expect(contrast(muted, cssVar("--color-bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(muted, cssVar("--color-surface"))).toBeGreaterThanOrEqual(4.5);
  });

  it("エリアの主役色の文字(primary-text)・特別な色の文字(gold-text)も、背景に対して4.5:1以上ある", () => {
    expect(contrast(cssVar("--color-primary-text"), cssVar("--color-bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(cssVar("--color-gold-text"), cssVar("--color-gold-soft"))).toBeGreaterThanOrEqual(4.5);
  });

  it("正答率グラフ・HPバーの塗り色は、土台(track)に対して3:1以上ある(色の薄いUI部品の最低基準)", () => {
    const track = cssVar("--color-bar-track");
    expect(contrast(cssVar("--color-bar"), track)).toBeGreaterThanOrEqual(3);
    expect(contrast(cssVar("--color-hp"), track)).toBeGreaterThanOrEqual(3);
  });
});

