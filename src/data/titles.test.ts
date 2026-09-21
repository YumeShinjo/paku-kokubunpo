import { describe, expect, it } from "vitest";
import { getStoryEvent } from "./story/events";
import { endingChoiceStoryId } from "@/features/story/storyIds";
import { ENDING_CHOICE_EVENT_ID, endingTitles, getEndingTitle } from "./titles";

describe("称号(二つ名)", () => {
  it("選択肢A(城に戻る)は「言葉を結びし者」、選択肢B(旅を続ける)は「風のことだま使い」", () => {
    expect(getEndingTitle({ [ENDING_CHOICE_EVENT_ID]: "castle" })?.plain).toBe("言葉を結びし者");
    expect(getEndingTitle({ [ENDING_CHOICE_EVENT_ID]: "journey" })?.plain).toBe("風のことだま使い");
  });

  it("まだ選んでいない/知らない選択肢のときは称号なし", () => {
    expect(getEndingTitle({})).toBeUndefined();
    expect(getEndingTitle({ [ENDING_CHOICE_EVENT_ID]: "unknown" })).toBeUndefined();
    expect(getEndingTitle({ "other-event": "castle" })).toBeUndefined();
  });

  it("エンディング分岐イベントのidと選択肢のキーが、称号の定義と食い違っていない", () => {
    expect(ENDING_CHOICE_EVENT_ID).toBe(endingChoiceStoryId("ohzaNoMa"));
    const keys = getStoryEvent(ENDING_CHOICE_EVENT_ID)!.choice!.options.map((o) => o.key);
    expect(keys.sort()).toEqual(Object.keys(endingTitles).sort());
  });

  it("ふりがな付きの称号名を連結すると、ふりがななしの称号名と一致する", () => {
    for (const title of Object.values(endingTitles)) {
      expect(title.name.map((s) => s.text).join("")).toBe(title.plain);
    }
  });
});
