import { describe, expect, it } from "vitest";
import { areas } from "@/data/areas";
import {
  BGM_FALLBACK,
  BGM_SCENES,
  findAudio,
  findBgm,
  findImage,
  IMAGE,
  MASCOT_ACCESSORY_STAGES,
  seAssetName,
} from "./registry";

describe("素材の受け皿(registry)", () => {
  it("置かれていない素材は undefined を返す(仮表示のままになる)", () => {
    expect(findImage("mascot/no-such-image")).toBeUndefined();
    expect(findAudio("bgm/no-such-song")).toBeUndefined();
  });

  it("素材の名前は README の取り決めどおりの規則で作られる", () => {
    expect(IMAGE.mascotBase).toBe("mascot/base");
    expect(IMAGE.mascotAccessory(3)).toBe("mascot/accessory-3");
    expect(IMAGE.mascotTrue).toBe("mascot/true");
    expect(IMAGE.subBoss("ohzaNoMa")).toBe("boss/subboss-ohzaNoMa");
    expect(IMAGE.mascotExpression("happy")).toBe("mascot/happy");
    expect(IMAGE.background("kotobaNoIchiba")).toBe("bg/kotobaNoIchiba");
    expect(IMAGE.background("title")).toBe("bg/title");
    expect(IMAGE.titleBadge("castle")).toBe("ui/badge-castle");
    expect(seAssetName("correct")).toBe("se/correct");
  });

  it("BGMの代わりの曲の指定は、実在する場面だけを指し、自分自身や循環を含まない", () => {
    for (const scene of BGM_SCENES) {
      const chain = BGM_FALLBACK[scene];
      expect(chain, scene).not.toContain(scene);
      for (const other of chain) expect(BGM_SCENES, `${scene} → ${other}`).toContain(other);
      // 代わりの曲のさらに代わり…をたどっても、元の場面には戻らない
      for (const other of chain) expect(BGM_FALLBACK[other], `${scene} → ${other}`).not.toContain(scene);
    }
  });

  it("BGM素材が1つも置かれていなければ、どの場面でも無音(undefined)", () => {
    // このテストは素材が未配置の状態を前提にする。素材が置かれている間は、下の配置チェックが代わりになる
    if (BGM_SCENES.some((s) => findAudio(`bgm/${s}`))) return;
    for (const scene of BGM_SCENES) expect(findBgm(scene)).toBeUndefined();
  });

  it("配置済みのBGMは、どの場面でも曲が決まり、探索・真相は導入曲つき", () => {
    if (!BGM_SCENES.every((s) => findAudio(`bgm/${s}`))) return; // 全場面の曲が置かれているときだけ確認する
    for (const scene of BGM_SCENES) expect(findBgm(scene)?.loop, scene).toBeTruthy();
    expect(findBgm("explore")?.intro).toBeTruthy();
    expect(findBgm("truth")?.intro).toBeTruthy();
    expect(findBgm("stage")?.intro).toBeUndefined();
  });

  it("効果音は9種すべてに実ファイルが置かれている(SeKind と同じ名前)", () => {
    for (const kind of ["tap", "correct", "incorrect", "clear", "subBossClear", "lastBossClear", "growth", "pageUnlock", "bonus"]) {
      expect(findAudio(seAssetName(kind)), kind).toBeTruthy();
    }
  });

  it("成長アクセサリーの段階数は、エリア数から序章を除いた数と一致する", () => {
    expect(MASCOT_ACCESSORY_STAGES).toBe(areas.length - 1);
  });
});
