import { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/assets/registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/assets/registry")>();
  return { ...actual, findImage: (name: string) => `url:${name}` };
});

import { StageVisual } from "./ScreenBackground";
import { areas } from "@/data/areas";
import { DEFAULT_STAGE_VISUAL_FOCUS, STAGE_VISUAL_FOCUS, stageVisualFocus } from "@/data/stageVisualFocus";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync("src/styles/global.css", "utf-8");

function render(el: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(el));
  return { container, done: () => (act(() => root.unmount()), container.remove()) };
}

const rule = (selector: string) => {
  const start = css.indexOf(`\n${selector} {`);
  return start < 0 ? "" : css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
};

describe("背景の帯(StageVisual): 1枚の cover。繰り返さない・ぼかしで埋めない", () => {
  it("通常ステージの帯: 背景画像を1枚だけ付ける。縦の位置は、エリアごとの値(既定は50%)。余計な層(ぼかし・中央の1枚)は、ない", () => {
    const { container, done } = render(<StageVisual name="kotobaNoIchiba" />);
    const visual = container.querySelector<HTMLElement>(".stage-visual")!;
    expect(visual.style.backgroundImage).toContain("bg/kotobaNoIchiba");
    expect(visual.style.backgroundPosition).toBe(`center ${DEFAULT_STAGE_VISUAL_FOCUS}`);
    expect(visual.children).toHaveLength(0);
    done();
  });

  it("エリアごとの縦の位置が、帯に反映される(序章・荒れた背景も)", () => {
    const { container, done } = render(<StageVisual name="prologue" />);
    expect(container.querySelector<HTMLElement>(".stage-visual")!.style.backgroundPosition).toBe(`center ${STAGE_VISUAL_FOCUS.prologue}`);
    done();
    const corrupted = render(<StageVisual name="ohzaNoMa-corrupted" />);
    expect(corrupted.container.querySelector<HTMLElement>(".stage-visual")!.style.backgroundPosition).toBe(`center ${STAGE_VISUAL_FOCUS.ohzaNoMa}`);
    corrupted.done();
  });

  it("ボス戦の帯(tall): これまでどおり、CSSの cover・上寄せ(縦の位置は指定しない)", () => {
    const { container, done } = render(<StageVisual name="prologue" tall />);
    const visual = container.querySelector<HTMLElement>(".stage-visual")!;
    expect(visual.style.backgroundImage).toContain("bg/prologue");
    expect(visual.style.backgroundPosition).toBe("");
    done();
  });

  it("縦の位置(焦点): 既定値があり、すべて0〜100%。登録されているのは、実在するエリアだけ", () => {
    const pct = (v: string) => Number(v.replace("%", ""));
    expect(pct(DEFAULT_STAGE_VISUAL_FOCUS)).toBeGreaterThanOrEqual(0);
    expect(pct(DEFAULT_STAGE_VISUAL_FOCUS)).toBeLessThanOrEqual(100);
    for (const [key, value] of Object.entries(STAGE_VISUAL_FOCUS)) {
      expect(pct(value), key).toBeGreaterThanOrEqual(0);
      expect(pct(value), key).toBeLessThanOrEqual(100);
      expect(areas.some((a) => a.id === key.replace(/-corrupted$/, "")), key).toBe(true);
    }
    expect(stageVisualFocus("sugatakaeNoKajiba")).toBe(DEFAULT_STAGE_VISUAL_FOCUS);
    expect(stageVisualFocus("sugatakaeNoKajiba-corrupted")).toBe(DEFAULT_STAGE_VISUAL_FOCUS);
  });

  it("CSS: 帯は cover・繰り返さない。contain は使わない(帯の足りない分を、繰り返しで埋めてしまうため)。ボス戦の帯も同じ", () => {
    const visual = rule(".stage-visual");
    expect(visual).toContain("background-size: cover;");
    expect(visual).toContain("background-repeat: no-repeat;");
    expect(rule(".stage-visual-tall")).toContain("background-size: cover;");
    expect(rule(".stage-visual-tall")).toContain("background-repeat: no-repeat;");
    expect(css).not.toContain("stage-visual-fill");
    expect(css).not.toContain("stage-visual-art");
  });

  it("CSS全体: 背景を contain にする規則は、必ず、繰り返さない指定(no-repeat)と一緒に書く", () => {
    for (const r of css.split("}").filter((x) => /background-size:\s*contain/.test(x))) {
      expect(r, r.trim().split("{")[0]).toMatch(/background-repeat:\s*no-repeat/);
    }
  });
});
