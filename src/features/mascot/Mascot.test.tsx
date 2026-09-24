import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { areas } from "@/data/areas";
import { subBossAreaOf } from "@/data/bosses";
import { storyEvents } from "@/data/story/events";
import { BossPortrait } from "@/features/quiz/BossPortrait";
import { Mascot, MascotFace } from "./Mascot";

/** 置かれている画像を、テストごとに差し替える(実ファイルは Git に含まれないので、素材の有無に依存させない) */
const images = vi.hoisted(() => ({ present: new Map<string, string>() }));
vi.mock("@/assets/registry", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/assets/registry")>();
  return { ...original, findImage: (name: string) => images.present.get(name) };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("マスコット・ボスの画像表示", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (el: React.ReactElement) => act(() => root.render(el));
  const srcs = () => [...container.querySelectorAll("img")].map((i) => i.getAttribute("src"));

  beforeEach(() => {
    images.present.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("素材がなければ、これまでどおり絵文字の仮表示", () => {
    render(<Mascot />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".mascot-emoji")).not.toBeNull();
  });

  it("ベース画像があれば、それを出す。本来の姿(true)は専用の1枚", () => {
    images.present.set("mascot/base", "/base.webp");
    images.present.set("mascot/true", "/true.webp");
    render(<Mascot />);
    expect(srcs()).toEqual(["/base.webp"]);
    render(<Mascot form="true" />);
    expect(srcs()).toEqual(["/true.webp"]);
  });

  it("表情の画像があれば、ベースの代わりにそれを出す。なければベースのまま", () => {
    images.present.set("mascot/base", "/base.webp");
    images.present.set("mascot/sleepy", "/sleepy.webp");
    render(<Mascot expression="sleepy" />);
    expect(srcs()).toEqual(["/sleepy.webp"]);
    render(<Mascot expression="happy" />); // happy の画像は無い
    expect(srcs()).toEqual(["/base.webp"]);
  });

  it("MascotFace は、表情の画像があるときだけ出す(絵文字は出さない)", () => {
    render(<MascotFace expression="happy" />);
    expect(container.textContent).toBe("");
    expect(container.querySelector("img")).toBeNull();
    images.present.set("mascot/happy", "/happy.webp");
    render(<MascotFace expression="happy" size="large" />);
    expect(srcs()).toEqual(["/happy.webp"]);
    expect(container.querySelector(".mascot-large")).not.toBeNull();
  });

  it("小ボスの立ち絵は、エリアごとの1枚絵。ラスボスは取り憑かれた姿。素材がなければ何も出さない", () => {
    render(<BossPortrait type="subBoss" areaId="ohzaNoMa" />);
    expect(container.querySelector(".boss-portrait")).toBeNull();
    images.present.set("boss/subboss-ohzaNoMa", "/nijuveru.webp");
    images.present.set("boss/lastboss-possessed", "/king.webp");
    render(<BossPortrait type="subBoss" areaId="ohzaNoMa" />);
    expect(srcs()).toEqual(["/nijuveru.webp"]);
    render(<BossPortrait type="subBoss" areaId="kizunaNoMa" />); // このエリアの画像は無い
    expect(container.querySelector(".boss-portrait")).toBeNull();
    render(<BossPortrait type="lastBoss" areaId="ohzaNoMa" />);
    expect(srcs()).toEqual(["/king.webp"]);
  });
});

describe("小ボスの話者とエリアの対応", () => {
  it("小ボスのいる7エリアすべてで、ボス名からエリアを引ける", () => {
    const withBoss = areas.filter((a) => a.subBossName);
    expect(withBoss).toHaveLength(7);
    for (const area of withBoss) expect(subBossAreaOf(area.subBossName), area.id).toBe(area.id);
  });

  it("小ボス以外(コト・王様・ナレーション)は引けない", () => {
    for (const speaker of ["コト", "ヴェルバルト", "王(乱れに飲まれた姿)", undefined]) {
      expect(subBossAreaOf(speaker), String(speaker)).toBeUndefined();
    }
  });

  it("ストーリーの台詞に出てくる小ボスの名前は、すべて立ち絵の対応がある(名前の表記ゆれ検出)", () => {
    const bossNames = new Set(areas.map((a) => a.subBossName).filter(Boolean));
    const speakers = new Set(storyEvents.flatMap((e) => e.lines.map((l) => l.speaker)).filter(Boolean));
    for (const name of bossNames) expect(speakers.has(name), `${name} の台詞がある`).toBe(true);
    for (const speaker of speakers) {
      if (bossNames.has(speaker)) expect(subBossAreaOf(speaker), speaker).toBeDefined();
    }
  });
});
