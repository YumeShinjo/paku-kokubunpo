import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/global.css", "utf-8");

/** セレクタで始まる最初のルール(波括弧の中身)を取り出す。行頭のものだけを探す */
function rule(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) return "";
  const open = css.indexOf("{", start);
  return css.slice(open + 1, css.indexOf("}", open));
}

/** @keyframes の中で使っている、CSSのプロパティ名の一覧 */
function keyframeProperties(name: string): string[] {
  const start = css.indexOf(`@keyframes ${name} {`);
  expect(start, `@keyframes ${name} がない`).toBeGreaterThanOrEqual(0);
  let depth = 0;
  let end = start;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  const body = css.slice(css.indexOf("{", start) + 1, end);
  return [...new Set([...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]))];
}

describe("最初の画面のスタイル", () => {
  it("案内「タッチして はじめる」は、画面の高さの86%に、薄いクリーム色(#fdffe7・不透明度85%)の丸い背景で、文字色は #6f5a5a", () => {
    const hint = rule(".tap-to-start-hint");
    expect(hint).toContain("top: 86%;");
    expect(hint).toContain("background: rgba(253, 255, 231, 0.85);");
    expect(hint).toContain("border-radius: 999px;");
    expect(hint).toContain("color: #6f5a5a;");
  });

  it("フッターは中央寄せの1行(折り返しは、幅が足りないときだけ)。押せるボタンは高さ44px、下端は端末の安全領域を考慮する", () => {
    const footer = rule(".splash-footer");
    expect(footer).toContain("justify-content: center;");
    expect(footer).toContain("env(safe-area-inset-bottom)");
    const buttons = rule(".splash-credits,\n.splash-privacy");
    expect(buttons).toContain("min-height: 44px;");
    expect(buttons).toContain("pointer-events: auto;");
  });

  it("お知らせは、画面の右上の小さな丸い(ピル型の)ボタン", () => {
    const announce = rule(".splash-announce");
    expect(announce).toContain("top: max(0.6rem, env(safe-area-inset-top));");
    expect(announce).toContain("right: 0.6rem;");
    expect(announce).toContain("border-radius: 999px;");
  });

  it("飾りの動きは、transform と opacity だけ(端末の負荷を上げない)", () => {
    for (const name of ["splash-bob", "splash-shadow", "splash-float-small", "splash-cloud-drift", "splash-drift", "splash-twinkle", "tap-hint"]) {
      const properties = keyframeProperties(name);
      for (const property of properties) expect(["transform", "opacity"], `${name} の ${property}`).toContain(property);
    }
  });

  it("コトの揺れは、周期3〜4秒、振れ幅は数px(6px以内)", () => {
    const koto = rule(".splash-koto > *");
    const seconds = Number(koto.match(/animation: splash-bob ([\d.]+)s/)?.[1]);
    expect(seconds).toBeGreaterThanOrEqual(3);
    expect(seconds).toBeLessThanOrEqual(4);
    const keyframes = css.slice(css.indexOf("@keyframes splash-bob"), css.indexOf("@keyframes splash-shadow"));
    const amplitude = Math.max(...[...keyframes.matchAll(/translateY\((-?[\d.]+)px\)/g)].map((m) => Math.abs(Number(m[1]))));
    expect(amplitude).toBeGreaterThan(0);
    expect(amplitude).toBeLessThanOrEqual(6);
  });

  it("飾り(雲・葉・キラキラ・吹き出し・影)は、タップの邪魔をしない(pointer-events: none)", () => {
    expect(rule(".splash-sky,\n.splash-dust")).toContain("pointer-events: none;");
    expect(rule(".splash-bubble")).toContain("pointer-events: none;");
    expect(rule(".splash-shadow")).toContain("pointer-events: none;");
  });

  it("動きを減らす設定では、飾りの動きをすべて止める(雲は消す)", () => {
    const start = css.indexOf("@media (prefers-reduced-motion: reduce) {\n  .splash-koto > *,");
    expect(start).toBeGreaterThan(0);
    const block = css.slice(start, css.indexOf("\n}\n", css.indexOf("display: none;", start)) + 3);
    for (const selector of [".splash-koto > *", ".splash-shadow", ".splash-bubble", ".splash-cloud", ".splash-leaf", ".splash-sparkle", ".tap-to-start-hint.is-ready .tap-to-start-hint-text"]) {
      expect(block, selector).toContain(selector);
    }
    expect(block).toContain("animation: none;");
    expect(block).toMatch(/\.splash-sky \{\s*display: none;/);
  });

  it("ロゴには、茶色系のやわらかい影を付ける", () => {
    expect(rule(".splash-logo")).toMatch(/filter: drop-shadow\([^)]*rgba\(111, 90, 90, [\d.]+\)\)/);
  });
});
