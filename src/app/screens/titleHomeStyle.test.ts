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
  it("戻るボタン: 48px以上(3rem)の丸いボタンで、左上。ノッチ・ダイナミックアイランドを避ける", () => {
    const back = rule(".title-back");
    expect(rem(back, "width")).toBeGreaterThanOrEqual(3);
    expect(rem(back, "height")).toBeGreaterThanOrEqual(3);
    expect(back).toContain("border-radius: 50%;");
    expect(back).toContain("top: max(0.6rem, env(safe-area-inset-top));");
    expect(back).toContain("left: max(0.6rem, env(safe-area-inset-left));");
  });

  it("音量ボタン(ホーム画面だけ): 右上。左上の戻るボタンと、同じ大きさ・同じ余白で、左右対称", () => {
    const back = rule(".title-back");
    const mute = rule(".mute-button.on-title"); // ホーム画面(タイトル画面)だけ、3rem(ほかの画面は、これまでの2.75rem)
    const home = rule(".mute-button.on-home");
    expect(rem(mute, "width")).toBe(rem(back, "width"));
    expect(rem(mute, "height")).toBe(rem(back, "height"));
    expect(rem(rule(".mute-button"), "width")).toBe(2.75);
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

  it("「はじめる」: いちばん大きいボタン(従来の5.2rem以上。高さに余裕のある画面では、さらに大きい)。厚み(濃いミントの縁)・上辺のハイライト・やわらかい影がある", () => {
    const primary = rule(".title-primary");
    expect(rem(primary, "min-height")).toBeGreaterThanOrEqual(5.5);
    expect(rem(primary, "min-height")).toBeGreaterThan(rem(rule(".title-forest"), "min-height")); // ほかのどのボタンより、高い
    expect(primary).toMatch(/0 var\(--primary-depth, 0\.3rem\) 0 #[0-9a-f]{6}/); // 下の縁(厚み。--primary-depth と同じ)
    expect(primary).toMatch(/inset 0 2px 0 rgba\(255, 255, 255, 0\.5\)/); // 上辺のハイライト
    expect(primary).toMatch(/0 0\.75rem 1rem rgba/); // やわらかい影
  });

  it("「はじめる」を押している間は、縁(厚み)の分だけ沈む。共通のボタンの縮みより優先される", () => {
    const start = css.indexOf('button.title-primary:not(:disabled):not([aria-disabled="true"]):not(.tap-to-start):active {');
    expect(start).toBeGreaterThan(0);
    const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
    expect(body).toContain("transform: translateY(var(--primary-depth, 0.3rem));");
    expect(body).toMatch(/box-shadow:\s*0 0 0 #/); // 縁がなくなる(縁の分だけ沈む)
  });

  it("サブボタン2つ: 押しやすい高さ(3rem = 48px以上)と2列のグリッド。押すと、沈み、色が濃くなる", () => {
    expect(rem(rule(".title-sub-buttons button"), "min-height")).toBeGreaterThanOrEqual(3);
    expect(rule(".title-sub-buttons")).toContain("grid-template-columns: repeat(2, 1fr);");
    const start = css.indexOf('.title-sub-buttons button:not(:disabled):not([aria-disabled="true"]):not(.tap-to-start):active {');
    expect(start).toBeGreaterThan(0);
    const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
    expect(body).toContain("transform: translateY(2px);");
    expect(body).toContain("background: var(--sub-bg-pressed");
  });

  it("縦に並ぶ下の要素(はじめる・言の葉の森・ことだまの書|ランキング・フッター)の見た目の間隔は、1つの変数(--home-gap)にそろう。「はじめる」の厚みの分は、余分にあける", () => {
    const screen = rule(".screen-title");
    expect(screen).toMatch(/--home-gap: [\d.]+rem;/);
    expect(screen).toMatch(/--home-base-gap: [\d.]+rem;/);
    expect(screen).toMatch(/--primary-depth: [\d.]+rem;/);
    expect(screen).toContain("gap: var(--home-base-gap);");
    // 見える縁から見える縁までの間隔 = 10px(0.625rem)
    expect(Number(screen.match(/--home-gap: ([\d.]+)rem;/)![1])).toBe(0.625);
    // 「はじめる」の厚み(--primary-depth)は、box-shadow の濃い帯と同じ変数
    expect(rule(".title-primary")).toContain("0 var(--primary-depth, 0.3rem) 0 #4fae8a");
    expect(Number(screen.match(/--primary-depth: ([\d.]+)rem;/)![1])).toBe(0.3);
    // 言の葉の森: 間隔 + 厚みの分。2つのボタン: 間隔。フッター: 間隔(文字の上の余白の分を引く)
    expect(rule(".title-forest")).toContain("margin-top: calc(var(--home-gap) - var(--home-base-gap) + var(--primary-depth));");
    expect(rule(".title-sub-buttons")).toContain("margin-top: calc(var(--home-gap) - var(--home-base-gap));");
    expect(rule(".title-primary")).toContain("margin-top: calc(var(--home-gap) - var(--home-base-gap));"); // 称号カード → はじめる
    expect(rule(".title-sub-buttons")).toContain("gap: var(--home-gap);"); // 2つのボタンの横の間隔も同じ
    // フッターだけ、少し広い(+0.3rem ≒ +5px)。下の縁(--sub-edge)と、文字の上の余白の分を引く
    expect(screen).toContain("--home-gap-footer: calc(var(--home-gap) + 0.3rem);");
    expect(screen).toContain("--sub-edge: 2px;");
    expect(rule(".title-footer")).toContain("margin-block: calc(var(--home-gap-footer) - var(--home-base-gap) - var(--sub-edge) - var(--footer-ink-offset))");
  });

  it("言の葉の森のカード: 上下の内側の余白が同じくらい(ふりがなの上端から上まで ≒ 説明の下端から下まで)。ふりがなを含む行は、固定の行の高さ(1.9)。説明との間に余白がある", () => {
    const card = rule(".title-forest");
    const padding = card.match(/padding: ([\d.]+)rem [\d.]+rem ([\d.]+)rem;/)!;
    expect(Math.abs(Number(padding[1]) - Number(padding[2]))).toBeLessThanOrEqual(0.08);
    expect(rule(".title-forest .forest-name")).toContain("line-height: var(--ruby-line-height);");
    expect(rem(rule(".title-forest .forest-sub"), "margin-top")).toBeGreaterThan(0);
  });

  it("上のバー: せってい(歯車)は、戻るボタンと同じ大きさ・同じ高さで、音量ボタンの左に並ぶ", () => {
    const gear = rule(".title-settings");
    const back = rule(".title-back");
    expect(rem(gear, "width")).toBe(rem(back, "width"));
    expect(rem(gear, "height")).toBe(rem(back, "height"));
    expect(rem(gear, "width")).toBeGreaterThanOrEqual(3);
    expect(gear).toContain("top: max(0.6rem, env(safe-area-inset-top));");
    // 右の端は音量ボタン(右の余白0.6rem)。その幅(3rem)とすきま(0.5rem)の分だけ、左に離す
    expect(gear).toContain("right: calc(max(0.6rem, env(safe-area-inset-right)) + 3rem + 0.5rem);");
  });

  it("フッター: タップできる高さは約44px(2.5rem以上)。文字は小さく、中央に並ぶ", () => {
    expect(rem(rule(".title-footer button"), "min-height")).toBeGreaterThanOrEqual(2.5);
    expect(rule(".title-footer")).toContain("justify-content: center;");
    expect(rule(".title-footer button")).toContain("font-size: 0.7rem;");
  });

  it("称号カード: 称号が左、進捗(バーと数字)が右の1行。入りきらないときは、折り返す", () => {
    const card = rule(".title-card");
    expect(card).toContain("flex-direction: row;");
    expect(card).toContain("flex-wrap: wrap;");
  });

  it("サブボタン2つは、違う色で、どれも文字(濃い茶色)とのコントラスト比が7以上(読みやすい)。押したときの色は、少し濃い", () => {
    const textColor = "#4b3a2e";
    const colors = ["sub-book", "sub-rank"].map((name) => {
      const body = rule(`.title-sub-buttons .${name}`);
      const get = (prop: string) => body.match(new RegExp(`--${prop}: (#[0-9a-f]{6});`))![1];
      return { name, bg: get("sub-bg"), pressed: get("sub-bg-pressed") };
    });
    expect(new Set(colors.map((c) => c.bg)).size).toBe(2);
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

  it("コト: 残りの高さに合わせて大きくする(下限6rem・上限15rem = 従来の12.65remの1.15倍以上)。足元にやわらかい楕円の影、後ろに放射状の光の輪(白〜ごく薄いミント)", () => {
    const stage = rule(".title-koto-stage");
    const clamp = stage.match(/--koto-size: clamp\(([\d.]+)rem, min\(100cqh, 100cqw\), ([\d.]+)rem\);/)!;
    expect(clamp).not.toBeNull();
    expect(Number(clamp[2]) / 12.65).toBeGreaterThanOrEqual(1.15); // 今の1.15倍から、使える高さに応じて、さらに大きく
    expect(Number(clamp[2])).toBeLessThanOrEqual(16); // PCで、大きすぎない上限
    expect(rule(".title-koto")).toContain("container-type: size;"); // 残りの高さ(cqh)を測る入れ物
    expect(rule(".title-koto")).toContain("flex: 1 1 0;");
    expect(rule(".title-koto-stage .mascot-large")).toContain("--mascot-size: var(--koto-size);");
    const glow = rule(".title-koto-glow");
    expect(glow).toContain("radial-gradient(");
    expect(glow).toMatch(/rgba\(255, 255, 255, 0\.9\d?\)/);
    expect(glow).toContain("border-radius: 50%;");
    const shadow = rule(".title-koto-shadow");
    expect(shadow).toContain("border-radius: 50%;");
    // ぼかし(filter)は、枠の外へにじんで、下の帯に被る。枠の中だけで、まわりへ薄くなる影にする
    expect(shadow).not.toMatch(/filter:/);
    expect(shadow).toMatch(/background: radial-gradient\(closest-side,/);
  });

  it("称号と進捗の帯: 押せないので、平らにする(枠・影・白い背景なし)。進捗バーは、ミント色・角丸・細め。称号は、枠つきのチップではなく、王冠 + 文字だけ", () => {
    const card = rule(".title-card");
    expect(card).toMatch(/background: none;/);
    expect(card).toMatch(/border: 0;/);
    expect(card).toMatch(/box-shadow: none;/);
    const flat = rule(".title-badge-flat");
    expect(flat).toMatch(/border: 0;/);
    expect(flat).toMatch(/background: none;/);
    const bar = rule(".mastery-bar");
    expect(bar).toContain("border-radius: 999px;");
    expect(rem(bar, "height")).toBeLessThanOrEqual(0.6);
    expect(rule(".mastery-bar-fill")).toMatch(/linear-gradient\(90deg, #[0-9a-f]{6}, #[0-9a-f]{6}\)/);
  });

  it("押せる苦手問題の帯: 1行・高さ48px以上。色・縁・下の厚みがあって、ボタンと分かる", () => {
    const badge = rule(".hungry-badge");
    expect(rem(badge, "min-height")).toBeGreaterThanOrEqual(3);
    expect(badge).toMatch(/border: 2px solid/);
    expect(badge).toMatch(/box-shadow: 0 2px 0/);
    expect(badge).toContain("white-space: nowrap;");
  });

  it("コトの影・光の輪は、コトの枠の中に収まり、ボタン・カード・帯より後ろ(重なりの順番)", () => {
    // 光の輪は、枠と同じ大きさ(枠の外へ、にじまない)。枠でも切る。影は、ぼかしを使わず、枠の中の楕円
    expect(rule(".title-koto-glow")).toContain("width: 100%;");
    expect(rule(".title-koto-glow")).toContain("height: 100%;");
    expect(rule(".title-koto-stage")).toContain("overflow: clip;");
    // コトの場所(.title-hero)は後ろ(z-index: 0)、その下の要素は前(z-index: 1)。positioned の要素は、順番に関係なく、前へ出るため
    expect(rule(".title-hero")).toContain("z-index: 0;");
    expect(rule(".title-hero")).toContain("position: relative;");
    const front = css.slice(css.indexOf(".screen-title > :is("));
    const frontRule = front.slice(0, front.indexOf("}"));
    for (const selector of [".title-status", ".title-primary", ".title-forest", ".title-sub-buttons", ".title-footer"]) expect(frontRule).toContain(selector);
    expect(frontRule).toContain("z-index: 1;");
  });

  it("下部: 余白は、端末の下の安全領域を考慮する。動くものは、吹き出しの短い出現(opacity / transform だけ)のみ。動きを減らす設定では止まる。ずっと動き続けるものはない", () => {
    expect(rule(".screen-title")).toContain("env(safe-area-inset-bottom)");
    const home = css.slice(css.indexOf("\n.title-hero {"), css.indexOf("\n.mastery-complete {"));
    expect(home).not.toMatch(/infinite/);
    expect([...home.matchAll(/@keyframes ([\w-]+)/g)].map((m) => m[1])).toEqual(["title-bubble-in"]);
    const keyframes = home.slice(home.indexOf("@keyframes title-bubble-in"), home.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(keyframes).toContain("opacity");
    expect(keyframes).toContain("transform");
    expect(keyframes).not.toMatch(/(top|left|width|height|margin)\s*:/);
    expect(home).toMatch(/prefers-reduced-motion: reduce[^}]*\{[^}]*animation: none;/);
  });
});
