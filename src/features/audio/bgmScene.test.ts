import { describe, expect, it } from "vitest";
import type { Screen } from "@/app/store/navigationStore";
import { sceneForScreen } from "./bgmScene";

const story = (eventId: string): Screen => ({
  name: "story",
  eventId,
  next: { name: "title" },
});

describe("sceneForScreen", () => {
  it("タイトル・設定・図鑑・通常のクレジットは title", () => {
    for (const screen of [
      { name: "title" },
      { name: "settings" },
      { name: "zukan" },
      { name: "credits", next: { name: "title" } },
    ] as Screen[]) {
      expect(sceneForScreen(screen)).toBe("title");
    }
  });

  it("エリア選択・ステージ選択は explore、自由練習と通常ステージは stage", () => {
    expect(sceneForScreen({ name: "areaSelect" })).toBe("explore");
    expect(sceneForScreen({ name: "stageSelect", areaId: "prologue" })).toBe("explore");
    expect(sceneForScreen({ name: "freePractice", unitId: "x" })).toBe("stage");
    expect(sceneForScreen({ name: "stage", areaId: "prologue", stageId: "prologue-stage1" })).toBe("stage");
  });

  it("小ボス戦は subBoss、ラスボス戦は lastBoss", () => {
    expect(sceneForScreen({ name: "stage", areaId: "ohzaNoMa", stageId: "ohzaNoMa-subboss" })).toBe("subBoss");
    expect(sceneForScreen({ name: "stage", areaId: "ohzaNoMa", stageId: "ohzaNoMa-lastboss" })).toBe("lastBoss");
  });

  it("ストーリーは既定で explore、真相究明は truth、王座の間のラスボス撃破後〜締めは ending", () => {
    expect(sceneForScreen(story("prologue-intro"))).toBe("explore");
    expect(sceneForScreen(story("kotobaNoIchiba-area-clear"))).toBe("explore");
    expect(sceneForScreen(story("ohzaNoMa-subboss-clear"))).toBe("explore");
    expect(sceneForScreen(story("ohzaNoMa-truth"))).toBe("truth");
    expect(sceneForScreen(story("ohzaNoMa-lastboss-intro"))).toBe("explore");
    for (const id of [
      "ohzaNoMa-lastboss-clear",
      "ohzaNoMa-ending-choice",
      "ohzaNoMa-ending-castle",
      "ohzaNoMa-ending-journey",
      "ohzaNoMa-epilogue",
      "ohzaNoMa-area-clear",
    ]) {
      expect(sceneForScreen(story(id)), id).toBe("ending");
    }
  });

  it("エンディング後の結果画面とクレジットは ending", () => {
    expect(sceneForScreen({ name: "endingResult", areaId: "ohzaNoMa", next: { name: "title" } })).toBe("ending");
    expect(
      sceneForScreen({ name: "credits", ending: true, areaId: "ohzaNoMa", next: { name: "title" } }),
    ).toBe("ending");
  });
});
