import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

// bg-card/<エリアid> があるエリアだけ、小さい背景。ないエリアは、bg/<エリアid> をそのまま使う
vi.mock("@/assets/registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/assets/registry")>();
  return {
    ...actual,
    findImage: (name: string) => (name === "bg-card/prologue" || name === "bg/kotobaNoIchiba" ? `url:${name}` : undefined),
  };
});

import { AreaSelectScreen } from "./AreaSelectScreen";
import { playableAreas } from "@/data/areas";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("エリア選択のカードの背景", () => {
  let container: HTMLDivElement | undefined;
  afterEach(() => container?.remove());

  it("小さい背景(bg-card)があれば、それを使う。なければ、通常の背景(bg)。どちらもなければ、背景なし", () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<AreaSelectScreen />));
    const bg = (areaId: string) => {
      const index = playableAreas.findIndex((a) => a.id === areaId);
      return container!.querySelectorAll<HTMLElement>(".area-card button")[index].style.getPropertyValue("--area-bg");
    };
    expect(bg("prologue")).toBe("url(url:bg-card/prologue)");
    expect(bg("kotobaNoIchiba")).toBe("url(url:bg/kotobaNoIchiba)");
    expect(bg("ohzaNoMa")).toBe("");
    act(() => root.unmount());
  });
});
