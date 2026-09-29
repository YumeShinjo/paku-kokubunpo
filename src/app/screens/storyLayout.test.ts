import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/global.css", "utf-8");

/** セレクタで始まる最初のルール(波括弧の中身)を取り出す。コメントの中の同名の文字列は飛ばして、行頭のものだけを探す */
function rule(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) return "";
  const open = css.indexOf("{", start);
  return css.slice(open + 1, css.indexOf("}", open));
}

/**
 * ストーリー画面: 立ち絵の領域の高さを固定して、台詞の長さでテキストボックスの高さが変わっても、立ち絵が動かない。
 * (jsdom にはレイアウトがないので、CSS の取り決めそのものを確かめる。実際の見た目はブラウザで確認する)
 */
describe("ストーリー画面のレイアウト", () => {
  it("立ち絵の領域(.story-stage)は、余った高さを取り合わず(flex: none)、高さが固定されている", () => {
    const stage = rule(".story-stage");
    expect(stage).toContain("flex: none;");
    expect(stage).toMatch(/height: calc\(100dvh - [\d.]+rem\);/);
    expect(stage).not.toContain("flex: 1;");
  });

  it("立ち絵の領域は、はみ出した透過の余白を切り取り(overflow: hidden)、立ち絵は下端にそろえて左右の置き場に置く", () => {
    expect(rule(".story-stage")).toContain("overflow: hidden;");
    const character = rule(".story-character");
    expect(character).toContain("position: absolute;");
    expect(character).toContain("bottom: var(--story-foot);");
    expect(rule(".story-character-left")).toContain("left: 0;");
    expect(rule(".story-character-right")).toContain("right: 0;");
  });

  it("幅360px以下でも、ストーリー画面の背景は左右いっぱいに敷く(.screen の余白が戻らない)", () => {
    const media = css.slice(css.indexOf("@media (max-width: 360px)"));
    expect(media).toMatch(/\.screen-story \{\s*padding-left: 0;\s*padding-right: 0;/);
  });

  it("画面は上から積む(下寄せにしない)ので、テキストボックスが伸びても、上の立ち絵は動かない", () => {
    const screen = rule(".screen-story");
    expect(screen).toContain("justify-content: flex-start;");
    expect(screen).not.toContain("flex-end");
  });

  it("テキストボックスは、台詞の長さに関わらず高さが固定(長い台詞はその中でスクロール)。送りの合図はその右下に固定", () => {
    const box = rule(".story-textbox");
    expect(box).toContain("height: 12rem;");
    expect(box).toContain("overflow-y: auto;");
    expect(box).not.toContain("min-height");
    const hint = rule(".story-tap-hint");
    expect(hint).toContain("position: absolute;");
    expect(hint).toContain("bottom:");
  });

  it("スキップは画面の右上、ミュートは会話シーンでは左上。右下には何も置かない", () => {
    const skip = rule(".story-skip");
    expect(skip).toContain("position: absolute;");
    expect(skip).toContain("right:");
    expect(skip).toContain("top:");
    const mute = rule(".mute-button.in-story");
    expect(mute).toContain("left:");
    expect(mute).toContain("top:");
    expect(mute).toContain("bottom: auto;");
  });
});
