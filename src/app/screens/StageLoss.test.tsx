import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionResult } from "@/features/quiz/QuizPlayer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** QuizPlayer は差し替えて、渡された props を控え、好きなタイミングで「負け」「勝ち」を返す */
const captured: { props: Record<string, unknown> | null } = { props: null };
vi.mock("@/features/quiz/QuizPlayer", () => ({
  QuizPlayer: (props: Record<string, unknown>) => {
    captured.props = props;
    return <div data-testid="quiz" />;
  },
}));
vi.mock("@/lib/audio", async () => {
  const actual = await vi.importActual<typeof import("@/lib/audio")>("@/lib/audio");
  return { ...actual, playSe: vi.fn(), duckBgm: vi.fn() };
});

const LOSS: SessionResult = { correctCount: 3, answered: 8, maxCombo: 1, bossDefeated: false, hpLeft: 9, lifeOut: true };
const WIN: SessionResult = { correctCount: 12, answered: 15, maxCombo: 4, bossDefeated: true, hpLeft: 0 };

describe("ボス戦に負けたとき: 連敗の救済(ライフ+1)・負けた画面・先へすすむ", () => {
  let container: HTMLDivElement;
  let root: Root;
  const AREA = "kotobaNoIchiba";
  const SUBBOSS = `${AREA}-subboss`;

  async function setup(areaId = AREA, stageId = SUBBOSS) {
    vi.resetModules();
    const { useProgressStore } = await import("@/app/store/progressStore");
    const { getStagesForArea } = await import("@/data/stages");
    const { areas } = await import("@/data/areas");
    // 前のエリアの全ステージと、このエリアの通常ステージを、クリア済みにして、ボスに挑める状態にする
    const target = areas.find((a) => a.id === areaId)?.order ?? 0;
    const before = areas.filter((a) => a.implemented && a.order < target).flatMap((a) => getStagesForArea(a.id).map((s) => s.id));
    const normals = getStagesForArea(areaId).filter((s) => s.type === "normal").map((s) => s.id);
    const cleared = [...before, ...normals];
    const prev: string[] = [];
    useProgressStore.setState({ clearedStageIds: [...new Set([...prev, ...cleared])], totalScore: 100, bossLosses: {}, assistedStageIds: [] });
    const { useNavigationStore } = await import("@/app/store/navigationStore");
    const { useSessionStore } = await import("@/app/store/sessionStore");
    useSessionStore.setState({ active: null });
    useNavigationStore.setState({ screen: { name: "stage", areaId, stageId } });
    const { StageScreen } = await import("./StageScreen");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<StageScreen areaId={areaId} stageId={stageId} />));
    return { useProgressStore, useNavigationStore, areas };
  }

  const complete = (result: SessionResult) => act(() => (captured.props!.onComplete as (r: SessionResult) => void)(result));
  const texts = () => [...container.querySelectorAll("button")].map((b) => b.textContent?.trim());
  const button = (text: string) => [...container.querySelectorAll("button")].find((b) => b.textContent?.trim() === text)!;

  beforeEach(() => {
    captured.props = null;
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("最初の挑戦のライフは5。負けるたびに+1(最大+4=9)。負けた回数は保存される", async () => {
    const { useProgressStore } = await setup();
    expect(captured.props!.maxLives).toBe(5);
    expect(captured.props!.lifeNote).toBeUndefined();
    const seen: number[] = [];
    for (let i = 1; i <= 6; i++) {
      complete(LOSS);
      expect(useProgressStore.getState().bossLosses[SUBBOSS]).toBe(i);
      act(() => button("もういちど").click());
      seen.push(captured.props!.maxLives as number);
    }
    expect(seen).toEqual([6, 7, 8, 9, 9, 9]); // 最大 +4
  });

  it("再挑戦のはじめに、「ライフが 1 ふえたよ！」の一言を出す(ぜんぶでいくつかも)。最大になったあとは、ふえている数の言い方", async () => {
    await setup();
    complete(LOSS);
    act(() => button("もういちど").click());
    expect(captured.props!.lifeNote).toBe("ライフが 1 ふえたよ！(ぜんぶで 6つ)");
    complete(LOSS);
    act(() => button("もういちど").click());
    expect(captured.props!.lifeNote).toBe("ライフが 1 ふえたよ！(ぜんぶで 7つ)");
    for (let i = 0; i < 3; i++) {
      complete(LOSS);
      act(() => button("もういちど").click());
    }
    expect(captured.props!.maxLives).toBe(9);
    expect(captured.props!.lifeNote).toBe("ライフが 4 ふえているよ！(ぜんぶで 9つ)");
  });

  it("負けた画面: 見出しは「ライフが なくなっちゃった…」。1回目は、「もういちど」を横いっぱいに、その下に「もどる」。「先へすすむ」は出ない", async () => {
    await setup();
    complete(LOSS);
    expect(container.querySelector("h2")?.textContent).toBe("ライフが なくなっちゃった…");
    expect(texts()).toEqual(["もういちど", "もどる"]);
    expect(container.querySelector(".stage-result-main.has-assist")).toBeNull();
  });

  it("同じ小ボスに2回負けると、「先へすすむ」が出る。「もういちど」と横に2つ並び、「もどる」は、その下", async () => {
    await setup();
    complete(LOSS);
    act(() => button("もういちど").click());
    complete(LOSS);
    expect(texts()).toEqual(["もういちど", "先へすすむ", "もどる"]);
    const main = container.querySelector(".stage-result-main.has-assist")!;
    expect([...main.querySelectorAll("button")].map((b) => b.textContent)).toEqual(["もういちど", "先へすすむ"]);
    expect(container.querySelector(".stage-result-back")!.textContent).toBe("もどる");
    expect(main.contains(container.querySelector(".stage-result-back"))).toBe(false);
  });

  it("ラスボスには、何度負けても「先へすすむ」を出さない。ライフの救済は、ラスボスにもある", async () => {
    const { useProgressStore } = await setup("ohzaNoMa", "ohzaNoMa-lastboss");
    // ラスボスに挑める状態(宰相を倒したあと)にする
    useProgressStore.setState({ clearedStageIds: [...useProgressStore.getState().clearedStageIds, "ohzaNoMa-subboss"] });
    act(() => root.render(<div />));
    act(() => root.unmount());
    root = createRoot(container);
    const { StageScreen } = await import("./StageScreen");
    act(() => root.render(<StageScreen areaId="ohzaNoMa" stageId="ohzaNoMa-lastboss" />));
    for (let i = 0; i < 3; i++) {
      complete(LOSS);
      expect(texts()).toEqual(["もういちど", "もどる"]);
      act(() => button("もういちど").click());
    }
    expect(captured.props!.maxLives).toBe(8);
  });

  it("「先へすすむ」: コトの助太刀の場面へ。助けてもらったクリアになり(クリア扱い・得点は足さない)、あとで自力で勝つと通常のクリアに上書きされる", async () => {
    const { useProgressStore, useNavigationStore } = await setup();
    complete(LOSS);
    act(() => button("もういちど").click());
    complete(LOSS);
    const scoreBefore = useProgressStore.getState().totalScore;
    act(() => button("先へすすむ").click());
    const state = useProgressStore.getState();
    expect(state.isStageCleared(SUBBOSS)).toBe(true); // 次のエリア解放・撃破後の場面などは、クリア扱いで動く
    expect(state.isStageAssisted(SUBBOSS)).toBe(true);
    expect(state.totalScore).toBe(scoreBefore); // 得点は足さない
    expect(state.bossLosses[SUBBOSS]).toBeUndefined(); // 負けた回数は消える
    const screen = useNavigationStore.getState().screen;
    expect(screen.name).toBe("story");
    if (screen.name !== "story") return;
    expect(screen.eventId).toBe(`${AREA}-subboss-assist`);
    // 場面のあとは、ふつうの撃破後の流れ(撃破後の会話 → ...)に合流する
    expect(screen.next.name === "story" ? screen.next.eventId : screen.next.name).toBe(`${AREA}-subboss-clear`);
    // あとで自力で勝つと、印が消える(通常のクリア。得点も入る)
    state.markStageCleared(SUBBOSS, 120);
    const after = useProgressStore.getState();
    expect(after.isStageAssisted(SUBBOSS)).toBe(false);
    expect(after.isStageCleared(SUBBOSS)).toBe(true);
    expect(after.totalScore).toBe(scoreBefore + 120);
  });

  it("勝つと、このボスの負けた回数が消える(得点も入る)", async () => {
    const { useProgressStore } = await setup();
    complete(LOSS);
    expect(useProgressStore.getState().bossLosses[SUBBOSS]).toBe(1);
    act(() => button("もういちど").click());
    complete(WIN);
    expect(useProgressStore.getState().bossLosses[SUBBOSS]).toBeUndefined();
    expect(useProgressStore.getState().isStageAssisted(SUBBOSS)).toBe(false);
    expect(useProgressStore.getState().totalScore).toBeGreaterThan(100);
  });

  it("「もどる」は、ステージ選択へ戻る", async () => {
    const { useNavigationStore } = await setup();
    complete(LOSS);
    act(() => button("もどる").click());
    expect(useNavigationStore.getState().screen).toEqual({ name: "stageSelect", areaId: AREA });
  });
});
