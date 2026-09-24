import { beforeEach, describe, expect, it } from "vitest";
import { useMascotStore } from "@/app/store/mascotStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { recordReviewResult } from "./review";

describe("復習(星)と克服", () => {
  beforeEach(() => {
    useReviewStore.setState({ starredQuestionIds: [] });
    useMascotStore.setState({ growthStage: 0 });
  });

  it("不正解だと星がつく(すでについていれば重ならない)", () => {
    expect(recordReviewResult("q1", false)).toEqual({ overcame: false });
    recordReviewResult("q1", false);
    expect(useReviewStore.getState().starredQuestionIds).toEqual(["q1"]);
  });

  it("星のついていた問題を正解すると、星が外れて克服になる(呼び出し側が克服ボーナス音を鳴らす)", () => {
    recordReviewResult("q1", false);
    expect(recordReviewResult("q1", true)).toEqual({ overcame: true });
    expect(useReviewStore.getState().starredQuestionIds).toEqual([]);
  });

  it("星のない問題を正解しても、克服にはならない", () => {
    expect(recordReviewResult("q1", true)).toEqual({ overcame: false });
  });

  it("克服のたびに克服になる(何度でも音が鳴る)が、マスコットのアクセサリーは増えない", () => {
    const before = useMascotStore.getState();
    for (let i = 0; i < 3; i++) {
      recordReviewResult("q1", false);
      expect(recordReviewResult("q1", true)).toEqual({ overcame: true });
    }
    for (const id of ["q2", "q3"]) {
      recordReviewResult(id, false);
      recordReviewResult(id, true);
    }
    // 成長(アクセサリー)は、エリアクリアのときだけ進む。克服では動かない
    expect(useMascotStore.getState().growthStage).toBe(before.growthStage);
    expect(useMascotStore.getState()).not.toHaveProperty("bonusAccessoryIds");
  });

  it("自分で星をつけたり外したりできる(お気に入り登録)。星をつけた問題も、正解すれば克服になる", () => {
    useReviewStore.getState().toggleStar("q9");
    expect(useReviewStore.getState().starredQuestionIds).toEqual(["q9"]);
    useReviewStore.getState().toggleStar("q9");
    expect(useReviewStore.getState().starredQuestionIds).toEqual([]);

    useReviewStore.getState().toggleStar("q9");
    expect(recordReviewResult("q9", true)).toEqual({ overcame: true });
  });
});

describe("ミュート(固定アイコンと設定画面で同じ設定を使う)", () => {
  it("setMuted で切り替わる", () => {
    useSettingsStore.getState().setMuted(true);
    expect(useSettingsStore.getState().muted).toBe(true);
    useSettingsStore.getState().setMuted(false);
    expect(useSettingsStore.getState().muted).toBe(false);
  });
});
