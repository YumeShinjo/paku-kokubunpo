import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TapToStart } from "./TapToStart";
import { useAnnouncementStore } from "@/app/store/announcementStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { announcements } from "@/data/announcements";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("最初の画面(TapToStart)", () => {
  let container: HTMLDivElement;
  let root: Root;

  const q = <T extends Element>(selector: string) => container.querySelector<T>(selector);
  const click = (selector: string) => act(() => q<HTMLButtonElement>(selector)!.click());

  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    useSettingsStore.setState({ audioUnlocked: false, muted: false });
    useNavigationStore.setState({ screen: { name: "title" } });
    useAnnouncementStore.setState({ seenIds: [] });
    useReviewStore.setState({ starredQuestionIds: [] });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<TapToStart />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("「タッチして はじめる」を出し、画面をタップすると音声を解禁する", () => {
    expect(q(".tap-to-start-hint")?.textContent).toBe("タッチして はじめる");
    click("button.tap-to-start");
    expect(useSettingsStore.getState().audioUnlocked).toBe(true);
  });

  it("画像を読み込んでいるあいだは、案内を薄くしておく(準備ができるまで is-ready が付かない)", () => {
    // jsdom では画像が読み込まれないので、この時点では、まだ準備できていない
    expect(q(".tap-to-start-hint")?.classList.contains("is-ready")).toBe(false);
  });

  it("バージョン表記を押すと、お知らせが開く。ゲームは始まらず、音声も解禁されない", () => {
    click(".splash-version");
    expect(q('[role="dialog"]')?.getAttribute("aria-label")).toBe("お知らせ");
    for (const a of announcements) expect(container.textContent).toContain(a.title.replace(/\[[^\]]*\]/g, ""));
    expect(useSettingsStore.getState().audioUnlocked).toBe(false);
    click(".announce-close");
    expect(q('[role="dialog"]')).toBeNull();
  });

  it("まだ見ていないお知らせがあるあいだ「NEW」を出し、お知らせを開くと消える(見たことは保存される)", () => {
    expect(q(".splash-new")?.textContent).toBe("NEW");
    click(".splash-version");
    expect(q(".splash-new")).toBeNull();
    expect(useAnnouncementStore.getState().seenIds).toEqual(announcements.map((a) => a.id));
  });

  it("以前のお知らせだけを見た端末には、新しいお知らせがあるので、NEW を出す。開くと、本文が1つのお知らせは段落で出る", () => {
    act(() => useAnnouncementStore.setState({ seenIds: ["2026-09-30"] }));
    expect(q(".splash-new")?.textContent).toBe("NEW");
    click(".splash-version");
    expect(q(".splash-new")).toBeNull();
    const single = [...container.querySelectorAll(".announce-item")].find((el) => el.textContent?.includes("プライバシーポリシーを追加"))!;
    expect(single.querySelector("p.announce-text")).not.toBeNull();
    expect(single.querySelector("ul")).toBeNull();
    // 本文が複数のお知らせは、これまでどおり箇条書き
    const multi = [...container.querySelectorAll(".announce-item")].find((el) => el.textContent?.includes("今日の更新"))!;
    expect(multi.querySelectorAll("li")).toHaveLength(4);
  });

  it("クレジットの入口は、音声を解禁して、クレジット画面へつなぐ", () => {
    click(".splash-credits");
    expect(useSettingsStore.getState().audioUnlocked).toBe(true);
    const screen = useNavigationStore.getState().screen;
    expect(screen.name).toBe("credits");
  });

  it("プライバシーポリシーの入口は、音声を解禁して、ポリシーの画面へつなぐ(もどるとタイトルへ)", () => {
    click(".splash-privacy");
    expect(useSettingsStore.getState().audioUnlocked).toBe(true);
    expect(useNavigationStore.getState().screen).toEqual({ name: "privacy", next: { name: "title" } });
  });

  it("星(苦手問題)が残っているときは、手を振る絵を使わず、これまでの表情のコトを出す", () => {
    act(() => useReviewStore.setState({ starredQuestionIds: ["a"] }));
    expect(q(".splash-koto-wave")).toBeNull();
    expect(q(".splash-koto-mascot")).not.toBeNull();
  });
});
