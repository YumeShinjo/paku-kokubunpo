import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useMasteryStore } from "@/app/store/masteryStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { playableAreas } from "@/data/areas";
import { getQuestionsForArea } from "@/data/questionLoader";
import { getStagesForArea } from "@/data/stages";
import { AreaSelectScreen } from "./AreaSelectScreen";
import { StageSelectScreen } from "./StageSelectScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const clearAll = (areaId: string) => getStagesForArea(areaId).map((s) => s.id);

describe("エリア選択・ステージ選択の見た目(状態の表示)", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (el: React.ReactElement) => act(() => root.render(el));
  const qa = <T extends Element>(selector: string) => [...container.querySelectorAll<T>(selector)];

  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
    useMasteryStore.setState({ correctQuestionIds: [], lastSyncedCount: 0 });
    useNavigationStore.setState({ screen: { name: "areaSelect" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  describe("エリア選択", () => {
    it("カードごとに、番号バッジ・単元名・進捗バーがある。序章は「序」、ほかは1〜7", () => {
      render(<AreaSelectScreen />);
      const cards = qa(".area-card");
      expect(cards).toHaveLength(playableAreas.length);
      expect(cards.map((c) => c.querySelector(".area-num")?.textContent)).toEqual(["序", "1", "2", "3", "4", "5", "6", "7"]);
      for (const c of cards) {
        expect(c.querySelector(".area-unit")).not.toBeNull();
        expect(c.querySelector('[role="progressbar"]')).not.toBeNull();
      }
    });

    it("状態: 最初は序章が「挑戦中」、ほかは「ロック中」(鍵のアイコン。絵文字は使わない)。序章を終えると序章が「クリア済み」", () => {
      render(<AreaSelectScreen />);
      let cards = qa(".area-card");
      expect(cards[0].className).toContain("area-current");
      expect(cards[0].textContent).toContain("挑戦");
      for (const c of cards.slice(1)) {
        expect(c.className).toContain("area-locked");
        expect(c.querySelector(".area-locked svg")).not.toBeNull();
        expect(c.textContent).not.toContain("🔒");
      }
      useProgressStore.setState({ clearedStageIds: clearAll("prologue") });
      render(<AreaSelectScreen key="2" />);
      cards = qa(".area-card");
      expect(cards[0].className).toContain("area-cleared");
      expect(cards[0].textContent).toContain("クリア済み");
      expect(cards[1].className).toContain("area-current");
    });

    it("進捗バー: そのエリアの問題のうち、正解した問題の数(ほかのエリアの正解は数えない)", () => {
      const ichiba = getQuestionsForArea("kotobaNoIchiba");
      useMasteryStore.setState({ correctQuestionIds: [...ichiba.slice(0, 5).map((x) => x.id), getQuestionsForArea("prologue")[0].id] });
      render(<AreaSelectScreen />);
      const bars = qa('[role="progressbar"]');
      expect(bars[1].getAttribute("aria-valuenow")).toBe("5");
      expect(bars[1].getAttribute("aria-valuemax")).toBe(String(ichiba.length));
      expect(bars[0].getAttribute("aria-valuenow")).toBe("1");
      expect(bars[2].getAttribute("aria-valuenow")).toBe("0");
      expect(parseFloat((bars[1].firstElementChild as HTMLElement).style.width)).toBeCloseTo((5 / ichiba.length) * 100, 5);
      expect(qa(".area-count")[1].textContent).toBe(`5 / ${ichiba.length}問`);
    });

    it("押せるのは、これまでと同じエリアだけ(ロック中は押せない)", () => {
      render(<AreaSelectScreen />);
      const buttons = qa<HTMLButtonElement>(".area-list button");
      expect(buttons.map((b) => b.disabled)).toEqual([false, true, true, true, true, true, true, true]);
    });
  });

  describe("ステージ選択", () => {
    it("縦の道: ステージごとにノードがあり、序章を終えた市場では、最初のステージが「次」、小ボスは鍵つき", () => {
      useProgressStore.setState({ clearedStageIds: clearAll("prologue") });
      render(<StageSelectScreen areaId="kotobaNoIchiba" />);
      const steps = qa(".stage-step");
      const stages = getStagesForArea("kotobaNoIchiba");
      expect(steps).toHaveLength(stages.length);
      expect(steps.every((s) => s.querySelector(".stage-node"))).toBe(true);
      expect(steps[0].className).toContain("step-next");
      expect(steps[1].className).toContain("step-open");
      const boss = steps[steps.length - 1];
      expect(boss.className).toContain("step-boss");
      expect(boss.className).toContain("step-locked");
      expect(boss.querySelector(".stage-node svg")).not.toBeNull(); // 鍵(または王冠)のアイコン
      expect(boss.textContent).not.toContain("🔒");
    });

    it("クリアしたステージにはチェック、次のステージが1つだけ強調される。小ボスは、通常ステージを全部クリアすると次になる", () => {
      const stages = getStagesForArea("kotobaNoIchiba");
      const normals = stages.filter((s) => s.type === "normal").map((s) => s.id);
      useProgressStore.setState({ clearedStageIds: [...clearAll("prologue"), ...normals.slice(0, 2)] });
      render(<StageSelectScreen areaId="kotobaNoIchiba" />);
      let steps = qa(".stage-step");
      expect(steps[0].className).toContain("step-cleared");
      expect(steps[0].querySelector(".stage-node svg")).not.toBeNull(); // チェック
      expect(steps[1].className).toContain("step-cleared");
      expect(qa(".step-next")).toHaveLength(1);
      expect(steps[2].className).toContain("step-next");
      expect(steps[2].textContent).toContain("つぎは");

      useProgressStore.setState({ clearedStageIds: [...clearAll("prologue"), ...normals] });
      render(<StageSelectScreen areaId="kotobaNoIchiba" key="b" />);
      steps = qa(".stage-step");
      const boss = steps[steps.length - 1];
      expect(boss.className).toContain("step-next");
      expect(boss.className).toContain("step-boss");
      expect(qa<HTMLButtonElement>(".stage-step > button:first-child").every((b) => !b.disabled)).toBe(true);
    });

    it("ロック中のステージのボタンは押せない(解放条件は変えていない)", () => {
      useProgressStore.setState({ clearedStageIds: clearAll("prologue") });
      render(<StageSelectScreen areaId="kotobaNoIchiba" />);
      const buttons = qa<HTMLButtonElement>(".stage-step > button:first-child");
      expect(buttons.slice(0, -1).every((b) => !b.disabled)).toBe(true);
      expect(buttons[buttons.length - 1].disabled).toBe(true);
    });
  });
});
