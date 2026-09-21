import { describe, expect, it } from "vitest";
import { areas } from "@/data/areas";
import { storyEvents } from "@/data/story/events";
import { buildStoryArchive, countReplayableStories, STORY_PHASE_LABELS } from "./storyArchive";

describe("ストーリーの見返し(おもいで)", () => {
  it("まだ何も見ていなければ、1つも出ない", () => {
    expect(buildStoryArchive([])).toEqual([]);
  });

  it("見終わったストーリーだけを、エリアごとに並べる(未視聴は出さない)", () => {
    const groups = buildStoryArchive(["prologue-intro", "kotobaNoIchiba-intro", "kotobaNoIchiba-subboss-clear"]);
    expect(groups.map((g) => g.areaId)).toEqual(["prologue", "kotobaNoIchiba"]);
    expect(groups[1].entries.map((e) => e.label)).toEqual(["はじまり", "小ボスを浄化したあと"]);
    expect(groups[0].areaName).toBe("ことばの分かれ道");
  });

  it("エリアの順、ストーリーの流れの順に並ぶ(見た順ではない)", () => {
    const groups = buildStoryArchive(["ohzaNoMa-area-clear", "ohzaNoMa-intro", "prologue-area-clear", "prologue-intro"]);
    expect(groups.map((g) => g.areaId)).toEqual(["prologue", "ohzaNoMa"]);
    expect(groups[0].entries.map((e) => e.id)).toEqual(["prologue-intro", "prologue-area-clear"]);
    expect(groups[1].entries.map((e) => e.id)).toEqual(["ohzaNoMa-intro", "ohzaNoMa-area-clear"]);
  });

  it("選択肢のあるエンディング分岐と、その分岐先は含めない(エンディングの見返しで見る)", () => {
    const groups = buildStoryArchive([
      "ohzaNoMa-ending-choice",
      "ohzaNoMa-ending-castle",
      "ohzaNoMa-ending-journey",
      "ohzaNoMa-epilogue",
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].entries.map((e) => e.id)).toEqual(["ohzaNoMa-epilogue"]);
  });

  it("見返しに出るストーリーは、すべて実在するイベントで、表示名がある", () => {
    const everything = storyEvents.map((e) => e.id);
    const groups = buildStoryArchive(everything);
    const ids = groups.flatMap((g) => g.entries.map((e) => e.id));
    for (const id of ids) expect(storyEvents.some((e) => e.id === id)).toBe(true);
    for (const g of groups) for (const e of g.entries) expect(e.label.length).toBeGreaterThan(0);
    // 全部見たときの数が、見返せる総数と一致する
    expect(ids).toHaveLength(countReplayableStories());
  });

  it("全エリアの導入・エリアクリアは見返せる。種類の表示名は重複しない", () => {
    const groups = buildStoryArchive(storyEvents.map((e) => e.id));
    expect(groups.map((g) => g.areaId)).toEqual(areas.map((a) => a.id));
    for (const g of groups) {
      const phases = g.entries.map((e) => e.id.slice(g.areaId.length + 1));
      expect(phases).toContain("intro");
      expect(phases).toContain("area-clear");
    }
    const labels = Object.values(STORY_PHASE_LABELS);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
