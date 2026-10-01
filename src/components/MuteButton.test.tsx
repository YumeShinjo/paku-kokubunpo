import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MuteButton } from "./MuteButton";
import { useNavigationStore } from "@/app/store/navigationStore";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("音量ボタンの位置(クラス)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useNavigationStore.setState({ screen: { name: "title" }, splashOpen: false });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("ホーム画面では on-home(右上)、会話では in-story(左上)、ほかの画面では追加のクラスなし(右下)", () => {
    act(() => root.render(<MuteButton />));
    const button = container.querySelector("button")!;
    expect(button.className).toContain("on-home");
    expect(button.className).not.toContain("in-story");

    // 言の葉の森(入口・出題)も、ホーム画面と同じ右上
    act(() => useNavigationStore.getState().goTo({ name: "kotonoha" }));
    expect(button.className).toContain("on-home");
    act(() => useNavigationStore.getState().goTo({ name: "kotonohaPlay", scope: "all" }));
    expect(button.className).toContain("on-home");

    act(() => useNavigationStore.getState().goTo({ name: "settings" }));
    expect(button.className).not.toContain("on-home");
    expect(button.className).not.toContain("in-story");

    act(() =>
      useNavigationStore.getState().goTo({ name: "story", eventId: "kotobaNoIchiba-intro", next: { name: "title" } }),
    );
    expect(button.className).toContain("in-story");
    expect(button.className).not.toContain("on-home");
  });
});
