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

  it("画面は上から積む(下寄せにしない)ので、テキストボックスが伸びても、上の立ち絵は動かない", () => {
    const screen = rule(".screen-story");
    expect(screen).toContain("justify-content: flex-start;");
    expect(screen).not.toContain("flex-end");
  });

  it("テキストボックスは、短い台詞でも一定の高さを確保する(ボタンの位置が大きく動かない)", () => {
    expect(rule(".story-textbox")).toContain("min-height: 9rem;");
  });
});
