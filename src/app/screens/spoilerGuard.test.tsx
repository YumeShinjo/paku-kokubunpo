import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { announcements } from "@/data/announcements";
import { areas } from "@/data/areas";
import { assetCredits, buildCreditGroups } from "@/data/credits";
import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";
import { getStagesForArea } from "@/data/stages";
import { AreaSelectScreen } from "./AreaSelectScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * ネタバレ対策: 王座の間では、宰相を倒したあとの会話で、はじめて「ラスボスは王様(ヴェルバルト)」と分かる。
 * それまでに見える、宰相より前の画面(エリア選択・お知らせ・クレジット)に、ラスボスや王様の存在を出さない。
 * (ストーリーの台詞そのものは、ここでは見ない)
 */
const SPOILERS = ["ラスボス", "王様", "ヴェルバルト", "おうさま", "黒幕"];

describe("ネタバレ対策(ラスボス・王様の表記)", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useStoryStore.setState({ seenStoryIds: [], choices: {} });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
  });

  it("エリア選択: 王座の間まで開いていても(宰相の前)、カードにラスボス・王様の文字が出ない", () => {
    const beforeThrone = areas.filter((a) => a.implemented && a.id !== "ohzaNoMa").flatMap((a) => getStagesForArea(a.id).map((s) => s.id));
    useProgressStore.setState({ clearedStageIds: beforeThrone });
    act(() => root.render(<AreaSelectScreen />));
    const text = container.textContent ?? "";
    expect(text).toContain("王座の間");
    for (const word of SPOILERS) expect(text, word).not.toContain(word);
  });

  it("お知らせ: どの項目にも、ラスボス・王様の文字がない", () => {
    const text = announcements.flatMap((a) => [a.title, ...a.body]).join("\n");
    for (const word of SPOILERS) expect(text, word).not.toContain(word);
  });

  it("ゲーム内クレジット(いつでも見られる): ラスボス・王様の文字がない(画像は素材名を出さない作りになっている)", () => {
    const text = buildCreditGroups(assetCredits)
      .flatMap((g) => g.lines)
      .join("\n");
    for (const word of SPOILERS) expect(text, word).not.toContain(word);
  });
});
