import { beforeEach, describe, expect, it } from "vitest";
import { useReviewStore } from "@/app/store/reviewStore";
import { useStatsStore } from "@/app/store/statsStore";
import { buildStageSession } from "./buildSession";

/** 序章: ステージ1=文節の区切り(bunsetsu-kubun)、ステージ2=単語の区切り(tango-kubun) */
describe("buildStageSession: 復習(星)の混ぜ方", () => {
  beforeEach(() => {
    useStatsStore.setState({ recentQuestionIds: [] });
    useReviewStore.setState({ starredQuestionIds: [] });
  });

  const units = (stageId: string) => buildStageSession(stageId, "prologue").map((q) => q.unit);

  it("別の単元の問題に星がついていても、そのステージには混ざらない(文節のステージに単語の問題が出ない)", () => {
    useReviewStore.setState({
      starredQuestionIds: ["wakare-tango-01", "wakare-tango-02", "wakare-tango-03", "wakare-bunsetsu-01"],
    });
    for (let i = 0; i < 60; i++) {
      expect(new Set(units("prologue-stage1")), `文節ステージ ${i}回目`).toEqual(new Set(["bunsetsu-kubun"]));
    }
  });

  it("単語のステージにも、文節の問題は混ざらない", () => {
    useReviewStore.setState({ starredQuestionIds: ["wakare-bunsetsu-01", "wakare-bunsetsu-02", "wakare-tango-04"] });
    for (let i = 0; i < 60; i++) {
      expect(new Set(units("prologue-stage2")), `単語ステージ ${i}回目`).toEqual(new Set(["tango-kubun"]));
    }
  });

  it("同じ単元の星の問題は、これまでどおり復習枠として混ざる", () => {
    useReviewStore.setState({ starredQuestionIds: ["wakare-bunsetsu-03"] });
    let appeared = 0;
    for (let i = 0; i < 60; i++) {
      if (buildStageSession("prologue-stage1", "prologue").some((q) => q.id === "wakare-bunsetsu-03")) appeared++;
    }
    expect(appeared).toBeGreaterThan(0);
  });

  it("出題数は変わらない(ステージ1は8問)", () => {
    useReviewStore.setState({ starredQuestionIds: ["wakare-tango-01"] });
    expect(buildStageSession("prologue-stage1", "prologue")).toHaveLength(8);
  });
});
