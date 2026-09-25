import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useStatsStore } from "@/app/store/statsStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { AreaSelectScreen } from "./AreaSelectScreen";
import { FreePracticeScreen } from "./FreePracticeScreen";
import { StageSelectScreen } from "./StageSelectScreen";
import { ZukanScreen } from "./ZukanScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** エリアは固定の順番でしか進めない。画面の側でも、入れないエリアには入れない */
describe("エリアの固定順(画面)", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (el: React.ReactElement) => act(() => root.render(el));

  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
    useNavigationStore.setState({ screen: { name: "areaSelect" } });
    useTutorialStore.getState().markSeen("zukan");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useStatsStore.setState({ unitRecent: {} });
  });

  const areaButtons = () => [...container.querySelectorAll<HTMLButtonElement>(".area-list button")];

  it("エリア選択: 最初は序章だけ押せる。ほかは押せず、「前のエリアの小ボスを浄化すると開くよ」と出る", () => {
    render(<AreaSelectScreen />);
    const buttons = areaButtons();
    expect(buttons).toHaveLength(8);
    expect(buttons[0].disabled).toBe(false);
    for (const b of buttons.slice(1)) expect(b.disabled).toBe(true);
    expect(buttons[1].textContent).toContain("ことばの分かれ道をクリアすると");
    expect(buttons[2].textContent).toContain("ことばの市場の小ボスを浄化"); // 鍛冶場に入るには、市場の小ボスを倒す
    expect(buttons[0].querySelector(".area-locked")).toBeNull();
  });

  it("エリア選択: 序章を終えると市場が開き、市場の小ボスを倒すと鍛冶場が開く(その次はまだ)", () => {
    useProgressStore.setState({ clearedStageIds: ["prologue-stage1", "prologue-stage2"] });
    render(<AreaSelectScreen />);
    expect(areaButtons()[1].disabled).toBe(false);
    expect(areaButtons()[2].disabled).toBe(true);
    const ichiba = ["kotobaNoIchiba-stage1", "kotobaNoIchiba-stage2", "kotobaNoIchiba-stage3", "kotobaNoIchiba-stage4", "kotobaNoIchiba-stage5"];
    useProgressStore.setState({ clearedStageIds: ["prologue-stage1", "prologue-stage2", ...ichiba, "kotobaNoIchiba-subboss"] });
    render(<AreaSelectScreen key="2" />);
    expect(areaButtons()[2].disabled).toBe(false);
    expect(areaButtons()[3].disabled).toBe(true);
  });

  it("ステージ選択: 入れないエリアを直接開いても、ステージは出ず、案内だけが出る", () => {
    render(<StageSelectScreen areaId="namerakaNoTaki" />);
    expect(container.querySelector(".stage-list")).toBeNull();
    expect(container.textContent).toContain("まだ入れないよ");
  });

  it("ステージ選択: 開放されたエリアでも、小ボスは通常ステージをすべてクリアするまで押せない(ヒントつき)", () => {
    useProgressStore.setState({ clearedStageIds: ["prologue-stage1", "prologue-stage2"] });
    render(<StageSelectScreen areaId="kotobaNoIchiba" />);
    const buttons = [...container.querySelectorAll<HTMLButtonElement>(".stage-list li > button:first-child")];
    const boss = buttons[buttons.length - 1];
    for (const b of buttons.slice(0, -1)) expect(b.disabled).toBe(false);
    expect(boss.disabled).toBe(true);
    expect(boss.textContent).toContain("通常ステージをすべてクリアすると");
  });

  it("自由練習: 入れないエリアの単元には入れない(練習の画面ではなく、案内が出る)", () => {
    render(<FreePracticeScreen unitId="onbin" />); // なめらかの滝の単元
    expect(container.querySelector(".stage-header")).toBeNull();
    expect(container.textContent).toContain("まだ入れないよ");
  });

  it("自由練習: 開放されたエリアの単元には入れる", () => {
    useProgressStore.setState({ clearedStageIds: ["prologue-stage1", "prologue-stage2"] });
    render(<FreePracticeScreen unitId="hinshi-bunrui" />);
    expect(container.textContent).not.toContain("まだ入れないよ");
  });

  it("ことだまの書: 入れないエリアの単元の行は押せない。開放済みの行は押せる", () => {
    useProgressStore.setState({ clearedStageIds: ["prologue-stage1", "prologue-stage2"] });
    render(<ZukanScreen />);
    const rows = [...container.querySelectorAll<HTMLButtonElement>(".zukan-row")];
    const text = (b: HTMLButtonElement) => b.textContent ?? "";
    const enabled = rows.filter((b) => !b.disabled).map(text);
    const disabled = rows.filter((b) => b.disabled).map(text);
    expect(enabled.some((t) => t.includes("文節"))).toBe(true); // 序章
    expect(enabled.some((t) => t.includes("品詞"))).toBe(true); // ことばの市場(開放済み)
    expect(disabled.some((t) => t.includes("音便"))).toBe(true); // なめらかの滝(まだ)
    expect(disabled.some((t) => t.includes("敬語") || t.includes("尊敬語"))).toBe(true); // 王座の間(まだ)
  });
});
