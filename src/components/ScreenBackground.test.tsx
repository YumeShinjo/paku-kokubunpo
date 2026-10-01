import { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/assets/registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/assets/registry")>();
  return { ...actual, findImage: (name: string) => `url:${name}` };
});

import { StageVisual } from "./ScreenBackground";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync("src/styles/global.css", "utf-8");

function render(el: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(el));
  return { container, done: () => (act(() => root.unmount()), container.remove()) };
}

describe("背景の帯(StageVisual): 画像を繰り返し並べない(PCなど横に広い画面で、つなぎ目が出ないように)", () => {
  it("通常ステージの帯: 画像全体を1枚だけ置く層(art)と、同じ画像を拡大してぼかした層(fill)の2層。帯自身には、背景画像を付けない", () => {
    const { container, done } = render(<StageVisual name="prologue" />);
    const visual = container.querySelector<HTMLElement>(".stage-visual")!;
    expect(visual.style.backgroundImage).toBe("");
    expect(visual.querySelector(".stage-visual-art")).not.toBeNull();
    expect(visual.querySelector(".stage-visual-fill")).not.toBeNull();
    done();
  });

  it("ボス戦の帯(tall): これまでどおり、1枚の cover", () => {
    const { container, done } = render(<StageVisual name="prologue" tall />);
    const visual = container.querySelector<HTMLElement>(".stage-visual")!;
    expect(visual.style.backgroundImage).toContain("bg/prologue");
    expect(visual.querySelector(".stage-visual-art")).toBeNull();
    done();
  });

  const rule = (selector: string) => {
    const start = css.indexOf(`\n${selector} {`);
    return start < 0 ? "" : css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  };

  it("CSS: 帯の2層とボス戦の帯は、繰り返さない(no-repeat)", () => {
    const art = css.slice(css.lastIndexOf("\n.stage-visual-art {"));
    expect(art.slice(0, art.indexOf("}"))).toContain("background-size: contain;");
    expect(rule(".stage-visual-fill")).toContain("background-size: cover;");
    expect(css).toMatch(/\.stage-visual-fill,\s*\.stage-visual-art \{[^}]*background-repeat: no-repeat;/);
    expect(rule(".stage-visual-tall")).toContain("background-repeat: no-repeat;");
    // 帯自身に、contain(足りない分を繰り返しで埋めてしまう指定)を戻さない
    expect(rule(".stage-visual")).not.toContain("background-size");
  });

  it("CSS全体: 背景を contain にする規則は、必ず、繰り返さない指定(no-repeat)と一緒に書く", () => {
    const rules = css.split("}").filter((r) => /background-size:\s*contain/.test(r));
    expect(rules.length).toBeGreaterThan(0);
    for (const r of rules) expect(r, r.trim().split("{")[0]).toMatch(/background-repeat:\s*no-repeat/);
  });
});
