import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { ZukanScreen } from "./ZukanScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("ことだまの書: 初回の使い方ガイド", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useTutorialStore.setState({ seenGuides: [] });
    useNavigationStore.setState({ screen: { name: "zukan" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<ZukanScreen />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("初めて開いたときは、使い方のガイドが出る", () => {
    expect(container.querySelector(".engine-guide")).not.toBeNull();
    expect(container.querySelector(".engine-guide-title")?.textContent).toContain("ことだまの書");
  });

  it("「わかった!」で閉じて既読になり、次に開いたときは出ない", () => {
    act(() => container.querySelector<HTMLButtonElement>(".engine-guide button")!.click());
    expect(container.querySelector(".engine-guide")).toBeNull();
    expect(useTutorialStore.getState().seenGuides).toContain("zukan");
    act(() => root.render(<ZukanScreen key="again" />));
    expect(container.querySelector(".engine-guide")).toBeNull();
  });

  it("設定の「操作の説明をもう一度見る」(既読のリセット)で、また出る", () => {
    useTutorialStore.getState().markSeen("zukan");
    act(() => root.render(<ZukanScreen key="seen" />));
    expect(container.querySelector(".engine-guide")).toBeNull();
    act(() => useTutorialStore.getState().resetGuides());
    act(() => root.render(<ZukanScreen key="reset" />));
    expect(container.querySelector(".engine-guide")).not.toBeNull();
  });
});

describe("ことだまの書: 苦手かもしれない単元の注意喚起と、正答率の位置", () => {
  it("正答率が低い単元があると、いちばん上に「にがてかも?」が出て、その単元の練習に入れる", async () => {
    const { useStatsStore } = await import("@/app/store/statsStore");
    useTutorialStore.getState().markSeen("zukan");
    // 品詞分類の直近の解答を、ほとんど不正解にする(苦手判定: 3問以上で6割未満)
    useStatsStore.setState({ unitRecent: { "hinshi-bunrui": [false, false, false, true] } });
    const el = document.createElement("div");
    document.body.appendChild(el);
    const r = createRoot(el);
    act(() => r.render(<ZukanScreen />));
    const callout = el.querySelector(".zukan-weak-callout");
    expect(callout).not.toBeNull();
    expect(callout!.textContent).toContain("にがてかも");
    const headings = [...el.querySelectorAll("h3")];
    const accuracy = headings.find((h) => h.textContent?.includes("正答率"))!;
    const pages = headings.find((h) => h.textContent?.includes("ずかん"))!;
    const before = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    // 注意喚起 → 正答率 → 図鑑のページ の順(正答率は、下の方ではなく上にある)
    expect(before(callout!, accuracy)).toBe(true);
    expect(before(accuracy, pages)).toBe(true);
    act(() => callout!.querySelector<HTMLButtonElement>("button")!.click());
    expect(useNavigationStore.getState().screen).toMatchObject({ name: "freePractice", unitId: "hinshi-bunrui" });
    act(() => r.unmount());
    el.remove();
    useStatsStore.setState({ unitRecent: {} });
  });

  it("苦手な単元がなければ、注意喚起は出ない", () => {
    useTutorialStore.getState().markSeen("zukan");
    const el = document.createElement("div");
    document.body.appendChild(el);
    const r = createRoot(el);
    act(() => r.render(<ZukanScreen />));
    expect(el.querySelector(".zukan-weak-callout")).toBeNull();
    act(() => r.unmount());
    el.remove();
  });
});

