import { act } from "react";
import { createRoot } from "react-dom/client";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { TitleScreen } from "./TitleScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync("src/styles/global.css", "utf-8");

describe("タイトル画面のボタンレイアウト", () => {
  function render() {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<TitleScreen />));
    return { container, done: () => (act(() => root.unmount()), container.remove()) };
  }

  it("「はじめる」が主役(.title-primary)で、その下に、サブ機能4つが2×2のまとまり(.title-sub-buttons)になっている", () => {
    const { container, done } = render();
    const primary = container.querySelector(".title-primary")!;
    expect(primary.textContent).toContain("はじめる");
    const sub = container.querySelector(".title-sub-buttons")!;
    expect([...sub.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["ことだまの書", "ランキング", "せってい", "クレジット"]);
    // 主役は、サブ機能のまとまりの外(上)にある
    expect(sub.contains(primary)).toBe(false);
    expect(primary.compareDocumentPosition(sub) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    done();
  });

  it("サブ機能の4つのボタンは、これまでと同じ画面へ進む", () => {
    const { container, done } = render();
    const click = (label: string) =>
      act(() => [...container.querySelectorAll<HTMLButtonElement>(".title-sub-buttons button")].find((b) => b.textContent === label)!.click());
    click("ランキング");
    expect(useNavigationStore.getState().screen.name).toBe("ranking");
    click("せってい");
    expect(useNavigationStore.getState().screen.name).toBe("settings");
    click("ことだまの書");
    expect(useNavigationStore.getState().screen.name).toBe("zukan");
    click("クレジット");
    expect(useNavigationStore.getState().screen.name).toBe("credits");
    done();
  });

  it("CSS: 主役は縦幅が大きく、サブは2列グリッドで、ひと回り小さい。主役の色は、サブより濃いミント", () => {
    const rule = (selector: string) => {
      const start = css.indexOf(`\n${selector} {`);
      return css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
    };
    const rem = (body: string, prop: string) => Number(body.match(new RegExp(`${prop}: ([0-9.]+)rem`))![1]);
    const primary = rule(".title-primary");
    const sub = rule(".title-sub-buttons button");
    expect(rem(primary, "min-height")).toBeGreaterThan(rem(sub, "min-height") * 1.4);
    expect(rem(primary, "font-size")).toBeGreaterThan(rem(sub, "font-size"));
    expect(rule(".title-sub-buttons")).toContain("grid-template-columns: repeat(2, 1fr);");
    // 明るさ(R+G+B)は、主役のほうが低い(濃い)。ミント系(Gが最も高い)のまま
    const hex = (body: string) => {
      const [, r, g, b] = body.match(/background: #([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2});/)!;
      return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
    };
    const [pr, pg, pb] = hex(primary);
    const [sr, sg, sb] = hex(sub);
    expect(pr + pg + pb).toBeLessThan(sr + sg + sb);
    expect(pg).toBeGreaterThan(pr);
    expect(pg).toBeGreaterThan(pb);
    // 彩度は抑えたパステルトーン(最大と最小のチャンネルの差が小さい)
    expect(Math.max(pr, pg, pb) - Math.min(pr, pg, pb)).toBeLessThan(90);
  });
});
