import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { howToCards, howToFooter } from "@/data/howTo";
import { rb } from "@/data/ruby";
import { useNavigationStore } from "@/app/store/navigationStore";
import { HowToScreen } from "./HowToScreen";
import { SettingsScreen } from "./SettingsScreen";
import { TitleScreen } from "./TitleScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};

const SPOILERS = ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女", "おうさま", "黒幕"];
/** ふりがな表記 "漢字[よみ]" を、漢字だけにする */
const plain = (text: string) => rb(text).map((seg) => seg.text).join("");

describe("あそびかた画面", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useNavigationStore.setState({ screen: { name: "title" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("カードの順番は「はじめる→問題を解く→パクっと→言の葉→ぶんぽう図鑑→苦手問題の練習→言の葉の森」", () => {
    expect(howToCards.map((c) => c.id)).toEqual(["start", "quiz", "paku", "leaf", "book", "star", "forest"]);
  });

  it("1枚の説明は、1〜2文(「。」で数える)", () => {
    for (const card of howToCards) {
      const sentences = plain(card.body).split("。").filter((s) => s.trim() !== "");
      expect(sentences.length, card.id).toBeGreaterThanOrEqual(1);
      expect(sentences.length, card.id).toBeLessThanOrEqual(2);
    }
  });

  it("ネタバレ(ラスボス・王様・ヴェルバルト・コレット・王女)を書いていない(本文・読み上げ)", () => {
    act(() => root.render(<HowToScreen />));
    const text = container.textContent ?? "";
    const all = [text, ...howToCards.map((c) => `${c.title}${c.body}`), howToFooter].join("\n");
    for (const word of SPOILERS) expect(all, word).not.toContain(word);
    for (const el of container.querySelectorAll("[aria-label],[alt],[title]")) {
      const label = `${el.getAttribute("aria-label") ?? ""}${el.getAttribute("alt") ?? ""}${el.getAttribute("title") ?? ""}`;
      for (const word of SPOILERS) expect(label, word).not.toContain(word);
    }
  });

  it("画面にカードが全部出て、ふりがながつく。「もどる」でホームへ戻る", () => {
    act(() => root.render(<HowToScreen />));
    expect(container.querySelectorAll(".howto-card")).toHaveLength(howToCards.length);
    expect(container.querySelector("h2")?.textContent).toBe("あそびかた");
    expect(container.querySelector(".howto-card ruby")).not.toBeNull();
    const back = container.querySelector<HTMLButtonElement>(".back-button")!;
    act(() => back.click());
    expect(useNavigationStore.getState().screen).toEqual({ name: "title" });
  });

  it("ホーム画面の右上の「あそびかた」ボタンと、設定の「あそびかたを 見る」から開ける", () => {
    act(() => root.render(<TitleScreen />));
    const entry = container.querySelector<HTMLButtonElement>("button.title-howto")!;
    expect(entry.getAttribute("aria-label")).toBe("あそびかた");
    act(() => entry.click());
    expect(useNavigationStore.getState().screen).toEqual({ name: "howto" });

    useNavigationStore.setState({ screen: { name: "settings" } });
    act(() => root.render(<SettingsScreen />));
    const settingsButton = [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("あそびかたを"))!;
    act(() => settingsButton.click());
    expect(useNavigationStore.getState().screen).toEqual({ name: "howto" });
  });
});
