import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useMasteryStore } from "@/app/store/masteryStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";
import { playableAreas } from "@/data/areas";
import { truthStoryId } from "@/features/story/storyIds";
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
    useStoryStore.setState({ seenStoryIds: [], choices: {} });
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
        expect(c.querySelector(".area-chip-locked svg")).not.toBeNull();
        expect(c.querySelector(".area-locked")).not.toBeNull(); // 開く条件
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

    describe("王座の間のラスボス(ネタバレ対策)", () => {
      const before = playableAreas.filter((a) => a.id !== "ohzaNoMa").flatMap((a) => clearAll(a.id));
      const withoutSubBoss = before.filter((id) => id !== "ohzaNoMa-subboss");
      const lastNode = () => qa(".stage-step").slice(-1)[0];
      const spoilers = ["ラスボス", "王様", "おうさま", "ヴェルバルト", "王(", "乱れに飲まれた"];

      const expectNoSpoiler = () => {
        const node = lastNode();
        expect(node.className).toContain("step-hidden");
        expect(node.querySelector("strong")?.textContent).toBe("？？？");
        for (const word of spoilers) expect(container.textContent, word).not.toContain(word);
        expect(node.querySelector("img")).toBeNull(); // 立ち絵は出さない
        expect(node.querySelector(".stage-node-badge")?.textContent).toBe("？");
        expect(node.querySelector(".lucide-lock")).toBeNull(); // 鍵は使わない
        expect(node.querySelector(".stage-count")).toBeNull();
      };

      it("宰相を倒す前: 最後のノードは「？？？」。立ち絵も、ラスボス・王様の文字も出ない。押せない(これまでと同じ)", () => {
        useProgressStore.setState({ clearedStageIds: withoutSubBoss });
        render(<StageSelectScreen areaId="ohzaNoMa" />);
        expectNoSpoiler();
        expect(lastNode().querySelector<HTMLButtonElement>("button")!.disabled).toBe(true);
        // 小ボスのラベルは、これまでどおり
        expect(container.textContent).toContain("小ボス");
      });

      it("宰相を倒した直後でも、そのあとの会話(真相究明)を見終わるまでは、伏せたまま", () => {
        useProgressStore.setState({ clearedStageIds: before.concat("ohzaNoMa-subboss") });
        useStoryStore.setState({ seenStoryIds: ["ohzaNoMa-subboss-clear"] });
        render(<StageSelectScreen areaId="ohzaNoMa" />);
        expectNoSpoiler();
      });

      it("真相究明の会話を見終わると、「ラスボス: 王様」のラベルになり、押せる", () => {
        useProgressStore.setState({ clearedStageIds: before.concat("ohzaNoMa-subboss") });
        useStoryStore.setState({ seenStoryIds: ["ohzaNoMa-subboss-clear", truthStoryId("ohzaNoMa")] });
        render(<StageSelectScreen areaId="ohzaNoMa" />);
        const node = lastNode();
        expect(node.className).not.toContain("step-hidden");
        expect(node.querySelector("strong")?.textContent).toContain("ラスボス");
        expect(node.querySelector("strong")?.textContent).toContain("王様");
        expect(node.querySelector<HTMLButtonElement>("button")!.disabled).toBe(false);
        expect(node.querySelector(".stage-count")).not.toBeNull();
      });

      it("すでにラスボスを倒している保存データでは、いつでもラベルが出る", () => {
        useProgressStore.setState({ clearedStageIds: before.concat("ohzaNoMa-subboss", "ohzaNoMa-lastboss") });
        render(<StageSelectScreen areaId="ohzaNoMa" />);
        expect(lastNode().className).toContain("step-cleared");
        expect(lastNode().textContent).toContain("ラスボス");
      });

      it("ほかのエリアの小ボスは、これまでどおり「小ボス: ○○」と出る(伏せるのはラスボスだけ)", () => {
        useProgressStore.setState({ clearedStageIds: clearAll("prologue") });
        render(<StageSelectScreen areaId="kotobaNoIchiba" />);
        expect(lastNode().querySelector("strong")?.textContent).toContain("小ボス");
        expect(lastNode().className).not.toContain("step-hidden");
      });
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
