import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const audioSpies = vi.hoisted(() => ({ playSe: vi.fn(), duckBgm: vi.fn() }));
vi.mock("@/lib/audio", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/audio")>();
  return { ...actual, playSe: audioSpies.playSe, duckBgm: audioSpies.duckBgm };
});

import { KotonohaPlayScreen } from "@/app/screens/KotonohaPlayScreen";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { useProgressStore } from "@/app/store/progressStore";
import { BGM_FALLBACK, BGM_SCENES, findAudio, findBgm, seAssetName } from "@/assets/registry";
import { assetCredits, buildCreditGroups } from "@/data/credits";
import { getStagesForArea } from "@/data/stages";
import { sceneForScreen } from "@/features/audio/bgmScene";
import { SE_KINDS, seDurationMs } from "@/lib/audio";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("言の葉の森のBGM", () => {
  it("言の葉の森(入口・出題・解説・結果)は、専用の場面(kotonoha)。図鑑は、変えない", () => {
    expect([...BGM_SCENES]).toContain("kotonoha");
    expect(sceneForScreen({ name: "kotonoha" })).toBe("kotonoha");
    expect(sceneForScreen({ name: "kotonohaPlay", scope: "all" })).toBe("kotonoha");
    expect(sceneForScreen({ name: "zukan" })).toBe("title");
    expect(sceneForScreen({ name: "zukan", tab: "kotonoha", backTo: "kotonoha" })).toBe("title");
    // ほかの画面は、これまでどおり
    expect(sceneForScreen({ name: "areaSelect" })).toBe("explore");
    expect(sceneForScreen({ name: "freePractice", unitId: "x" })).toBe("stage");
  });

  it("専用の曲がないとき(未配置の環境)は、探索 → タイトルの曲で代わりにする", () => {
    expect(BGM_FALLBACK.kotonoha).toEqual(["explore", "title"]);
  });

  it("曲が置かれていれば、導入曲なしの1曲(曲全体をループ)として、場面から引ける", () => {
    if (!findAudio("bgm/kotonoha")) return; // 素材は git の管理外。置かれていない環境(CIなど)では確かめない
    const track = findBgm("kotonoha");
    expect(track?.loop).toBeTruthy();
    expect(track?.intro).toBeUndefined();
  });

  it("BGMの再生・止める・再開は、これまでの関数(playBgm と、止める・再開する)だけを使う。画面側に、独自の再生処理や定期処理がない", () => {
    const files = ["src/features/audio/useBgm.ts", "src/features/audio/bgmScene.ts", "src/features/kotonoha/SceneBubbles.tsx"];
    for (const file of files) {
      const source = readFileSync(file, "utf-8");
      expect(source, file).not.toMatch(/new Audio\(|setInterval|requestAnimationFrame|createMediaElementSource/);
    }
  });
});

describe("ラウンド終了の音(roundEnd)", () => {
  it("効果音の種類に roundEnd があり、ファイル名は se/roundEnd。置かれていれば、読み込める", () => {
    expect(SE_KINDS).toContain("roundEnd");
    expect(seAssetName("roundEnd")).toBe("se/roundEnd");
    if (!findAudio("se/roundEnd")) return;
    expect(findAudio("se/roundEnd")).toBeTruthy();
  });

  it("自由練習・苦手練習の終わりは roundEnd(ステージクリア音の clear は使わない)。BGMは、鳴っている間だけ下げる(既存と同じ)", () => {
    for (const file of ["src/app/screens/FreePracticeScreen.tsx", "src/app/screens/ReviewPracticeScreen.tsx"]) {
      const source = readFileSync(file, "utf-8");
      expect(source, file).toContain('playSe("roundEnd")');
      expect(source, file).toContain('duckBgm(seDurationMs("roundEnd"))');
      expect(source, file).not.toContain('playSe("clear")');
    }
  });

  it("本編のステージクリア・ボス撃破の音は、変えない(clear / subBossClear / lastBossClear のまま)", () => {
    const source = readFileSync("src/app/screens/StageScreen.tsx", "utf-8");
    expect(source).toContain('"clear"');
    expect(source).toContain('"lastBossClear"');
    expect(source).toContain('"subBossClear"');
    expect(source).not.toContain("roundEnd");
  });

  it("roundEnd は、ステージクリア音と同じく、長めの効果音(次の演出を待たせる)で、効果音の長さを持つ", () => {
    expect(seDurationMs("roundEnd")).toBeGreaterThan(0);
  });

  describe("言の葉の森のラウンド終了", () => {
    let container: HTMLDivElement;
    let root: Root;
    const q = <T extends Element>(selector: string) => container.querySelector<T>(selector);
    const click = (el: Element | null) => act(() => (el as HTMLElement).click());

    beforeEach(() => {
      localStorage.clear();
      audioSpies.playSe.mockClear();
      audioSpies.duckBgm.mockClear();
      useProgressStore.setState({ clearedStageIds: getStagesForArea("prologue").map((s) => s.id) });
      useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: true, seenEntryFirst: true, shownCompletions: [], lastEntryScene: undefined });
      container = document.createElement("div");
      document.body.appendChild(container);
      root = createRoot(container);
    });

    afterEach(() => {
      act(() => root.unmount());
      container.remove();
      useProgressStore.setState({ clearedStageIds: [] });
      useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: false, seenEntryFirst: false, shownCompletions: [], lastEntryScene: undefined });
    });

    it("10問目のあと、結果が出るときに、roundEnd を1回だけ鳴らし、BGMを下げる(途中の問題では鳴らさない)", () => {
      act(() => root.render(<KotonohaPlayScreen scope="all" />));
      click(q(".scene-next"));
      for (let i = 0; i < 10; i++) {
        click(q(".kotonoha-choices button"));
        expect(audioSpies.playSe).not.toHaveBeenCalledWith("roundEnd");
        click(q(".kotonoha-next"));
      }
      expect(q(".kotonoha-result")).not.toBeNull();
      const roundEnd = audioSpies.playSe.mock.calls.filter(([kind]) => kind === "roundEnd");
      expect(roundEnd).toHaveLength(1);
      expect(audioSpies.playSe).not.toHaveBeenCalledWith("clear");
      expect(audioSpies.duckBgm).toHaveBeenCalledTimes(1);
      expect(audioSpies.duckBgm).toHaveBeenCalledWith(seDurationMs("roundEnd"));
    });
  });
});

describe("クレジット(ゲーム内の表示)", () => {
  const groups = buildCreditGroups(assetCredits);
  const lines = (kind: string) => groups.find((g) => g.kind === kind)!.lines;

  it("BGM: 作曲者名と入手元が出る(Hareno - YouTube)。SE: 「Springin' Sound Stock」が、1回だけ出る", () => {
    expect(lines("BGM")).toContain("Hareno - YouTube");
    expect(lines("SE").filter((l) => l === "Springin' Sound Stock")).toHaveLength(1);
    expect(lines("SE").some((l) => l.startsWith("Springin") && l !== "Springin' Sound Stock")).toBe(false);
  });

  it("素材管理表に、出典・URL・作者・利用条件・加工の内容が控えてある", () => {
    const forest = assetCredits.find((c) => c.name.startsWith("千年の内緒話"))!;
    expect(forest.name).toContain("A secret whispered for a millennium");
    expect(forest.name).toContain("https://youtu.be/CGjkJKXqgHY");
    expect(forest.source).toBe("YouTube / Hareno");
    expect(forest.license).toContain("2026-10-02に確認");
    for (const word of ["クレジット表記", "教育での配信: 可", "ゲームへの利用: 可", "改変: 可"]) expect(forest.license, word).toContain(word);
    expect(forest.usage).toContain("44.1kHz・ステレオ・128kbps");

    const jingle = assetCredits.find((c) => c.name.startsWith("ジングル21"))!;
    expect(jingle.name).toContain("jingle_21.mp3");
    expect(jingle.name).toContain("https://www.springin.org/sound-stock/subcategory/jingle/");
    expect(jingle.name).toContain("https://www.springin.org/sound-stock/guideline/");
    expect(jingle.source).toBe("Springin' Sound Stock");
    expect(jingle.license).toContain("2026-10-02に確認");
    expect(jingle.license).toContain("目立たない配置");
    expect(jingle.usage).toContain("44.1kHz・128kbps");
    expect(jingle.usage).toContain("0.4秒のフェード");
  });

  it("ライセンス確認表(docs/ASSET_LICENSE_CHECKLIST.md)にも、同じ内容がある", () => {
    const md = readFileSync("docs/ASSET_LICENSE_CHECKLIST.md", "utf-8");
    for (const word of ["kotonoha.mp3", "千年の内緒話", "https://youtu.be/CGjkJKXqgHY", "roundEnd.mp3", "jingle_21.mp3", "https://www.springin.org/sound-stock/guideline/", "2026-10-02", "ハッシュ付き"]) {
      expect(md, word).toContain(word);
    }
  });
});
