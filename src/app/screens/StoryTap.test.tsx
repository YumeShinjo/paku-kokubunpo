import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { getStoryEvent } from "@/data/story/events";
import { introStoryId } from "@/features/story/storyIds";
import { useNavigationStore } from "@/app/store/navigationStore";
import { StoryScreen } from "./StoryScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const EVENT = introStoryId("prologue");

describe("会話シーンのタップ送り", () => {
  function render() {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    useNavigationStore.setState({ screen: { name: "settings" } });
    act(() => root.render(<StoryScreen eventId={EVENT} next={{ name: "title" }} />));
    return { container, done: () => (act(() => root.unmount()), container.remove()) };
  }
  const tap = (el: Element) => act(() => (el as HTMLElement).click());

  it("画面のどこをタップしても(背景・テキストボックスも)次の台詞へ進む。「つぎへ」ボタンはない", () => {
    expect(getStoryEvent(EVENT)!.lines.length).toBeGreaterThan(2);
    const { container, done } = render();
    const first = container.querySelector(".story-text")!.textContent;
    tap(container.querySelector(".story-textbox")!);
    const second = container.querySelector(".story-text")!.textContent;
    expect(second).not.toBe(first);
    tap(container.querySelector(".story-stage")!);
    expect(container.querySelector(".story-text")!.textContent).not.toBe(second);
    expect([...container.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["スキップ"]);
    done();
  });

  it("最後の台詞のあとのタップで、次の画面へ進む", () => {
    const { container, done } = render();
    const n = getStoryEvent(EVENT)!.lines.length;
    for (let i = 0; i < n; i++) tap(container.querySelector(".screen-story")!);
    expect(useNavigationStore.getState().screen.name).toBe("title");
    done();
  });

  it("スキップのボタンは残り、押すと、台詞を送らずに終わる(タップ送りとは別の動作)", () => {
    const { container, done } = render();
    tap(container.querySelector(".story-skip")!);
    expect(useNavigationStore.getState().screen.name).toBe("title");
    done();
  });
});
