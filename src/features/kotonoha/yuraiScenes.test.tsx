import { act } from "react";
import { readFileSync } from "node:fs";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KotonohaPlayScreen, ROUND_START_AUTO_MS } from "@/app/screens/KotonohaPlayScreen";
import { KotonohaScreen } from "@/app/screens/KotonohaScreen";
import { completionsToShow, hasEnteredForest, newlyCompleted, useKotonohaStore } from "@/app/store/kotonohaStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { getStagesForArea } from "@/data/stages";
import { resolveCharacters } from "@/data/zukanCharacters";
import { kojiQuestions, kotowazaQuestions } from "@/data/kotowaza";
import {
  ENTRY_REPEAT_IDS,
  pickEntryRepeat,
  resultSceneId,
  roundStartSceneId,
  sceneRuby,
  SCENE_IDS,
  YURAI_SCENES,
  type SceneId,
} from "@/data/yuraiScenes";
import { limitRuby } from "@/data/rubyPolicy";
import { rb } from "@/data/ruby";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** 禁止語(ユライ関連の、既存のネタバレテストと同じ。なかまの ずかんの「王女」も含む) */
const SPOILERS = ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"];
const plain = (text: { text: string }[]) => text.map((s) => s.text).join("");
const allIds = [...kotowazaQuestions, ...kojiQuestions].map((q) => q.id);
const kotowazaIds = kotowazaQuestions.map((q) => q.id);
const kojiIds = kojiQuestions.map((q) => q.id);
const except = (ids: string[], id: string) => ids.filter((x) => x !== id);

describe("場面台詞のデータ(yurai-scene-lines.md)", () => {
  it("場面IDは15個。入口(初回+3つ)・ラウンド開始(3つ)・結果(4つ)・新しい葉・コンプリート(3つ)", () => {
    expect([...SCENE_IDS]).toEqual([
      "entry_first",
      "entry_repeat_a",
      "entry_repeat_b",
      "entry_repeat_c",
      "round_start_all",
      "round_start_kotowaza",
      "round_start_koji",
      "result_perfect",
      "result_high",
      "result_mid",
      "result_low",
      "leaf_new",
      "complete_all",
      "complete_kotowaza",
      "complete_koji",
    ]);
    expect(Object.keys(YURAI_SCENES).sort()).toEqual([...SCENE_IDS].sort());
  });

  it("話者の順: entry_first は ユライ→コト→ユライ→コト。complete_all は ユライ→コト→ユライ。ほかは ユライ→コト", () => {
    const order = (id: SceneId) => YURAI_SCENES[id].map((l) => l.speaker).join(",");
    expect(order("entry_first")).toBe("yurai,koto,yurai,koto");
    expect(order("complete_all")).toBe("yurai,koto,yurai");
    for (const id of SCENE_IDS.filter((x) => x !== "entry_first" && x !== "complete_all")) expect(order(id), id).toBe("yurai,koto");
  });

  it("文言は、台詞の正本のとおり(抜き取り)", () => {
    const text = (id: SceneId) => YURAI_SCENES[id].map((l) => l.text);
    expect(text("entry_first")).toEqual([
      "ここは、言の葉の 森。……ようこそ。",
      "あ、旅の人だ!ここ、どんなところなの?",
      "ことばが、葉に なって、ねむってる。",
      "じゃあ、わたしたちで、起こしてあげよう!",
    ]);
    expect(text("round_start_kotowaza")).toEqual(["くらしの なかで、うまれた ことばから。", "行くよー!"]);
    expect(text("result_perfect")).toEqual(["……ぜんぶ、おぼえて いたんだね。", "すごいすごい!パーフェクト!"]);
    expect(text("leaf_new")).toEqual(["……また、ひとつ。", "新しい葉、見つけたよ!"]);
    expect(text("complete_all")[2]).toBe("ここからは……また、あたらしい 話を さがすだけ。");
    expect(text("complete_koji")[1]).toBe("故事成語も、コンプリート!すごいよ!");
  });

  it("ユライの台詞は、ひらがな中心(漢字は「言の葉の森」「葉」「話」だけ)。台詞には、ふりがなの記法を書かない", () => {
    for (const id of SCENE_IDS) {
      for (const line of YURAI_SCENES[id]) {
        if (line.speaker === "yurai") {
          const kanji = line.text.match(/\p{Script=Han}/gu) ?? [];
          expect(kanji.every((c) => "言葉森話".includes(c)), `${id}: ${line.text}`).toBe(true);
        }
        expect(line.text, id).not.toMatch(/[[\]]/);
      }
    }
  });

  it("禁止語(ラスボス・王様・ヴェルバルト・コレット・王女)が、場面台詞の全文に出ない", () => {
    for (const id of SCENE_IDS) {
      for (const line of YURAI_SCENES[id]) {
        for (const word of SPOILERS) expect(line.text, `${id}: ${word}`).not.toContain(word);
      }
    }
  });

  it("ふりがな: 「言の葉の 森」・「葉」に付く。画面に出す文字は、台詞のとおりで変わらない", () => {
    const shown = (t: string) =>
      limitRuby(rb(sceneRuby(t)))
        .filter((s) => s.ruby)
        .map((s) => `${s.text}:${s.ruby}`);
    expect(shown("ここは、言の葉の 森。……ようこそ。")).toEqual(["言:こと", "葉:は", "森:もり"]);
    expect(shown("新しい葉、見つけたよ!")).toEqual(["葉:は"]);
    for (const id of SCENE_IDS) {
      for (const line of YURAI_SCENES[id]) expect(plain(rb(sceneRuby(line.text))), id).toBe(line.text);
    }
  });
});

describe("場面の選び方", () => {
  it("2回目以降の入口: 3つからランダム。直前に出したものは、連続で避ける", () => {
    const seen = new Set<string>();
    for (const last of [undefined, ...ENTRY_REPEAT_IDS]) {
      for (let i = 0; i < 20; i++) {
        const picked = pickEntryRepeat(last, () => i / 20);
        expect(ENTRY_REPEAT_IDS).toContain(picked);
        if (last) expect(picked).not.toBe(last);
        seen.add(picked);
      }
    }
    expect(seen.size).toBe(3);
    expect(ENTRY_REPEAT_IDS).toContain(pickEntryRepeat("entry_repeat_a", () => 0.9999));
    expect(pickEntryRepeat(undefined, () => 0)).toBe("entry_repeat_a");
  });

  it("ラウンド開始: 範囲ごと(すべて・ことわざ・故事成語)", () => {
    expect(roundStartSceneId("all")).toBe("round_start_all");
    expect(roundStartSceneId("kotowaza")).toBe("round_start_kotowaza");
    expect(roundStartSceneId("koji")).toBe("round_start_koji");
  });

  it("結果: 10/10 → perfect、7〜9 → high、4〜6 → mid、0〜3 → low", () => {
    const band = (n: number) => resultSceneId(n, 10);
    expect([10].map(band)).toEqual(["result_perfect"]);
    expect([9, 8, 7].map(band)).toEqual(["result_high", "result_high", "result_high"]);
    expect([6, 5, 4].map(band)).toEqual(["result_mid", "result_mid", "result_mid"]);
    expect([3, 2, 1, 0].map(band)).toEqual(["result_low", "result_low", "result_low", "result_low"]);
  });
});

describe("コンプリートの判定(新しく埋まったときだけ)", () => {
  it("80/80: 最後の1枚で埋まったとき。ことわざ・故事成語も同時に埋まるなら、all だけを出す", () => {
    const newly = newlyCompleted(except(allIds, "kotowaza-001"), allIds, []);
    expect(newly[0]).toBe("all");
    expect(completionsToShow(newly)).toEqual(["all"]);
  });

  it("ことわざ50/50 だけが埋まったとき → kotowaza。故事成語30/30 だけ → koji", () => {
    expect(completionsToShow(newlyCompleted(except(kotowazaIds, "kotowaza-001"), kotowazaIds, []))).toEqual(["kotowaza"]);
    expect(completionsToShow(newlyCompleted(except(kojiIds, "koji-001"), kojiIds, []))).toEqual(["koji"]);
  });

  it("すでに出したカテゴリは、もう出さない。すでに埋まっていた端末は、遡って出ない", () => {
    expect(newlyCompleted(except(kotowazaIds, "kotowaza-001"), kotowazaIds, ["kotowaza"])).toEqual([]);
    expect(newlyCompleted(allIds, allIds, [])).toEqual([]);
    // ことわざを埋めている端末が、故事成語を埋めたとき: all だけ(ことわざは、すでに埋まっていた)
    const newly = newlyCompleted([...kotowazaIds, ...except(kojiIds, "koji-001")], allIds, []);
    expect(completionsToShow(newly)).toEqual(["all"]);
  });
});

describe("言の葉の森の画面: 場面台詞", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (el: React.ReactElement) => act(() => root.render(el));
  const q = <T extends Element>(selector: string) => container.querySelector<T>(selector);
  const qa = <T extends Element>(selector: string) => [...container.querySelectorAll<T>(selector)];
  const click = (el: Element | null) => act(() => (el as HTMLElement).click());
  const setStore = (state: Partial<ReturnType<typeof useKotonohaStore.getState>>) => useKotonohaStore.setState(state);
  const resetStore = () =>
    useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: false, seenEntryFirst: false, shownCompletions: [], lastEntryScene: undefined });

  beforeEach(() => {
    localStorage.clear();
    useProgressStore.setState({ clearedStageIds: getStagesForArea("prologue").map((s) => s.id) });
    resetStore();
    useNavigationStore.setState({ screen: { name: "kotonoha" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useProgressStore.setState({ clearedStageIds: [] });
    resetStore();
    vi.useRealTimers();
  });

  describe("入口", () => {
    it("初回(見終えた記録がない・遊んだ記録もない): entry_first。タップで1行ずつ、ユライ→コト→ユライ→コト。終わるまで、範囲のボタンは出ない", () => {
      render(<KotonohaScreen />);
      expect(q('[data-scene="entry_first"]')).not.toBeNull();
      expect(q(".kotonoha-scope-list")).toBeNull();
      const speakers: string[] = [];
      for (let i = 0; i < 4; i++) {
        expect(qa(".scene-bubble")).toHaveLength(1); // 1行ずつ
        speakers.push(q(".scene-bubble")!.getAttribute("data-speaker")!);
        expect(q(".scene-bubble-name")!.textContent).toBe(i % 2 === 0 ? "ユライ" : "コト");
        expect(container.textContent).not.toContain("あそびながら おぼえていこう"); // 現行の挨拶は、置き換え
        click(q(".scene-next"));
      }
      expect(speakers).toEqual(["yurai", "koto", "yurai", "koto"]);
      expect(q(".kotonoha-scope-list")).not.toBeNull();
      expect(qa(".scene-bubble")).toHaveLength(0);
    });

    it("初回: 吹き出しのところをタップしても進む。「スキップ」で、すぐ終わる", () => {
      render(<KotonohaScreen />);
      click(q(".scene-tap-area"));
      expect(q(".scene-bubble-name")!.textContent).toBe("コト");
      click(q(".scene-skip"));
      expect(q(".kotonoha-scope-list")).not.toBeNull();
    });

    it("初回の最初の1行は、ユライの台詞。入場(enteredForest)は、画面を開いたときに記録される(図鑑のユライの解放)。台詞を見終えた記録は、まだない", () => {
      render(<KotonohaScreen />);
      expect(q(".scene-bubble-text")!.textContent).toContain("ここは、");
      expect(q(".scene-bubble")!.getAttribute("data-speaker")).toBe("yurai");
      expect(useKotonohaStore.getState().enteredForest).toBe(true);
      expect(useKotonohaStore.getState().seenEntryFirst).toBe(false);
    });

    it("初回の途中で抜けて(ホームへ戻る・画面を離れる)、また入ると、初回の4行を、また最初から出す", () => {
      render(<KotonohaScreen />);
      click(q(".scene-next")); // 1行目 → 2行目(コト)
      expect(q(".scene-bubble-name")!.textContent).toBe("コト");
      click(q(".back-button")); // 途中で、ホームへ戻る
      expect(useNavigationStore.getState().screen).toEqual({ name: "title" });
      expect(useKotonohaStore.getState().seenEntryFirst).toBe(false);
      act(() => root.unmount());
      root = createRoot(container);
      render(<KotonohaScreen key="again" />);
      expect(q('[data-scene="entry_first"]')).not.toBeNull();
      expect(q(".scene-bubble-name")!.textContent).toBe("ユライ"); // 1行目から
      expect(q(".scene-bubble-text")!.textContent).toContain("ここは、");
      // 3行目まで進めて離れても、同じ
      click(q(".scene-next"));
      click(q(".scene-next"));
      act(() => root.unmount());
      root = createRoot(container);
      render(<KotonohaScreen key="third" />);
      expect(q('[data-scene="entry_first"]')).not.toBeNull();
      expect(useKotonohaStore.getState().seenEntryFirst).toBe(false);
    });

    it("最後まで進めると、見終えた記録が付き、次からは2回目以降の台詞になる", () => {
      render(<KotonohaScreen />);
      for (let i = 0; i < 4; i++) click(q(".scene-next"));
      expect(useKotonohaStore.getState().seenEntryFirst).toBe(true);
      render(<KotonohaScreen key="second" />);
      expect(q('[data-scene="entry_first"]')).toBeNull();
      expect(ENTRY_REPEAT_IDS.some((id) => q(`[data-scene="${id}"]`))).toBe(true);
    });

    it("スキップしても、見終えた記録が付き、次からは2回目以降の台詞になる", () => {
      render(<KotonohaScreen />);
      click(q(".scene-skip"));
      expect(useKotonohaStore.getState().seenEntryFirst).toBe(true);
      render(<KotonohaScreen key="second" />);
      expect(q('[data-scene="entry_first"]')).toBeNull();
      expect(ENTRY_REPEAT_IDS.some((id) => q(`[data-scene="${id}"]`))).toBe(true);
    });

    it("図鑑のユライは、入場したときに解放される(初回の台詞を見終えなくても、遅れない)", () => {
      const yurai = () => resolveCharacters({ hasSeen: () => false, enteredForest: hasEnteredForest(useKotonohaStore.getState()) }).find((c) => c.slot.id === "yurai")!;
      expect(yurai().version).toBeUndefined();
      render(<KotonohaScreen />);
      expect(useKotonohaStore.getState().seenEntryFirst).toBe(false); // 台詞は、まだ途中
      expect(yurai().version?.name).toBe("ユライ"); // 入場しただけで、解放されている
    });

    it("すでに入場済み(enteredForest が true)で、見終えた記録(seenEntryFirst)がない端末は、移行で、2回目以降の扱いにする", async () => {
      // 以前の版の保存データ(version 0。seenEntryFirst の項目がない)を読み込ませる
      localStorage.setItem("paku-kokubunpo:kotonoha", JSON.stringify({ state: { collectedIds: [], missedIds: [], enteredForest: true }, version: 0 }));
      await useKotonohaStore.persist.rehydrate();
      expect(useKotonohaStore.getState().seenEntryFirst).toBe(true);
      render(<KotonohaScreen />);
      expect(q('[data-scene="entry_first"]')).toBeNull();
    });

    it("移行: 遊んだ記録(葉を集めた・まちがえた)がある端末も、2回目以降。入場も記録もない端末は、初回のまま。今の版の保存データは、そのまま", async () => {
      const load = async (state: object, version: number) => {
        localStorage.setItem("paku-kokubunpo:kotonoha", JSON.stringify({ state, version }));
        await useKotonohaStore.persist.rehydrate();
        return useKotonohaStore.getState().seenEntryFirst;
      };
      expect(await load({ collectedIds: ["kotowaza-001"], missedIds: [] }, 0)).toBe(true);
      expect(await load({ collectedIds: [], missedIds: ["koji-001"] }, 0)).toBe(true);
      expect(await load({ collectedIds: [], missedIds: [], enteredForest: false }, 0)).toBe(false);
      // 今の版(version 1)で、入場だけして途中で抜けた状態(enteredForest: true・seenEntryFirst: false)は、初回のまま
      expect(await load({ collectedIds: [], missedIds: [], enteredForest: true, seenEntryFirst: false }, 1)).toBe(false);
      expect(await load({ collectedIds: [], missedIds: [], enteredForest: true, seenEntryFirst: true }, 1)).toBe(true);
    });

    it("入場の記録がなくても、すでに遊んだ端末(葉を集めた・まちがえた)は、2回目以降の扱い", () => {
      setStore({ collectedIds: ["kotowaza-001"] });
      render(<KotonohaScreen />);
      expect(q('[data-scene="entry_first"]')).toBeNull();
      expect(ENTRY_REPEAT_IDS.some((id) => q(`[data-scene="${id}"]`))).toBe(true);
    });

    it("2回目以降: 3つのどれか。ユライとコトの吹き出しを、2つ同時に出す。直前に出したものは、連続で出ない", () => {
      setStore({ enteredForest: true, seenEntryFirst: true });
      let last: string | undefined;
      const seen = new Set<string>();
      for (let i = 0; i < 12; i++) {
        render(<KotonohaScreen key={`r${i}`} />);
        const scene = ENTRY_REPEAT_IDS.find((id) => q(`[data-scene="${id}"]`));
        expect(scene, `${i}`).toBeTruthy();
        expect(qa(".scene-bubble").map((b) => b.getAttribute("data-speaker"))).toEqual(["yurai", "koto"]);
        expect(scene).not.toBe(last);
        expect(useKotonohaStore.getState().lastEntryScene).toBe(scene);
        last = scene;
        seen.add(scene!);
      }
      expect(seen.size).toBeGreaterThan(1);
    });
  });

  describe("ラウンド開始", () => {
    it("範囲を選ぶと、まず一言(ユライとコト)。タップですぐ出題へ。「もどる」は、その場で入口へもどる", () => {
      render(<KotonohaPlayScreen scope="koji" />);
      expect(q('[data-phase="intro"]')).not.toBeNull();
      expect(q('[data-scene="round_start_koji"]')).not.toBeNull();
      expect(qa(".scene-bubble").map((b) => b.getAttribute("data-speaker"))).toEqual(["yurai", "koto"]);
      expect(q(".kotonoha-choices")).toBeNull();
      click(q('[data-phase="intro"]')); // 画面のどこをタップしても、進む
      expect(q('[data-phase="question"]')).not.toBeNull();
      expect(q(".kotonoha-choices")).not.toBeNull();

      render(<KotonohaPlayScreen scope="all" key="back" />);
      click(q(".back-button"));
      expect(useNavigationStore.getState().screen).toEqual({ name: "kotonoha" });
      expect(q('[data-phase="question"]')).toBeNull();
    });

    it("範囲ごとの場面(すべて・ことわざ・故事成語)", () => {
      for (const scope of ["all", "kotowaza", "koji"] as const) {
        render(<KotonohaPlayScreen scope={scope} key={scope} />);
        expect(q(`[data-scene="${roundStartSceneId(scope)}"]`), scope).not.toBeNull();
      }
    });

    it("長く待たせない: タップしなくても、1.5秒で出題へ", () => {
      vi.useFakeTimers();
      expect(ROUND_START_AUTO_MS).toBeLessThanOrEqual(1500);
      render(<KotonohaPlayScreen scope="all" />);
      expect(q('[data-phase="intro"]')).not.toBeNull();
      act(() => vi.advanceTimersByTime(ROUND_START_AUTO_MS - 100));
      expect(q('[data-phase="intro"]')).not.toBeNull();
      act(() => vi.advanceTimersByTime(200));
      expect(q('[data-phase="question"]')).not.toBeNull();
    });
  });

  describe("結果とコンプリート", () => {
    let counter = 0;
    const start = (scope: "all" | "kotowaza" | "koji" = "all") => {
      render(<KotonohaPlayScreen scope={scope} key={`s${counter++}`} />);
      click(q(".scene-next"));
    };
    /** ふりがな(rt)を除いた、画面の文字 */
    const textOf = (el: Element) => {
      const copy = el.cloneNode(true) as Element;
      copy.querySelectorAll("rt").forEach((rt) => rt.remove());
      return copy.textContent!;
    };
    /** いま出ている問題の、正解の選択肢のボタン(問題の文から、問題を探す) */
    const correctButton = () => {
      const sentence = textOf(q(".kotonoha-sentence")!);
      const question = [...kotowazaQuestions, ...kojiQuestions].find((x) => plain(x.sentence).replace("___", "") === sentence)!;
      const answer = plain(question.answer);
      return qa<HTMLButtonElement>(".kotonoha-choices button").find((b) => textOf(b) === answer)!;
    };
    /** 結果まで進める。1問目は answerText を含む選択肢を押し(あれば)、correct のときは全問正解、そうでなければ1番目の選択肢 */
    const playRound = (answerText?: string, correct = false) => {
      for (let i = 0; i < 10; i++) {
        const choices = qa<HTMLButtonElement>(".kotonoha-choices button");
        const target = correct ? correctButton() : i === 0 && answerText ? choices.find((c) => c.textContent!.includes(answerText)) : undefined;
        click(target ?? choices[0]);
        click(q(".kotonoha-next"));
      }
    };

    it("得点帯別の一言: 結果画面に、その得点の帯の ユライ→コト が出る", () => {
      // 全問正解 → perfect
      start("all");
      playRound(undefined, true);
      expect(q(".kotonoha-score")!.textContent).toBe("10 / 10");
      const scene = q(".kotonoha-result-scene")!;
      expect(scene.getAttribute("data-scene")).toBe("result_perfect");
      expect([...scene.querySelectorAll(".scene-bubble")].map((b) => b.getAttribute("data-speaker"))).toEqual(["yurai", "koto"]);
      // 1番目の選択肢で答えたときは、得点から決まる帯
      click(qa<HTMLButtonElement>(".kotonoha-result-buttons button")[0]);
      playRound();
      const score = Number(q(".kotonoha-score")!.textContent!.split("/")[0]);
      expect(q(".kotonoha-result-scene")!.getAttribute("data-scene")).toBe(resultSceneId(score, 10));
    });

    it("新しい葉を集めたときだけ、「あたらしい 葉が〜」の行のすぐあとに leaf_new。得点帯別の一言とは別の枠", () => {
      start("all");
      playRound(undefined, true);
      const row = q(".kotonoha-new-leaves")!;
      expect(row.textContent).toContain("10まい");
      const leafNew = q('.kotonoha-leaf-new-scene[data-scene="leaf_new"]');
      expect(leafNew).not.toBeNull();
      expect(leafNew!.previousElementSibling).toBe(row);
      expect(leafNew!.closest(".kotonoha-result-scene")).toBeNull();
      expect(q(".kotonoha-result-scene")).not.toBe(leafNew);
    });

    it("新しい葉が1枚もなかったときは、「あたらしい 葉は なかったよ」で、leaf_new は出さない", () => {
      setStore({ enteredForest: true, seenEntryFirst: true, collectedIds: allIds, shownCompletions: ["all", "kotowaza", "koji"] });
      start("all");
      playRound();
      expect(q(".kotonoha-new-leaves")!.textContent).toContain("なかったよ");
      expect(q('[data-scene="leaf_new"]')).toBeNull();
      expect(q(".kotonoha-result-scene")).not.toBeNull();
    });

    it("80/80: 最後の1枚を集めたラウンドの結果に、complete_all だけが出る(ことわざ・故事成語は出ない)。閉じると消え、次のラウンドでは出ない", () => {
      setStore({ enteredForest: true, seenEntryFirst: true, collectedIds: except(allIds, "kotowaza-001") });
      start("all");
      playRound("猿");
      const overlay = q(".kotonoha-complete")!;
      expect(overlay).not.toBeNull();
      expect(overlay.getAttribute("data-scene")).toBe("complete_all");
      expect(overlay.querySelectorAll(".scene-bubble")).toHaveLength(3);
      expect(qa(".kotonoha-complete")).toHaveLength(1);
      expect(useKotonohaStore.getState().shownCompletions).toContain("all");
      click(overlay.querySelector(".scene-next"));
      expect(q(".kotonoha-complete")).toBeNull();
      // 同じ端末で、もう一度遊んでも、出ない
      click(qa<HTMLButtonElement>(".kotonoha-result-buttons button")[0]);
      playRound();
      expect(q(".kotonoha-complete")).toBeNull();
    });

    it("ことわざ50/50 だけが埋まったとき complete_kotowaza。故事成語30/30 だけが埋まったとき complete_koji", () => {
      setStore({ enteredForest: true, seenEntryFirst: true, collectedIds: except(kotowazaIds, "kotowaza-001") });
      start("kotowaza");
      playRound(plain(kotowazaQuestions[0].answer));
      expect(q(".kotonoha-complete")!.getAttribute("data-scene")).toBe("complete_kotowaza");
      expect(useKotonohaStore.getState().shownCompletions).toEqual(["kotowaza"]);

      act(() => root.unmount());
      root = createRoot(container);
      setStore({ collectedIds: except(kojiIds, "koji-001") });
      start("koji");
      playRound(plain(kojiQuestions[0].answer));
      expect(q(".kotonoha-complete")!.getAttribute("data-scene")).toBe("complete_koji");
      expect(useKotonohaStore.getState().shownCompletions).toEqual(["kotowaza", "koji"]);
    });

    it("すでに80/80だった端末: アップデート直後にも、そのあとのラウンドにも、遡って出ない", () => {
      setStore({ enteredForest: true, seenEntryFirst: true, collectedIds: allIds, shownCompletions: [] });
      start("all");
      playRound();
      expect(q(".kotonoha-complete")).toBeNull();
      expect(useKotonohaStore.getState().shownCompletions).toEqual([]);
    });

    it("コンプリートの台詞にも、禁止語が出ない", () => {
      setStore({ enteredForest: true, seenEntryFirst: true, collectedIds: except(allIds, "kotowaza-001") });
      start("all");
      playRound("猿");
      expect(q(".kotonoha-complete")).not.toBeNull();
      for (const word of SPOILERS) expect(container.textContent, word).not.toContain(word);
    });
  });

  it("場面台詞の画面(入口の初回・2回目以降・ラウンド開始)に、禁止語が出ない", () => {
    render(<KotonohaScreen />);
    for (let i = 0; i < 4; i++) {
      for (const word of SPOILERS) expect(container.textContent, word).not.toContain(word);
      click(q(".scene-next"));
    }
    render(<KotonohaScreen key="again" />);
    for (const word of SPOILERS) expect(container.textContent, word).not.toContain(word);
    render(<KotonohaPlayScreen scope="all" key="play" />);
    for (const word of SPOILERS) expect(container.textContent, word).not.toContain(word);
  });
});

describe("場面台詞の見た目(CSS)", () => {
  const css = readFileSync("src/styles/global.css", "utf-8");
  const rule = (selector: string) => {
    const start = css.indexOf(`\n${selector} {`);
    return start < 0 ? "" : css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  };

  it("「つぎへ」「スキップ」は高さ44px以上。下の安全な余白(safe-area)を考える。コンプリートの重ね表示も", () => {
    expect(rule(".scene-next,\n.scene-skip")).toMatch(/min-height: 2\.75rem;/);
    expect(rule(".scene-actions")).toContain("env(safe-area-inset-bottom)");
    expect(rule(".kotonoha-complete-overlay")).toContain("env(safe-area-inset-bottom)");
    expect(rule(".scene-tap-area")).toMatch(/min-height: [\d.]+rem;/);
  });

  it("吹き出しのアニメは opacity だけで、動きを減らす設定では止まる。背の低い画面・「大」では、場面を小さくする", () => {
    const motion = css.slice(css.indexOf("@keyframes scene-bubble-in"), css.indexOf(".scene-tap-area"));
    expect(motion).toContain("opacity");
    expect(motion).not.toMatch(/(top|left|width|height|margin)\s*:/);
    expect(motion).toMatch(/prefers-reduced-motion: reduce[^}]*\{[^}]*animation: none;/);
    expect(css).toMatch(/@media \(max-height: 700px\) \{\s*\.kotonoha-scene:not\(\.has-bubble\) \{/);
    expect(css).toMatch(/html\[data-text-size="large"\] \.kotonoha-scene:not\(\.has-bubble\) \{/);
  });
});

