import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useStatsStore } from "@/app/store/statsStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { EndingResultScreen } from "@/app/screens/EndingResultScreen";
import { TitleScreen } from "@/app/screens/TitleScreen";
import { ZukanScreen } from "@/app/screens/ZukanScreen";
import { ENDING_CHOICE_EVENT_ID } from "@/data/titles";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** 称号を表示する画面(ホーム・ことだまの書・エンディング結果)は、すべて同じ称号バッジ(王冠)を使う */
describe("称号バッジの統一", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (el: React.ReactElement) => act(() => root.render(el));

  beforeEach(() => {
    useStoryStore.setState({ choices: { [ENDING_CHOICE_EVENT_ID]: "castle" }, seenStoryIds: [] });
    useStatsStore.setState({ unitRecent: {} });
    useNavigationStore.setState({ screen: { name: "title" }, splashOpen: false });
    useTutorialStore.getState().markSeen("zukan");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useStoryStore.setState({ choices: {}, seenStoryIds: [] });
  });

  const badgeOf = () => {
    const badges = container.querySelectorAll(".title-badge");
    expect(badges).toHaveLength(1);
    return badges[0];
  };

  it("3つの画面とも、称号バッジは王冠のアイコンつきで、勲章(リボン)のアイコンは出ない", () => {
    const screens: [string, React.ReactElement][] = [
      ["ホーム", <TitleScreen key="t" />],
      ["ことだまの書", <ZukanScreen key="z" initialTab="memories" />],
      ["エンディング結果", <EndingResultScreen key="e" areaId="ohzaNoMa" next={{ name: "title" }} />],
    ];
    const texts = new Set<string>();
    for (const [name, screen] of screens) {
      render(screen);
      const badge = badgeOf();
      expect(badge.querySelector(".title-badge-icon")?.getAttribute("class"), name).toContain("lucide-crown");
      expect(badge.querySelector(".lucide-award"), name).toBeNull();
      texts.add(badge.textContent ?? "");
      act(() => root.render(<div />));
    }
    // どの画面でも、同じ称号なら、同じ文字(バッジの中身)
    expect(texts.size).toBe(1);
  });
});
