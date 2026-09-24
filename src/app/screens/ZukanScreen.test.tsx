import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { ZukanScreen } from "./ZukanScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("ことだまの書: 初回の使い方ガイド", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useTutorialStore.setState({ seenGuides: [] });
    useNavigationStore.setState({ screen: { name: "zukan" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<ZukanScreen />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("初めて開いたときは、使い方のガイドが出る", () => {
    expect(container.querySelector(".engine-guide")).not.toBeNull();
    expect(container.querySelector(".engine-guide-title")?.textContent).toContain("ことだまの書");
  });

  it("「わかった!」で閉じて既読になり、次に開いたときは出ない", () => {
    act(() => container.querySelector<HTMLButtonElement>(".engine-guide button")!.click());
    expect(container.querySelector(".engine-guide")).toBeNull();
    expect(useTutorialStore.getState().seenGuides).toContain("zukan");
    act(() => root.render(<ZukanScreen key="again" />));
    expect(container.querySelector(".engine-guide")).toBeNull();
  });

  it("設定の「操作の説明をもう一度見る」(既読のリセット)で、また出る", () => {
    useTutorialStore.getState().markSeen("zukan");
    act(() => root.render(<ZukanScreen key="seen" />));
    expect(container.querySelector(".engine-guide")).toBeNull();
    act(() => useTutorialStore.getState().resetGuides());
    act(() => root.render(<ZukanScreen key="reset" />));
    expect(container.querySelector(".engine-guide")).not.toBeNull();
  });
});
