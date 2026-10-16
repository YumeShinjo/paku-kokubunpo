import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { useMascotStore } from "@/app/store/mascotStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { AreaSelectScreen } from "@/app/screens/AreaSelectScreen";
import { FreePracticeScreen } from "@/app/screens/FreePracticeScreen";
import { KotonohaScreen } from "@/app/screens/KotonohaScreen";
import { SettingsScreen } from "@/app/screens/SettingsScreen";
import { SourcesScreen } from "@/app/screens/SourcesScreen";
import { StageScreen } from "@/app/screens/StageScreen";
import { StageSelectScreen } from "@/app/screens/StageSelectScreen";
import { TitleScreen } from "@/app/screens/TitleScreen";
import { ZukanScreen } from "@/app/screens/ZukanScreen";
import { playableAreas } from "@/data/areas";
import { getAllIdiomQuestions } from "@/data/kotowaza";
import { getStagesForArea } from "@/data/stages";
import { collectTransferData, encodeTransferCode } from "@/features/transfer/transferCode";
import { resetAllData } from "@/features/settings/resetData";
import { countReplayableStories } from "@/features/story/storyArchive";
import { DEBUG_UNLOCK_KEY, isDebugUnlocked, resetDebugUnlockForTest, setDebugUnlock } from "@/lib/debugUnlock";
import { resetAudioDebugForTest } from "@/lib/audioDebug";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * 隠しデバッグモード「全解放」。オンのあいだ、画面の「解放済みか」の判定だけを、すべて「解放済み」に見せる(進行データは、書き換えない)。
 * 進行データが空の端末で、オン・オフを切り替えて、確かめる。
 */
describe("全解放(デバッグ)", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (el: React.ReactElement) => act(() => root.render(el));
  const text = () => (container.textContent ?? "").replace(/\s+/g, "");

  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    resetDebugUnlockForTest(false);
    resetAudioDebugForTest();
    localStorage.clear();
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0, bossLosses: {}, assistedStageIds: [] });
    useStoryStore.setState({ seenStoryIds: [], choices: {} });
    useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: false, seenEntryFirst: false });
    useMascotStore.setState({ growthStage: 0 });
    useTutorialStore.setState({ seenGuides: ["zukan"] });
    useNavigationStore.setState({ screen: { name: "title" } });
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    resetDebugUnlockForTest(false);
    window.history.replaceState({}, "", "/");
  });

  describe("切り替えと保存", () => {
    it("ふだんはオフ。切り替えは、端末に保存される。保存のキーは、進行データのキー(paku-kokubunpo:)とは別", () => {
      resetDebugUnlockForTest();
      expect(isDebugUnlocked()).toBe(false);
      setDebugUnlock(true);
      expect(isDebugUnlocked()).toBe(true);
      expect(localStorage.getItem(DEBUG_UNLOCK_KEY)).toBe("1");
      expect(DEBUG_UNLOCK_KEY.startsWith("paku-kokubunpo:")).toBe(false);
      setDebugUnlock(false);
      expect(localStorage.getItem(DEBUG_UNLOCK_KEY)).toBeNull();
    });

    it("URLの ?debug=unlock でオン、?debug=lock でオフ(保存される。ホーム画面から起動して、URLがなくても、オンのまま)", () => {
      resetDebugUnlockForTest();
      window.history.replaceState({}, "", "/?debug=unlock");
      expect(isDebugUnlocked()).toBe(true);
      expect(localStorage.getItem(DEBUG_UNLOCK_KEY)).toBe("1");
      const saved = localStorage.getItem(DEBUG_UNLOCK_KEY)!;
      resetDebugUnlockForTest();
      localStorage.setItem(DEBUG_UNLOCK_KEY, saved);
      window.history.replaceState({}, "", "/");
      expect(isDebugUnlocked()).toBe(true); // URLなしで起動しても、オン
      resetDebugUnlockForTest();
      localStorage.setItem(DEBUG_UNLOCK_KEY, "1");
      window.history.replaceState({}, "", "/?debug=lock");
      expect(isDebugUnlocked()).toBe(false);
      expect(localStorage.getItem(DEBUG_UNLOCK_KEY)).toBeNull();
    });

    it("保存(localStorage)が使えなくても、例外にならず、その回のあいだは切り替えられる", () => {
      resetDebugUnlockForTest();
      const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("SecurityError");
      });
      expect(() => isDebugUnlocked()).not.toThrow();
      expect(() => setDebugUnlock(true)).not.toThrow();
      expect(isDebugUnlocked()).toBe(true);
      setItem.mockRestore();
      getItem.mockRestore();
    });

    it("「データを初期化する」のあとも、スイッチは保存されている(進行データのキーだけが消える)", async () => {
      setDebugUnlock(true);
      localStorage.setItem("paku-kokubunpo:progress", '{"state":{}}');
      const result = await resetAllData({ leaveClass: vi.fn() });
      expect(localStorage.getItem("paku-kokubunpo:progress")).toBeNull();
      expect(result.removedKeys).not.toContain(DEBUG_UNLOCK_KEY);
      expect(localStorage.getItem(DEBUG_UNLOCK_KEY)).toBe("1");
    });

    it("引き継ぎコードに、全解放の状態は入らない(本当の進行データだけ。オン・オフで、同じ)", async () => {
      useProgressStore.setState({ clearedStageIds: ["prologue-stage1"], totalScore: 40 });
      const off = JSON.stringify(collectTransferData());
      const offCode = await encodeTransferCode();
      setDebugUnlock(true);
      expect(JSON.stringify(collectTransferData())).toBe(off);
      expect(Object.keys(collectTransferData())).not.toContain("debugUnlock");
      expect(off).not.toMatch(/debug|unlock/i);
      // 進行データが空のままオンにしても、コードの中身は、空の進行データ(解放済みには、ならない)
      useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
      expect(collectTransferData().cleared).toEqual([]);
      expect(typeof offCode).toBe("string");
    });
  });

  describe("進行データは、書き換えない", () => {
    it("オンにして、各画面を開いても、進行データ(クリア・得点・ストーリー・葉・成長)は、空のまま。ストアの判定関数も、本当の状態を返す", () => {
      setDebugUnlock(true);
      render(<AreaSelectScreen />);
      render(<StageSelectScreen areaId="ohzaNoMa" />);
      render(<ZukanScreen initialTab="memories" />);
      const p = useProgressStore.getState();
      expect(p.clearedStageIds).toEqual([]);
      expect(p.totalScore).toBe(0);
      expect(p.isAreaUnlocked("kotobaNoIchiba")).toBe(false); // ストアの判定は、本当の進行状況のまま
      expect(p.isAreaCleared("prologue")).toBe(false);
      expect(p.isStageCleared("prologue-stage1")).toBe(false);
      expect(useStoryStore.getState().seenStoryIds).toEqual([]);
      expect(useStoryStore.getState().choices).toEqual({});
      expect(useKotonohaStore.getState().collectedIds).toEqual([]);
      expect(useMascotStore.getState().growthStage).toBe(0);
    });

    it("オンのまま遊んだ結果(クリア)は、本当の進行データに書き込まれる。「エリア全体をクリアしたか」は、本当の状態で判定される", () => {
      setDebugUnlock(true);
      useProgressStore.getState().markStageCleared("prologue-stage1", 30);
      const p = useProgressStore.getState();
      expect(p.clearedStageIds).toEqual(["prologue-stage1"]);
      expect(p.totalScore).toBe(30);
      expect(p.isAreaCleared("prologue")).toBe(false); // 1つクリアしただけでは、エリアクリアにならない(成長の判定が、狂わない)
    });
  });

  describe("全解放がオン・進行データが空: すべて解放済みに見える", () => {
    beforeEach(() => setDebugUnlock(true));

    it("エリア選択: 8エリアすべて押せる(ロック中の表示も、「開くよ」の案内も、ない)。クリア済みに見える", () => {
      render(<AreaSelectScreen />);
      const buttons = [...container.querySelectorAll<HTMLButtonElement>(".area-list button")];
      expect(buttons).toHaveLength(playableAreas.length);
      for (const b of buttons) expect(b.disabled).toBe(false);
      expect(container.querySelector(".area-chip-locked")).toBeNull();
      expect(container.querySelector(".area-locked")).toBeNull();
      expect(container.querySelectorAll(".area-card.area-cleared")).toHaveLength(playableAreas.length);
    });

    it("ステージ選択: どのエリアでも入れて、全ステージ(小ボス・ラスボスを含む)に挑戦できる。ラスボスの伏せ(？？？)も外れる", () => {
      for (const area of playableAreas) {
        render(<StageSelectScreen areaId={area.id} key={area.id} />);
        expect(text(), area.id).not.toContain("まだ入れないよ");
        const stages = getStagesForArea(area.id);
        const buttons = [...container.querySelectorAll<HTMLButtonElement>(".stage-list > li > button.stage-subboss, .stage-list > li > button:not(.stage-restart)")];
        expect(buttons.length, area.id).toBeGreaterThanOrEqual(stages.length);
        for (const b of buttons) expect(b.disabled, area.id).toBe(false);
        expect(container.querySelector(".stage-locked"), area.id).toBeNull();
        expect(text(), area.id).not.toContain("？？？");
      }
    });

    it("ボス戦(小ボス・ラスボス)の入口: 「まだ挑戦できません」で止められない", () => {
      setDebugUnlock(false);
      render(<StageScreen areaId="ohzaNoMa" stageId="ohzaNoMa-lastboss" />);
      expect(text()).toContain("このステージはまだ挑戦");
      setDebugUnlock(true);
      render(<StageScreen areaId="ohzaNoMa" stageId="ohzaNoMa-lastboss" key="on" />);
      expect(text()).not.toContain("このステージはまだ挑戦");
      render(<StageScreen areaId="kotobaNoIchiba" stageId="kotobaNoIchiba-subboss" key="on2" />);
      expect(text()).not.toContain("このステージはまだ挑戦");
    });

    it("自由練習: 開いていないエリアの単元も、練習できる", () => {
      setDebugUnlock(false);
      render(<FreePracticeScreen unitId="particle" />);
      const lockedText = text();
      setDebugUnlock(true);
      render(<FreePracticeScreen unitId="particle" key="on" />);
      expect(text()).not.toContain("このエリアは、まだ入れないよ");
      expect(lockedText.length).toBeGreaterThan(0);
    });

    it("ホーム: 言の葉の森が遊べる(鍵なし・N / 80 は 80 / 80)。全解放の目印が出る", () => {
      render(<TitleScreen />);
      const forest = container.querySelector(".title-forest")!;
      expect(forest.classList.contains("is-locked")).toBe(false);
      expect(forest.getAttribute("aria-disabled")).toBe("false");
      const total = getAllIdiomQuestions().length;
      expect(forest.textContent).toContain(`${total} / ${total}`);
      const badge = container.querySelector(".debug-unlock-badge")!;
      expect(badge.textContent).toBe("全解放 オン");
    });

    it("言の葉の森の入口: 序章をクリアしていなくても、遊べる(範囲のボタンが出る)。各範囲は、すべて集めた表示", () => {
      useKotonohaStore.setState({ seenEntryFirst: true }); // 初回の4行の台詞は、本当の記録で決まる(出すかどうかは、全解放と関係ない)
      render(<KotonohaScreen />);
      expect(text()).not.toContain("ことばの分かれ道をクリアすると遊べるよ");
      const counts = [...container.querySelectorAll(".kotonoha-scope-count")].map((e) => e.textContent);
      expect(counts).toEqual(["80 / 80", "50 / 50", "30 / 30"]);
    });

    it("ことだまの書: なかまの ずかん(王様の枠も)は全員そろい、ことのは図鑑は 80/80 で称号つき、おもいでは全ストーリーを見返せ、称号の一覧も出る", () => {
      render(<ZukanScreen initialTab="nakama" />);
      const count = container.querySelector(".nakama-count")!;
      const label = count.getAttribute("aria-label")!;
      const [met, all] = label.replace("であった なかま ", "").split(" / ").map(Number);
      expect(met).toBe(all);
      expect(container.querySelector(".nakama-card.is-locked")).toBeNull();

      render(<ZukanScreen initialTab="kotonoha" key="k" />);
      expect(container.querySelector(".kotonoha-leaf-count")!.getAttribute("aria-label")).toBe("集めた葉 80 / 80");
      expect(container.querySelector(".kotonoha-tab-title-earned")).not.toBeNull();

      render(<ZukanScreen initialTab="memories" key="m" />);
      expect(text()).toContain(`(${countReplayableStories()}/${countReplayableStories()})`);
      expect(container.querySelectorAll(".memory-list button").length).toBe(countReplayableStories());
      expect(text()).toContain("エンディングをもういちど見る");
      const titles = [...container.querySelectorAll(".zukan-title-list li")].map((li) => li.textContent);
      expect(titles.length).toBe(3); // 王座の間の分岐の称号(2つ)+ 言の葉の森の称号
      // ふりがな(rt)をのぞいた文字で確かめる
      const plain = (li: Element) => {
        const clone = li.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("rt").forEach((rt) => rt.remove());
        return (clone.textContent ?? "").replace(/\s+/g, "");
      };
      const all3 = [...container.querySelectorAll(".zukan-title-list li")].map(plain).join("|");
      expect(all3).toContain("言葉を結びし者");
      expect(all3).toContain("風のことだま使い");
      expect(all3).toContain("言の葉をひろいし者");
    });

    it("正答率タブ: 開いていないエリアも、ボタンが押せる", () => {
      render(<ZukanScreen initialTab="accuracy" />);
      const areaButtons = [...container.querySelectorAll<HTMLButtonElement>(".zukan-panel button[disabled]")];
      expect(areaButtons).toHaveLength(0);
    });

    it("くわしい出典: 「ひらく」を押さなくても、一覧が出る(ネタバレの隠しが外れる)", () => {
      render(<SourcesScreen next={{ name: "settings" }} />);
      expect(container.querySelector(".sources-open")).toBeNull();
      expect(container.querySelectorAll(".sources-item").length).toBeGreaterThan(40);
    });
  });

  describe("オフにすると、本当の進行状況(空)にもどる", () => {
    it("エリア選択・ホーム・出典・ことだまの書が、もとの(ロックされた)状態にもどる。目印も消える", () => {
      setDebugUnlock(true);
      render(<AreaSelectScreen />);
      expect(container.querySelector(".area-chip-locked")).toBeNull();
      act(() => setDebugUnlock(false)); // 画面は、切り替えたときに、更新される
      expect(container.querySelector(".area-chip-locked")).not.toBeNull();
      const buttons = [...container.querySelectorAll<HTMLButtonElement>(".area-list button")];
      expect(buttons[0].disabled).toBe(false);
      for (const b of buttons.slice(1)) expect(b.disabled).toBe(true);

      render(<TitleScreen key="t" />);
      expect(container.querySelector(".title-forest")!.classList.contains("is-locked")).toBe(true);
      expect(container.querySelector(".debug-unlock-badge")).toBeNull();

      render(<SourcesScreen next={{ name: "settings" }} key="s" />);
      expect(container.querySelector(".sources-open")).not.toBeNull();
      expect(container.querySelectorAll(".sources-item")).toHaveLength(0);

      render(<StageSelectScreen areaId="ohzaNoMa" key="o" />);
      expect(text()).toContain("まだ入れないよ");

      render(<ZukanScreen initialTab="memories" key="z" />);
      expect(container.querySelector(".zukan-title-list")).toBeNull();
      expect(text()).not.toContain("エンディングをもういちど見る");
    });
  });

  describe("設定画面: 隠しデバッグ項目", () => {
    const version = () => container.querySelector<HTMLElement>(".settings-version")!;
    const unlockPanel = () => container.querySelector(".debug-unlock-panel");

    it("5回タップするまで、全解放の項目は、見えない(ふだんのプレイヤーには、何も出ない)", () => {
      vi.useFakeTimers();
      try {
        render(<SettingsScreen />);
        expect(unlockPlayer()).toBe(true);
        for (let i = 0; i < 4; i++) act(() => version().click());
        expect(unlockPanel()).toBeNull();
        act(() => version().click());
        expect(unlockPanel()).not.toBeNull();
      } finally {
        vi.useRealTimers();
      }
      function unlockPlayer() {
        return unlockPanel() === null && !(container.textContent ?? "").includes("全解放");
      }
    });

    it("音のログと同じ領域に並ぶ。全解放のスイッチで、オン・オフが切り替わり、保存される。「全解放は初期化では解除されません」の1行が入る", () => {
      vi.useFakeTimers();
      try {
        render(<SettingsScreen />);
        for (let i = 0; i < 5; i++) act(() => version().click());
        expect(container.querySelector(".audio-debug-panel")).not.toBeNull();
        expect(unlockPanel()).not.toBeNull();
        expect(unlockPanel()!.textContent).toContain("全解放は、初期化では解除されません");
        const sw = unlockPanel()!.querySelector<HTMLInputElement>('input[role="switch"]')!;
        expect(sw.checked).toBe(false);
        expect(unlockPanel()!.querySelector(".debug-unlock-on")).toBeNull();
        act(() => sw.click());
        expect(isDebugUnlocked()).toBe(true);
        expect(localStorage.getItem(DEBUG_UNLOCK_KEY)).toBe("1");
        expect(unlockPanel()!.querySelector("h3")!.textContent).toBe("全解放オン"); // 見出しに「オン」(小さく)
        act(() => sw.click());
        expect(isDebugUnlocked()).toBe(false);
        expect(localStorage.getItem(DEBUG_UNLOCK_KEY)).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });

    it("全解放がオンのときは、5回タップしなくても、項目が出ている(オフにするため)", () => {
      setDebugUnlock(true);
      render(<SettingsScreen />);
      expect(unlockPanel()).not.toBeNull();
    });

    it("見出しの下の「初期化」の確認ダイアログの文言と動作は、変わらない", () => {
      render(<SettingsScreen />);
      const reset = [...container.querySelectorAll("button")].find((b) => (b.textContent ?? "").includes("データを初期化"))!;
      act(() => reset.click());
      expect(container.querySelector('[role="alertdialog"]')!.textContent).toContain("本当に");
    });
  });
});
