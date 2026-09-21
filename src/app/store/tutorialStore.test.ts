import { beforeEach, describe, expect, it } from "vitest";
import { useTutorialStore } from "./tutorialStore";

describe("tutorialStore", () => {
  beforeEach(() => useTutorialStore.setState({ seenGuides: [] }));

  it("既読にすると記録され、同じキーを重ねて記録しない", () => {
    useTutorialStore.getState().markSeen("sorting");
    useTutorialStore.getState().markSeen("sorting");
    useTutorialStore.getState().markSeen("choice");
    expect(useTutorialStore.getState().seenGuides).toEqual(["sorting", "choice"]);
  });

  it("resetGuides で全ガイドがもう一度出る状態に戻る", () => {
    useTutorialStore.getState().markSeen("assembly");
    useTutorialStore.getState().resetGuides();
    expect(useTutorialStore.getState().seenGuides).toEqual([]);
  });
});
