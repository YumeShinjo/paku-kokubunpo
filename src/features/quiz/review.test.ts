import { beforeEach, describe, expect, it } from "vitest";
import { useMascotStore } from "@/app/store/mascotStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { overcomeAccessoryId, recordReviewResult } from "./review";

describe("復習(星)と克服ボーナス", () => {
  beforeEach(() => {
    useReviewStore.setState({ starredQuestionIds: [] });
    useMascotStore.setState({ growthStage: 0, bonusAccessoryIds: [] });
  });

  it("不正解だと星がつく(すでについていれば重ならない)", () => {
    expect(recordReviewResult("q1", false)).toEqual({ overcame: false, bonusGained: false });
    recordReviewResult("q1", false);
    expect(useReviewStore.getState().starredQuestionIds).toEqual(["q1"]);
  });

  it("星のついていた問題を正解すると、星が外れ、アクセサリーがボーナスで1つ増える", () => {
    recordReviewResult("q1", false);
    const outcome = recordReviewResult("q1", true);
    expect(outcome).toEqual({ overcame: true, bonusGained: true });
    expect(useReviewStore.getState().starredQuestionIds).toEqual([]);
    expect(useMascotStore.getState().bonusAccessoryIds).toEqual([overcomeAccessoryId("q1")]);
  });

  it("星のない問題を正解しても、ボーナスは増えない", () => {
    expect(recordReviewResult("q1", true)).toEqual({ overcame: false, bonusGained: false });
    expect(useMascotStore.getState().bonusAccessoryIds).toEqual([]);
  });

  it("同じ問題を何度間違えて克服しても、ボーナスは1つだけ(稼ぎ放題にならない)", () => {
    recordReviewResult("q1", false);
    recordReviewResult("q1", true);
    recordReviewResult("q1", false);
    const second = recordReviewResult("q1", true);
    expect(second).toEqual({ overcame: true, bonusGained: false });
    expect(useMascotStore.getState().bonusAccessoryIds).toHaveLength(1);
  });

  it("問題ごとにボーナスが増える", () => {
    for (const id of ["q1", "q2", "q3"]) {
      recordReviewResult(id, false);
      recordReviewResult(id, true);
    }
    expect(useMascotStore.getState().bonusAccessoryIds).toHaveLength(3);
  });

  it("自分で星をつけたり外したりできる(お気に入り登録)。星をつけた問題も、正解すれば克服になる", () => {
    useReviewStore.getState().toggleStar("q9");
    expect(useReviewStore.getState().starredQuestionIds).toEqual(["q9"]);
    useReviewStore.getState().toggleStar("q9");
    expect(useReviewStore.getState().starredQuestionIds).toEqual([]);

    useReviewStore.getState().toggleStar("q9");
    expect(recordReviewResult("q9", true)).toEqual({ overcame: true, bonusGained: true });
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
