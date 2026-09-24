import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { AreaSelectScreen } from "./AreaSelectScreen";
import { SettingsScreen } from "./SettingsScreen";
import { StageSelectScreen } from "./StageSelectScreen";
import { ZukanScreen } from "./ZukanScreen";

vi.mock("@/lib/rankingApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rankingApi")>()),
  rankingApi: { isConfigured: () => false },
}));
import { RankingScreen } from "./RankingScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** 「もどる」は、画面の一番下ではなく一番上(スクロールしても見える位置)にある */
describe("もどるボタンの位置", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useNavigationStore.setState({ screen: { name: "title" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const cases: [string, React.ReactElement][] = [
    ["エリア選択", <AreaSelectScreen key="a" />],
    ["ステージ選択", <StageSelectScreen key="s" areaId="prologue" />],
    ["設定", <SettingsScreen key="t" />],
    ["ことだまの書", <ZukanScreen key="z" />],
    ["ランキング", <RankingScreen key="r" />],
  ];

  for (const [name, element] of cases) {
    it(`${name}: 最初のボタンが「もどる」で、画面の下には「もどる」がない`, () => {
      act(() => root.render(element));
      const buttons = [...container.querySelectorAll("button")];
      expect(buttons[0].classList.contains("back-button"), name).toBe(true);
      expect(buttons[0].textContent).toContain("もどる");
      expect(buttons.filter((b) => b.textContent?.includes("もどる"))).toHaveLength(1);
    });
  }

  it("押すと前の画面へ戻る", () => {
    act(() => root.render(<SettingsScreen />));
    act(() => container.querySelector<HTMLButtonElement>(".back-button")!.click());
    expect(useNavigationStore.getState().screen.name).toBe("title");
  });
});
