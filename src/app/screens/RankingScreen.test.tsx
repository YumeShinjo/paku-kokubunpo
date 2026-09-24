import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useProgressStore } from "@/app/store/progressStore";
import { useProfileStore } from "@/app/store/profileStore";
import { useRankingStore } from "@/app/store/rankingStore";
import { DEFAULT_ICON_ID } from "@/data/playerIcons";

const api = vi.hoisted(() => ({
  isConfigured: vi.fn(() => true),
  joinClass: vi.fn(),
  submitScore: vi.fn(),
  fetchRanking: vi.fn(),
  leaveClass: vi.fn(),
}));

vi.mock("@/lib/rankingApi", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/rankingApi")>();
  return { ...original, rankingApi: api };
});

import { RankingScreen } from "./RankingScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("ランキング画面: ニックネームの変更とアイコン", () => {
  let container: HTMLDivElement;
  let root: Root;

  const buttons = () => [...container.querySelectorAll("button")];
  const byText = (text: string) => buttons().find((b) => b.textContent?.includes(text));
  const flush = () => act(async () => void (await Promise.resolve()));

  function type(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    act(() => {
      setter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  async function openRenameForm() {
    act(() => byText("ニックネームを変")!.click());
    return container.querySelector<HTMLInputElement>(".ranking-rename input")!;
  }

  async function submitRename() {
    await act(async () => {
      container.querySelector<HTMLFormElement>(".ranking-rename")!.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
  }

  beforeEach(async () => {
    api.joinClass.mockReset().mockResolvedValue(120);
    api.submitScore.mockReset().mockResolvedValue(undefined);
    api.fetchRanking.mockReset().mockResolvedValue({
      entries: [
        { uid: "me", nickname: "たろう", icon: "pink-heart", score: 120, rank: 1, isMe: true },
        { uid: "u2", nickname: "はなこ", icon: "gold-star", score: 90, rank: 2, isMe: false },
        { uid: "u3", nickname: "ふるい", icon: "", score: 50, rank: 3, isMe: false },
      ],
      me: { nickname: "たろう", icon: "pink-heart", score: 120, rank: 1 },
    });
    useProgressStore.setState({ clearedStageIds: [], totalScore: 120 });
    useProfileStore.setState({ iconId: "pink-heart" });
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 120, syncedIcon: "pink-heart" });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<RankingScreen />));
    await flush();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("順位表に、各人のアイコンが出る(アイコンなしの古いデータも標準のアイコンで出る)", () => {
    expect(container.querySelectorAll(".ranking-list li")).toHaveLength(3);
    expect(container.querySelectorAll(".ranking-list li svg.player-icon")).toHaveLength(3);
  });

  it("ニックネームを変えると、サーバーの自分のデータが書き換わり、端末の表示も変わる", async () => {
    const input = await openRenameForm();
    expect(input.value).toBe("たろう");
    type(input, "じろう");
    await submitRename();
    expect(api.joinClass).toHaveBeenCalledWith("3a", { nickname: "じろう", icon: "pink-heart" }, 120);
    expect(useRankingStore.getState().nickname).toBe("じろう");
    expect(container.querySelector(".ranking-rename")).toBeNull(); // フォームは閉じる
    expect(container.textContent).toContain("じろう");
    // 得点は減らない
    expect(useRankingStore.getState().lastSyncedScore).toBe(120);
  });

  it("使えないニックネーム(空・長すぎ・NGワード)は、送らずにエラーを出す", async () => {
    const input = await openRenameForm();
    for (const bad of ["", "あ".repeat(13), "うんこ"]) {
      type(input, bad);
      await submitRename();
      expect(container.querySelector(".ranking-rename .ranking-error"), bad).not.toBeNull();
    }
    expect(api.joinClass).not.toHaveBeenCalled();
    expect(useRankingStore.getState().nickname).toBe("たろう");
  });

  it("通信できないときは、変えずにエラーを出し、フォームは開いたまま(やり直せる)", async () => {
    const { RankingError } = await import("@/lib/rankingApi");
    api.joinClass.mockRejectedValue(new RankingError("offline"));
    const input = await openRenameForm();
    type(input, "じろう");
    await submitRename();
    expect(useRankingStore.getState().nickname).toBe("たろう");
    expect(container.querySelector(".ranking-rename .ranking-error")?.textContent).toContain("つうしん");
  });

  it("同じ名前のままなら通信せず、フォームを閉じる。「やめる」でも変わらない", async () => {
    let input = await openRenameForm();
    await submitRename();
    expect(api.joinClass).not.toHaveBeenCalled();
    expect(container.querySelector(".ranking-rename")).toBeNull();
    input = await openRenameForm();
    type(input, "じろう");
    act(() => byText("やめる")!.click());
    expect(container.querySelector(".ranking-rename")).toBeNull();
    expect(useRankingStore.getState().nickname).toBe("たろう");
  });

  it("アイコンを選ぶと、端末に保存され、サーバーへ送られる", async () => {
    await act(async () => {
      container.querySelector<HTMLButtonElement>('.icon-choice[aria-label="黄色の星"]')!.click();
    });
    await flush();
    expect(useProfileStore.getState().iconId).toBe("gold-star");
    expect(api.submitScore).toHaveBeenCalledWith("3a", { nickname: "たろう", icon: "gold-star" }, 120);
    expect(useRankingStore.getState().syncedIcon).toBe("gold-star");
  });

  it("未参加のとき、参加フォームでアイコンを選んで参加すると、そのアイコンで参加する", async () => {
    useRankingStore.setState({ classCode: null, nickname: null, lastSyncedScore: 0, syncedIcon: null });
    useProfileStore.setState({ iconId: DEFAULT_ICON_ID });
    act(() => root.render(<RankingScreen key="form" />));
    await flush();
    await act(async () => {
      container.querySelector<HTMLButtonElement>('.icon-choice[aria-label="青の四角"]')!.click();
    });
    const inputs = container.querySelectorAll<HTMLInputElement>(".ranking-form input");
    type(inputs[0], "3a");
    type(inputs[1], "たろう");
    await act(async () => {
      container.querySelector<HTMLFormElement>(".ranking-form")!.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    expect(api.joinClass).toHaveBeenCalledWith("3a", { nickname: "たろう", icon: "blue-square" }, 120);
    expect(useRankingStore.getState()).toMatchObject({ classCode: "3a", nickname: "たろう", syncedIcon: "blue-square" });
  });
});
