import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 画像のファイルが置かれているかに関わらず、「どの名前の画像を引いたか」を img の src で確かめる
vi.mock("@/assets/registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/assets/registry")>();
  return { ...actual, findImage: (name: string) => `url:${name}` };
});

import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";
import { IMAGE } from "@/assets/registry";
import { areas } from "@/data/areas";
import { getStagesForArea } from "@/data/stages";
import { stageNodePortraitName } from "@/features/stageSelect/stageNodePortrait";
import { truthStoryId } from "@/features/story/storyIds";
import { StageSelectScreen } from "./StageSelectScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const clearAll = (areaId: string) => getStagesForArea(areaId).map((s) => s.id);

describe("ステージ選択: ボスの顔(倒すまでは浄化前、倒したあとは浄化後)", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (el: React.ReactElement) => act(() => root.render(el));
  const bossImage = (areaId: string) => {
    render(<StageSelectScreen areaId={areaId} key={Math.random()} />);
    return container.querySelector(".stage-step.step-boss .stage-node-face img")?.getAttribute("src");
  };

  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: [] });
    useStoryStore.setState({ seenStoryIds: [], choices: {} });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useProgressStore.setState({ clearedStageIds: [] });
  });

  it("画像の名前: 倒す前は浄化前(subboss-<エリア>)、倒したあとは浄化後(…-purified)", () => {
    expect(stageNodePortraitName({ type: "subBoss" }, "kotobaNoIchiba", false)).toBe("boss/subboss-kotobaNoIchiba");
    expect(stageNodePortraitName({ type: "subBoss" }, "kotobaNoIchiba", true)).toBe("boss/subboss-kotobaNoIchiba-purified");
    expect(stageNodePortraitName({ type: "lastBoss" }, "ohzaNoMa", false)).toBe(IMAGE.lastBossPossessed);
    expect(stageNodePortraitName({ type: "lastBoss" }, "ohzaNoMa", true)).toBe(IMAGE.lastBossPurified);
  });

  it("画面: 撃破前(挑戦できる状態でも、鍵つきでも)は浄化前、撃破後は浄化後の絵に切り替わる(全エリアの小ボス)", () => {
    const sub = areas.filter((a) => a.implemented && a.subBoss);
    expect(sub.length).toBeGreaterThan(0);
    for (const area of sub) {
      const index = areas.filter((a) => a.implemented).findIndex((a) => a.id === area.id);
      const before = areas.filter((a) => a.implemented).slice(0, index);
      const unlockPrevious = before.flatMap((a) => clearAll(a.id));
      const normals = getStagesForArea(area.id).filter((s) => s.type === "normal").map((s) => s.id);
      const boss = getStagesForArea(area.id).find((s) => s.type === "subBoss")!.id;

      // 鍵つき(通常ステージが残っている)
      useProgressStore.setState({ clearedStageIds: unlockPrevious });
      expect(bossImage(area.id), `${area.id} 鍵つき`).toBe(`url:boss/subboss-${area.id}`);
      // 挑戦できる(通常ステージを全部クリア。小ボスはまだ)
      useProgressStore.setState({ clearedStageIds: [...unlockPrevious, ...normals] });
      expect(bossImage(area.id), `${area.id} 挑戦できる`).toBe(`url:boss/subboss-${area.id}`);
      // 撃破後
      useProgressStore.setState({ clearedStageIds: [...unlockPrevious, ...normals, boss] });
      expect(bossImage(area.id), `${area.id} 撃破後`).toBe(`url:boss/subboss-${area.id}-purified`);
    }
  });

  it("王座の間: 宰相戦は、倒すまで浄化前の顔。最後のノードは、宰相を倒したあとの会話を見るまで、立ち絵なし(「？？？」の人影)", () => {
    const others = areas.filter((a) => a.implemented && a.id !== "ohzaNoMa").flatMap((a) => clearAll(a.id));
    const normals = getStagesForArea("ohzaNoMa").filter((s) => s.type === "normal").map((s) => s.id);
    useProgressStore.setState({ clearedStageIds: [...others, ...normals] });
    render(<StageSelectScreen areaId="ohzaNoMa" />);
    const steps = [...container.querySelectorAll(".stage-step")];
    const prime = steps.find((s) => s.className.includes("step-boss") && !s.className.includes("step-hidden"))!;
    expect(prime.querySelector(".stage-node-face img")!.getAttribute("src")).toBe("url:boss/subboss-ohzaNoMa"); // 浄化前
    const last = steps[steps.length - 1];
    expect(last.className).toContain("step-hidden");
    expect(last.querySelector("img")).toBeNull(); // 立ち絵なし
    expect(last.querySelector("strong")!.textContent).toBe("？？？");

    // 宰相を倒すと、宰相は浄化後の顔。会話(真相究明)を見終わるまでは、最後のノードは伏せたまま
    useProgressStore.setState({ clearedStageIds: [...others, ...normals, "ohzaNoMa-subboss"] });
    render(<StageSelectScreen areaId="ohzaNoMa" key="after" />);
    const after = [...container.querySelectorAll(".stage-step")];
    expect(after.find((s) => s.className.includes("step-cleared") && s.className.includes("step-boss"))!.querySelector("img")!.getAttribute("src")).toBe(
      "url:boss/subboss-ohzaNoMa-purified",
    );
    expect(after[after.length - 1].className).toContain("step-hidden");

    // 会話を見終わると、最後のノードは、王様の(取り憑かれた)立ち絵に切り替わる
    useStoryStore.setState({ seenStoryIds: [truthStoryId("ohzaNoMa")] });
    render(<StageSelectScreen areaId="ohzaNoMa" key="revealed" />);
    const revealed = [...container.querySelectorAll(".stage-step")];
    expect(revealed[revealed.length - 1].querySelector("img")!.getAttribute("src")).toBe(`url:${IMAGE.lastBossPossessed}`);
  });
});
