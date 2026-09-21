import { describe, expect, it } from "vitest";
import { areas } from "./areas";
import { getEngineFlavor } from "./engineFlavor";
import type { EngineType, RubyText } from "./schema";

const plain = (text: RubyText) => text.map((s) => s.text).join("");

/** SPEC.md 5章「エンジン×エリアの世界観演出」の表(画面上の呼び名案) */
const specTable: [string, EngineType, string][] = [
  ["prologue", "choice", "ことだま使いの心得"],
  ["kotobaNoIchiba", "sorting", "棚卸しを手伝う"],
  ["sugatakaeNoKajiba", "assembly", "型を打つ"],
  ["namerakaNoTaki", "sorting", "水路を切り分ける"],
  ["namerakaNoTaki", "assembly", "流れをなめらかにする"],
  ["tsunagiNoHashi", "assembly", "橋板をかける"],
  ["tsunagiNoHashi", "choice", "番人の問い"],
  ["kizunaNoMa", "choice", "絆の糸をたどる"], // 文中タップは選択式の表示モード
  ["mikakeNoMa", "choice", "まやかしを見破る"],
  ["ohzaNoMa", "choice", "作法の間"],
];

describe("getEngineFlavor", () => {
  it.each(specTable)("%s × %s は仕様書の表どおり「%s」", (areaId, engine, expected) => {
    expect(plain(getEngineFlavor(areaId, engine)!.label)).toBe(expected);
  });

  it("全エリア・全エンジンの組み合わせで、何かしらの呼び名が返る", () => {
    const engines: EngineType[] = ["sorting", "assembly", "choice"];
    for (const area of areas) {
      for (const engine of engines) {
        expect(getEngineFlavor(area.id, engine), `${area.id}:${engine}`).toBeDefined();
      }
    }
  });

  it("ことばの市場の選択式問題(自立語・付属語など)も、棚卸しの呼び名で見せる", () => {
    expect(plain(getEngineFlavor("kotobaNoIchiba", "choice")!.label)).toBe("棚卸しを手伝う");
  });

  it("難しい漢字にはふりがなが付いている", () => {
    const label = getEngineFlavor("kotobaNoIchiba", "sorting")!.label;
    expect(label.find((s) => s.text === "棚卸")?.ruby).toBe("たなおろ");
  });

  it("存在しないエリアはundefined", () => {
    expect(getEngineFlavor("no-such-area", "choice")).toBeUndefined();
  });
});
