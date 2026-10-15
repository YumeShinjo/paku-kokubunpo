import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getStagesForArea } from "@/data/stages";
import { getAllIdiomQuestions } from "@/data/kotowaza";
import { KOTONOHA_ABOUT } from "@/data/kotonohaAbout";
import { kotonohaTitle } from "@/data/titles";
import { howToCards } from "@/data/howTo";
import { rb } from "@/data/ruby";
import { hasAllLeaves, useKotonohaStore } from "@/app/store/kotonohaStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { KotonohaScreen } from "./KotonohaScreen";
import { KotonohaPlayScreen } from "./KotonohaPlayScreen";
import { KotonohaTab } from "@/features/zukan/KotonohaTab";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
window.scrollTo = () => {};

const audio = vi.hoisted(() => ({ playSe: vi.fn(), duckBgm: vi.fn() }));
vi.mock("@/lib/audio", async () => {
  const actual = await vi.importActual<typeof import("@/lib/audio")>("@/lib/audio");
  return { ...actual, playSe: audio.playSe, duckBgm: audio.duckBgm };
});

const plain = (text: string) => rb(text).map((s) => s.text).join("");
const allIds = () => getAllIdiomQuestions().map((q) => q.id);
const withoutRt = (el: Element) => {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("rt").forEach((n) => n.remove());
  return clone.textContent ?? "";
};

describe("言の葉の森: 入口の説明・80まいそろったときの称号", () => {
  let container: HTMLDivElement;
  let root: Root;
  const q = <T extends Element>(selector: string) => container.querySelector<T>(selector);
  const click = (el: Element | null) => act(() => (el as HTMLElement).click());

  beforeEach(() => {
    localStorage.clear();
    audio.playSe.mockClear();
    useProgressStore.setState({ clearedStageIds: getStagesForArea("prologue").map((s) => s.id) });
    useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: true, seenEntryFirst: true, shownCompletions: [], lastEntryScene: undefined });
    useNavigationStore.setState({ screen: { name: "kotonoha" } });
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

  it("入口に、説明がいつでも出る(初回の会話の前後・2回目以降のどちらでも)。ネタバレなし", () => {
    const expected = "言の葉の森は、ことわざ・故事成語を あつめる ミニゲームだよ。1ラウンド10問。本編のとちゅうでも、いつでも あそべるよ。80まい ぜんぶ そろえると、ユライから しょうごうが もらえるよ!";
    expect(plain(KOTONOHA_ABOUT)).toBe(expected);
    act(() => root.render(<KotonohaScreen />));
    expect(withoutRt(q(".kotonoha-about")!)).toBe(expected);
    // 初回(entry_first の会話の途中)でも、説明が読める
    act(() => root.unmount());
    root = createRoot(container);
    useKotonohaStore.setState({ seenEntryFirst: false, collectedIds: [], missedIds: [] });
    act(() => root.render(<KotonohaScreen />));
    expect(withoutRt(q(".kotonoha-about")!)).toBe(expected);
    for (const word of ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"]) expect(expected, word).not.toContain(word);
  });

  it("称号の名前(仮): 王座の間の称号と同じ形。80まいぜんぶ集めたかは、集めた葉から導く", () => {
    expect(kotonohaTitle.plain).toBe("言の葉をひろいし者");
    expect(plain(kotonohaTitle.name.map((s) => (s.ruby ? `${s.text}[${s.ruby}]` : s.text)).join(""))).toBe("言の葉をひろいし者");
    expect(hasAllLeaves(allIds())).toBe(true);
    expect(hasAllLeaves(allIds().slice(1))).toBe(false);
    expect(allIds()).toHaveLength(80);
  });

  it("ことだまの書の「ことのは」: 80まいそろったときだけ、称号が出る", () => {
    useKotonohaStore.setState({ collectedIds: allIds().slice(1) });
    act(() => root.render(<KotonohaTab />));
    expect(q(".kotonoha-tab-title-earned")).toBeNull();
    act(() => useKotonohaStore.setState({ collectedIds: allIds() }));
    expect(q(".kotonoha-tab-title-earned")?.textContent).toContain("ひろいし");
    expect(q(".kotonoha-tab-title-earned .title-badge")?.getAttribute("aria-label")).toBe("称号 言の葉をひろいし者");
  });

  it("最後の1枚を集めて80/80になった瞬間に、ユライから称号を授与する(称号の授与の効果音も鳴る)。その前の1枚では、授与しない", () => {
    const all = getAllIdiomQuestions();
    const missing = all[0];
    useKotonohaStore.setState({ collectedIds: all.slice(1).map((x) => x.id), missedIds: [missing.id] });
    act(() => root.render(<KotonohaPlayScreen scope="all" />));
    click(q(".scene-next"));
    for (let i = 0; i < 10; i++) {
      // いま出ている問題を、文から引いて、正しい選択肢を押す
      const sentence = withoutRt(q(".kotonoha-sentence")!);
      const question = all.find((x) => x.sentence.map((s) => s.text).join("").replaceAll("___", "") === sentence)!; // 空欄(___)は、文字ではなく四角で出る
      expect(question, sentence).toBeDefined();
      const correctText = question.choices.find((c) => c.id === question.correctChoiceId)!.text.map((s) => s.text).join("");
      const button = [...container.querySelectorAll<HTMLButtonElement>(".kotonoha-choices button")].find((b) => withoutRt(b) === correctText)!;
      click(button);
      click(q(".kotonoha-next"));
    }
    expect(useKotonohaStore.getState().collectedIds).toHaveLength(80);
    const award = q(".kotonoha-title-award");
    expect(award).not.toBeNull();
    expect(award!.textContent).toContain("ユライから しょうごう(二つ名)を もらったよ!");
    expect(award!.querySelector(".title-badge")?.getAttribute("aria-label")).toBe("称号 言の葉をひろいし者");
    expect(audio.playSe).toHaveBeenCalledWith("subBossClear");
    // 授与は、「ぜんぶ そろった」の会話(complete_all)と一緒に、1回だけ
    click(q(".scene-next"));
    expect(q(".kotonoha-title-award")).toBeNull();
  });

  it("「あそびかた」の言の葉の森のカードに、称号の1文がある", () => {
    const forest = howToCards.find((c) => c.id === "forest")!;
    expect(plain(forest.body)).toContain("80まい ぜんぶ そろえると、ユライから しょうごうが もらえるよ!");
  });
});
