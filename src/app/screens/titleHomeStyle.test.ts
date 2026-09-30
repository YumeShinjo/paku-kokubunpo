import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/global.css", "utf-8");

function rule(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) return "";
  const open = css.indexOf("{", start);
  return css.slice(open + 1, css.indexOf("}", open));
}

const rem = (body: string, prop: string) => Number(body.match(new RegExp(`${prop}: ([0-9.]+)rem`))?.[1]);

/** WCAG の相対輝度とコントラスト比 */
function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("ホーム画面のスタイル", () => {
  it("戻るボタン: 44px以上の丸いボタンで、左上。ノッチ・ダイナミックアイランドを避ける", () => {
    const back = rule(".title-back");
    expect(rem(back, "width")).toBeGreaterThanOrEqual(2.75);
    expect(rem(back, "height")).toBeGreaterThanOrEqual(2.75);
    expect(back).toContain("border-radius: 50%;");
    expect(back).toContain("top: max(0.6rem, env(safe-area-inset-top));");
    expect(back).toContain("left: max(0.6rem, env(safe-area-inset-left));");
  });

  it("音量ボタン(ホーム画面だけ): 右上。左上の戻るボタンと、同じ大きさ・同じ余白で、左右対称", () => {
    const back = rule(".title-back");
    const mute = rule(".mute-button");
    const home = rule(".mute-button.on-home");
    expect(rem(mute, "width")).toBe(rem(back, "width"));
    expect(rem(mute, "height")).toBe(rem(back, "height"));
    expect(home).toContain("top: max(0.6rem, env(safe-area-inset-top));");
    expect(home).toContain("right: max(0.6rem, env(safe-area-inset-right));");
    expect(home).toContain("bottom: auto;");
    // 戻るボタンと同じく、画面と一緒にスクロールする(片方だけ残らない)
    expect(home).toContain("position: absolute;");
    // 音量ボタンが右下を空けたので、下の余白は小さい(safe-area は残す)
    expect(Number(rule(".screen-title").match(/padding-bottom: calc\(([0-9.]+)rem/)?.[1])).toBeLessThanOrEqual(1);
    expect(rule(".screen-title")).toContain("env(safe-area-inset-bottom)");
  });

  it("音量ボタンの位置は、ホーム画面以外では変えない(会話は左上、ほかは右下)", () => {
    expect(rule(".mute-button")).toContain("right: max(0.75rem, env(safe-area-inset-right));");
    expect(rule(".mute-button")).toContain("bottom: max(0.75rem, env(safe-area-inset-bottom));");
    expect(rule(".mute-button.in-story")).toContain("left: max(0.75rem, env(safe-area-inset-left));");
  });

  it("「はじめる」: 従来(4.5rem)の1.15倍前後の高さ。厚み(濃いミントの縁)・上辺のハイライト・やわらかい影がある", () => {
    const primary = rule(".title-primary");
    expect(rem(primary, "min-height") / 4.5).toBeGreaterThanOrEqual(1.1);
    expect(rem(primary, "min-height") / 4.5).toBeLessThanOrEqual(1.2);
    expect(primary).toMatch(/0 0\.3rem 0 #[0-9a-f]{6}/); // 下の縁(厚み)
    expect(primary).toMatch(/inset 0 2px 0 rgba\(255, 255, 255, 0\.5\)/); // 上辺のハイライト
    expect(primary).toMatch(/0 0\.75rem 1rem rgba/); // やわらかい影
  });

  it("「はじめる」を押している間は、縁(厚み)の分だけ沈む。共通のボタンの縮みより優先される", () => {
    const start = css.indexOf('button.title-primary:not(:disabled):not([aria-disabled="true"]):not(.tap-to-start):active {');
    expect(start).toBeGreaterThan(0);
    const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
    expect(body).toContain("transform: translateY(0.3rem);");
    expect(body).toMatch(/box-shadow:\s*0 0 0 #/); // 縁がなくなる(縁の分だけ沈む)
  });

  it("サブボタン4つ: サイズ(高さ2.75rem)と2列のグリッドは今のまま。押すと、沈み、色が濃くなる", () => {
    expect(rem(rule(".title-sub-buttons button"), "min-height")).toBe(2.75);
    expect(rule(".title-sub-buttons")).toContain("grid-template-columns: repeat(2, 1fr);");
    const start = css.indexOf('.title-sub-buttons button:not(:disabled):not([aria-disabled="true"]):not(.tap-to-start):active {');
    expect(start).toBeGreaterThan(0);
    const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
    expect(body).toContain("transform: translateY(2px);");
    expect(body).toContain("background: var(--sub-bg-pressed");
  });

  it("サブボタン4つは、違う色で、どれも文字(濃い茶色)とのコントラスト比が7以上(読みやすい)。押したときの色は、少し濃い", () => {
    const textColor = "#4b3a2e";
    const colors = ["sub-book", "sub-rank", "sub-settings", "sub-credits"].map((name) => {
      const body = rule(`.title-sub-buttons .${name}`);
      const get = (prop: string) => body.match(new RegExp(`--${prop}: (#[0-9a-f]{6});`))![1];
      return { name, bg: get("sub-bg"), pressed: get("sub-bg-pressed") };
    });
    expect(new Set(colors.map((c) => c.bg)).size).toBe(4);
    for (const c of colors) {
      expect(contrast(textColor, c.bg), c.name).toBeGreaterThanOrEqual(7);
      expect(contrast(textColor, c.pressed), `${c.name}(押したとき)`).toBeGreaterThanOrEqual(7);
      expect(luminance(c.pressed), `${c.name}: 押したときは、少し濃い`).toBeLessThan(luminance(c.bg));
    }
  });

  it("背景: 最初の画面の背景画像を、軽くぼかして、不透明度30〜40%で敷く", () => {
    const bg = rule(".title-bg");
    const opacity = Number(bg.match(/opacity: ([0-9.]+);/)![1]);
    expect(opacity).toBeGreaterThanOrEqual(0.3);
    expect(opacity).toBeLessThanOrEqual(0.4);
    expect(bg).toMatch(/filter: blur\(/);
    expect(bg).toContain("pointer-events: none;");
  });

  it("コト: 1.15倍前後(11rem → 12.65rem)。足元にやわらかい楕円の影、後ろに放射状の光の輪(白〜ごく薄いミント)", () => {
    const size = rem(rule(".title-koto .mascot-large"), "--mascot-size");
    expect(size / 11).toBeGreaterThanOrEqual(1.1);
    expect(size / 11).toBeLessThanOrEqual(1.2);
    const glow = rule(".title-koto-glow");
    expect(glow).toContain("radial-gradient(");
    expect(glow).toMatch(/rgba\(255, 255, 255, 0\.9\d?\)/);
    expect(glow).toContain("border-radius: 50%;");
    const shadow = rule(".title-koto-shadow");
    expect(shadow).toContain("border-radius: 50%;");
    expect(shadow).toMatch(/filter: blur\(/);
  });

  it("カード: 白に近い半透明・薄い縁・軽い影。進捗バーは、ミント色・角丸・細め", () => {
    const card = rule(".title-card");
    expect(card).toMatch(/background: rgba\(255, 255, 255, 0\.[7-8]\d*\);/);
    expect(card).toMatch(/border: 1px solid/);
    expect(card).toMatch(/box-shadow:/);
    const bar = rule(".mastery-bar");
    expect(bar).toContain("border-radius: 999px;");
    expect(rem(bar, "height")).toBeLessThanOrEqual(0.6);
    expect(rule(".mastery-bar-fill")).toMatch(/linear-gradient\(90deg, #[0-9a-f]{6}, #[0-9a-f]{6}\)/);
  });

  it("下部: 余白は、端末の下の安全領域を考慮する。ホーム画面には、動く装飾(アニメーション)を入れない", () => {
    expect(rule(".screen-title")).toContain("env(safe-area-inset-bottom)");
    const home = css.slice(css.indexOf("\n.title-hero {"), css.indexOf("\n.mastery-complete {"));
    expect(home).not.toMatch(/animation:|@keyframes/);
  });
});
