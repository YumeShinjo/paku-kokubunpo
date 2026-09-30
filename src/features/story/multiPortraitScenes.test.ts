import { describe, expect, it } from "vitest";
import { storyEvents } from "@/data/story/events";
import { subBossAreaOf } from "@/data/bosses";
import { isKingSpeaker, keyOfMascot, keyOfSpeaker } from "@/data/story/characterFacing";
import { MULTI_SCALE_ADJUST } from "@/data/story/portraitScale";

/** 立ち絵が2人以上出る場面(話者が王様・小ボスで、同時にマスコットも出る行)を、全イベントから集める */
function multiPortraitCombos(): string[] {
  const combos = new Set<string>();
  for (const event of storyEvents) {
    for (const line of event.lines) {
      const speakerIsPortrait = isKingSpeaker(line.speaker) || subBossAreaOf(line.speaker) !== undefined;
      if (!speakerIsPortrait || !line.showMascot) continue;
      combos.add(`${keyOfSpeaker(line.speaker)}+${keyOfMascot(line.mascotForm)}`);
    }
  }
  return [...combos].sort();
}

describe("複数人の立ち絵の場面(倍率の補正の対象)", () => {
  it("複数人が並ぶのは、王様とコレットの組み合わせだけ(ほかの組み合わせが増えたら、倍率の補正を見直す)", () => {
    expect(multiPortraitCombos()).toEqual(["ヴェルバルト+コレット"]);
  });

  it("補正を掛けているのは、王様とコレットだけ", () => {
    expect(Object.keys(MULTI_SCALE_ADJUST).sort()).toEqual(["コレット", "ヴェルバルト"].sort());
  });
});
