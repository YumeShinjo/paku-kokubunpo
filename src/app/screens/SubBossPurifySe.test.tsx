import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SessionResult } from "@/features/quiz/QuizPlayer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const captured: { onComplete: ((r: SessionResult) => void) | null } = { onComplete: null };
vi.mock("@/features/quiz/QuizPlayer", () => ({
  QuizPlayer: (props: { onComplete: (r: SessionResult) => void }) => {
    captured.onComplete = props.onComplete;
    return <div data-testid="quiz" />;
  },
}));
const audio = vi.hoisted(() => ({ playSe: vi.fn(), duckBgm: vi.fn() }));
vi.mock("@/lib/audio", async () => {
  const actual = await vi.importActual<typeof import("@/lib/audio")>("@/lib/audio");
  return { ...actual, playSe: audio.playSe, duckBgm: audio.duckBgm };
});

const WIN: SessionResult = { correctCount: 12, answered: 15, maxCombo: 4, bossDefeated: true, hpLeft: 0 };

describe("小ボス撃破の効果音(subBossPurify)", () => {
  let container: HTMLDivElement;
  let root: Root;
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("小ボスのいる7エリアすべてで、小ボスを倒したとき subBossPurify が鳴る(subBossClear は鳴らない)", async () => {
    const { areas } = await import("@/data/areas");
    const bossAreas = areas.filter((a) => a.implemented && a.subBossName !== undefined);
    expect(bossAreas).toHaveLength(7);
    for (const area of bossAreas) {
      vi.resetModules();
      audio.playSe.mockClear();
      const { useProgressStore } = await import("@/app/store/progressStore");
      const { getStagesForArea } = await import("@/data/stages");
      const { useSessionStore } = await import("@/app/store/sessionStore");
      const { StageScreen } = await import("./StageScreen");
      const before = areas.filter((a) => a.implemented && a.order < area.order).flatMap((a) => getStagesForArea(a.id).map((s) => s.id));
      const normals = getStagesForArea(area.id).filter((s) => s.type === "normal").map((s) => s.id);
      useProgressStore.setState({ clearedStageIds: [...before, ...normals], totalScore: 0, bossLosses: {}, assistedStageIds: [] });
      useSessionStore.setState({ active: null });
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);
      act(() => root.render(<StageScreen areaId={area.id} stageId={`${area.id}-subboss`} />));
      act(() => captured.onComplete!(WIN));
      const kinds = audio.playSe.mock.calls.map(([kind]) => kind);
      expect(kinds, area.id).toContain("subBossPurify");
      expect(kinds, area.id).not.toContain("subBossClear");
      act(() => root.unmount());
      container.remove();
      root = createRoot((container = document.createElement("div")));
    }
    // 7エリア分、モジュールを読み込み直すので、動作の遅い環境では5秒の既定値に収まらない(30秒)
  }, 30_000);
});
