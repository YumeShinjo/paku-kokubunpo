import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useKotonohaStore, hasEnteredForest } from "@/app/store/kotonohaStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { KotonohaScreen } from "@/app/screens/KotonohaScreen";
import { getStagesForArea } from "@/data/stages";
import { getStoryEvent } from "@/data/story/events";
import { limitRuby } from "@/data/rubyPolicy";
import { rb } from "@/data/ruby";
import {
  NAKAMA_READINGS,
  nakamaRuby,
  resolveCharacters,
  ZUKAN_CHARACTERS,
  type UnlockState,
} from "@/data/zukanCharacters";
import { HARD_WORDS } from "@/data/rubyPolicy";
import { IMAGE } from "@/assets/registry";
import { lastBossClearStoryId, subBossClearStoryId, truthStoryId } from "@/features/story/storyIds";
import { NakamaTab } from "./NakamaTab";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync("src/styles/global.css", "utf-8");

const SMALL_BOSS_AREAS = [
  "kotobaNoIchiba",
  "sugatakaeNoKajiba",
  "namerakaNoTaki",
  "tsunagiNoHashi",
  "kizunaNoMa",
  "mikakeNoMa",
  "ohzaNoMa",
];
const SPOILERS = ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"];

/** 見たストーリーの記録 */
const SEEN = {
  /** 宰相撃破前: 小ボス6人(宰相を除く)を撃破 */
  beforeChancellor: SMALL_BOSS_AREAS.slice(0, 6).map(subBossClearStoryId),
  /** 宰相撃破後(真相究明の前) */
  afterChancellor: SMALL_BOSS_AREAS.map(subBossClearStoryId),
  /** 真相究明後(ラスボス撃破前) */
  afterTruth: [...SMALL_BOSS_AREAS.map(subBossClearStoryId), truthStoryId("ohzaNoMa")],
  /** ラスボス撃破後 */
  afterLastBoss: [...SMALL_BOSS_AREAS.map(subBossClearStoryId), truthStoryId("ohzaNoMa"), lastBossClearStoryId("ohzaNoMa")],
};

const stateOf = (seen: string[], enteredForest = false): UnlockState => ({ hasSeen: (id) => seen.includes(id), enteredForest });
const nameOf = (r: ReturnType<typeof resolveCharacters>[number]) => r.version?.name ?? null;

describe("なかまの ずかん: データ", () => {
  it("12行(10枠): コトとコレットは1枠(2版)、王様とヴェルバルトは1枠(2版)。残りは1版", () => {
    expect(ZUKAN_CHARACTERS.map((s) => s.id)).toEqual([
      "koto",
      "mei",
      "reru",
      "onvin",
      "jozetto",
      "nejirarudo",
      "sairasu",
      "nijuveru",
      "lastboss",
      "yurai",
    ]);
    expect(ZUKAN_CHARACTERS.flatMap((s) => s.versions)).toHaveLength(12);
    expect(ZUKAN_CHARACTERS.find((s) => s.id === "koto")!.versions.map((v) => v.name)).toEqual(["コト", "コレット"]);
    expect(ZUKAN_CHARACTERS.find((s) => s.id === "lastboss")!.versions.map((v) => v.name)).toEqual(["王様", "ヴェルバルト"]);
    // 王様の枠だけが、解放されるまで、存在ごと出さない
    expect(ZUKAN_CHARACTERS.filter((s) => s.hiddenUntilUnlocked).map((s) => s.id)).toEqual(["lastboss"]);
  });

  it("役職・持ち場に、括弧内の内部注記は含めない。コト(前)は「主人公の相棒」、コレット(後)は「王女」。「ことだま使い」の語は使わない", () => {
    const koto = ZUKAN_CHARACTERS.find((s) => s.id === "koto")!;
    expect(koto.versions[0].role).toBe("主人公の相棒");
    expect(koto.versions[1].role).toBe("王女");
    const all = JSON.stringify(ZUKAN_CHARACTERS);
    expect(all).not.toContain("ことだま使い");
    for (const v of ZUKAN_CHARACTERS.flatMap((s) => s.versions)) {
      expect(`${v.role ?? ""}${v.place ?? ""}`, v.id).not.toMatch(/[()()]/);
    }
  });

  it("ひとくちが空のキャラクター(コレット・王様・ヴェルバルト)は、ひとくちを持たない。そのほかは持つ", () => {
    const empty = ZUKAN_CHARACTERS.flatMap((s) => s.versions.map((v) => [s.id, v] as const))
      .filter(([, v]) => v.hitokuchi === undefined)
      .map(([id, v]) => `${id}/${v.id}`);
    expect(empty).toEqual(["koto/after", "lastboss/before", "lastboss/after"]);
  });

  it("文中に <br> は残らない(メモは段落の配列)。各キャラクターの文章は、空でない", () => {
    expect(JSON.stringify(ZUKAN_CHARACTERS)).not.toContain("<br>");
    for (const v of ZUKAN_CHARACTERS.flatMap((s) => s.versions)) {
      expect(v.hitokoto.length).toBeGreaterThan(0);
      expect(v.memo.length).toBeGreaterThan(0);
      expect(v.memoBy === "コト" || v.memoBy === "コレット").toBe(true);
    }
  });

  it("キャラクターと素材の対応(立ち絵は、registry の素材名)", () => {
    const image = (slot: string, version = 0) => ZUKAN_CHARACTERS.find((s) => s.id === slot)!.versions[version];
    expect(image("koto", 0).image).toBe("mascot/base");
    expect(image("koto", 1).image).toBe("mascot/true");
    expect(image("mei").image).toBe("boss/subboss-kotobaNoIchiba-purified");
    expect(image("mei").imageBefore).toBe("boss/subboss-kotobaNoIchiba");
    expect(image("nijuveru").image).toBe(IMAGE.subBossPurified("ohzaNoMa"));
    expect(image("lastboss", 0).image).toBe("boss/lastboss-possessed");
    expect(image("lastboss", 1).image).toBe("boss/lastboss-purified");
    expect(image("yurai").image).toBe("kotonoha/yurai");
  });

  it("ジョゼットの台詞: ひとこと・メモ・ひとくちが、本編(events.ts)の「お持ちいたしました」に、そろっている", () => {
    const jozetto = ZUKAN_CHARACTERS.find((s) => s.id === "jozetto")!.versions[0];
    const intro = getStoryEvent("tsunagiNoHashi-subboss-intro")!.lines[0].text.map((s) => s.text).join("");
    expect(jozetto.hitokoto).toBe(intro); // 本編の、取り憑かれた台詞と同じ
    const text = [jozetto.hitokoto, ...jozetto.memo, jozetto.hitokuchi].join("");
    expect(text).toContain("お持ちいたしました");
    expect(text).not.toContain("お持ちしました");
    expect(jozetto.hitokuchi).toBe("×「紅茶、お持ちいたしました」 → ◎「紅茶を、お持ちいたしました」。言葉と言葉のつながりを示す「を」のような言葉が「助詞」。これが抜けると、意味は伝わっても、文として据わりが悪くなる。");
  });
});

describe("なかまの ずかん: 解放(状態ごと)", () => {
  it("最初(何も見ていない): コトだけ解放。ほかは「？？？」。王様の枠は、ない。総数は9", () => {
    const r = resolveCharacters(stateOf([]));
    expect(r).toHaveLength(9);
    expect(r.map(nameOf)).toEqual(["コト", null, null, null, null, null, null, null, null]);
    expect(r.some((c) => c.slot.id === "lastboss")).toBe(false);
  });

  it("小ボスは、撃破後のストーリー(subboss-clear)を見終わると解放される。ユライは、言の葉の森に入場すると解放", () => {
    const r = resolveCharacters(stateOf([subBossClearStoryId("kotobaNoIchiba")]));
    expect(r.map(nameOf).slice(0, 3)).toEqual(["コト", "メイ", null]);
    const forest = resolveCharacters(stateOf([], true));
    expect(forest.find((c) => c.slot.id === "yurai")!.version?.name).toBe("ユライ");
  });

  it("宰相撃破前: ニジュヴェールは「？？？」。王様の枠はなく、総数は9", () => {
    const r = resolveCharacters(stateOf(SEEN.beforeChancellor));
    expect(r).toHaveLength(9);
    expect(r.find((c) => c.slot.id === "nijuveru")!.version).toBeUndefined();
    expect(r.find((c) => c.slot.id === "koto")!.version!.name).toBe("コト");
  });

  it("宰相撃破後(真相究明の前): ニジュヴェールが解放。王様の枠は、まだない(総数は9のまま)", () => {
    const r = resolveCharacters(stateOf(SEEN.afterChancellor));
    expect(r).toHaveLength(9);
    expect(r.find((c) => c.slot.id === "nijuveru")!.version!.name).toBe("ニジュヴェール");
    expect(r.some((c) => c.slot.id === "lastboss")).toBe(false);
  });

  it("真相究明後(ラスボス撃破前): 王様(名前は不明)の枠が現れる(総数は10)。コトは、まだコト", () => {
    const r = resolveCharacters(stateOf(SEEN.afterTruth));
    expect(r).toHaveLength(10);
    const king = r.find((c) => c.slot.id === "lastboss")!.version!;
    expect(king.name).toBe("王様");
    expect(king.nameNote).toBe("名前は不明");
    expect(king.image).toBe(IMAGE.lastBossPossessed);
    expect(r.find((c) => c.slot.id === "koto")!.version!.name).toBe("コト");
  });

  it("ラスボス撃破後: コトがコレット(もとの名は コト)に、王様がヴェルバルトに変わる。どちらも、同じ1枠", () => {
    const r = resolveCharacters(stateOf(SEEN.afterLastBoss));
    expect(r).toHaveLength(10);
    const koto = r.find((c) => c.slot.id === "koto")!.version!;
    expect(koto.name).toBe("コレット");
    expect(koto.nameNote).toBe("もとの名は コト");
    expect(koto.image).toBe(IMAGE.mascotTrue);
    expect(koto.memoBy).toBe("コレット");
    const king = r.find((c) => c.slot.id === "lastboss")!.version!;
    expect(king.name).toBe("ヴェルバルト");
    expect(king.image).toBe(IMAGE.lastBossPurified);
    expect(r.filter((c) => c.version?.name === "コト" || c.version?.name === "王様")).toHaveLength(0);
  });

  it("言の葉の森への入場の記録: 記録がなくても、すでに葉を集めた・まちがえた端末は、入場済み", () => {
    expect(hasEnteredForest({ enteredForest: false, collectedIds: [], missedIds: [] })).toBe(false);
    expect(hasEnteredForest({ enteredForest: true, collectedIds: [], missedIds: [] })).toBe(true);
    expect(hasEnteredForest({ enteredForest: false, collectedIds: ["kotowaza-001"], missedIds: [] })).toBe(true);
    expect(hasEnteredForest({ enteredForest: false, collectedIds: [], missedIds: ["koji-002"] })).toBe(true);
  });
});

describe("なかまの ずかん: ふりがな", () => {
  const shown = (text: string) =>
    limitRuby(rb(nakamaRuby(text)))
      .filter((s) => s.ruby)
      .map((s) => `${s.text}:${s.ruby}`);

  it("文法用語と、難読語(宰相・彷徨・律儀・几帳面・靄など)に、ふりがなが付く", () => {
    expect(shown("宰相さんで、助詞と文節と二重敬語")).toEqual(["宰相:さいしょう", "助詞:じょし", "文節:ぶんせつ", "二重敬語:にじゅうけいご"]);
    expect(shown("城を彷徨っていた")).toEqual(["彷徨:さまよ"]);
    expect(shown("律儀な人。几帳面なところ")).toEqual(["律儀:りちぎ", "几帳面:きちょうめん"]);
    expect(shown("紫の靄をまとって、膝をついて")).toEqual(["靄:もや", "膝:ひざ"]);
    expect(shown("侍女見習い / 鍛冶見習い / 絆の間")).toEqual(["侍女:じじょ", "鍛冶:かじ", "絆:きずな"]);
    expect(shown("一段活用の動詞、五段活用の動詞")).toEqual(["一段活用:いちだんかつよう", "動詞:どうし", "五段活用:ごだんかつよう", "動詞:どうし"]);
  });

  it("「言の葉の森」は言・葉・森にふりがな。「言葉」の「葉」には付けない。常用の漢字には付けない", () => {
    expect(shown("言の葉の森で会った")).toEqual(["言:こと", "葉:は", "森:もり"]);
    expect(shown("言葉は、ちゃんと伝えたい")).toEqual([]);
    expect(shown("和語「言」から")).toEqual(["和語:わご", "言:こと"]);
    expect(shown("コトノ葉、葉っぱ")).toEqual(["葉:は", "葉:は"]);
  });

  it("画面に出す文字は、ふりがなを付けても変わらない。読みを足した語は、ふりがなの方針(HARD_WORDS)に残る", () => {
    const raw = ZUKAN_CHARACTERS.flatMap((s) => s.versions).flatMap((v) => [v.hitokoto, ...v.memo, v.hitokuchi ?? ""]);
    for (const text of raw) {
      expect(rb(nakamaRuby(text)).map((s) => s.text).join(""), text.slice(0, 12)).toBe(text);
    }
    for (const [word] of NAKAMA_READINGS) {
      if (word === "葉") continue; // 「言」「葉」「森」は、言の葉の森の語として HARD_WORDS にある
      expect(HARD_WORDS.has(word), word).toBe(true);
    }
  });
});

describe("なかまの ずかん: 画面", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = () => act(() => root.render(<NakamaTab />));
  const cards = () => [...container.querySelectorAll<HTMLElement>(".nakama-card")];
  const modal = () => document.body.querySelector<HTMLElement>(".nakama-modal");
  const openCard = (name: string) => {
    const card = cards().find((c) => c.getAttribute("aria-label") === name);
    expect(card, name).toBeTruthy();
    act(() => card!.click());
    return modal()!;
  };
  const closeModal = () => act(() => document.body.querySelector<HTMLButtonElement>(".nakama-close")!.click());
  const setSeen = (seen: string[], entered = false) => {
    useStoryStore.setState({ seenStoryIds: seen, choices: {} });
    useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: entered });
  };
  /** 画面にあるすべての文字と、読み上げ・画像の説明になる属性 */
  const everything = () => {
    const nodes = [container, ...(modal() ? [modal()!] : [])];
    const parts: string[] = [];
    for (const node of nodes) {
      parts.push(node.textContent ?? "");
      for (const el of node.querySelectorAll("*")) {
        for (const attr of ["aria-label", "alt", "title", "aria-labelledby", "aria-description"]) {
          const v = el.getAttribute(attr);
          if (v) parts.push(v);
        }
      }
    }
    return parts.join("\n");
  };
  /** 解放済みのすべてのカードを開いて、閉じて、全部の文字を集める */
  const allTextWithDetails = () => {
    const parts = [everything()];
    for (const card of cards().filter((c) => c.tagName === "BUTTON")) {
      act(() => card.click());
      parts.push(everything());
      closeModal();
    }
    return parts.join("\n");
  };

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    setSeen([]);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.body.querySelectorAll(".nakama-overlay").forEach((n) => n.remove());
    setSeen([]);
  });

  it("一覧: 立ち絵の小さなカード。解放前は「？？？」(黒い影。鍵は使わない)。総数は「n / 9」", () => {
    render();
    expect(cards()).toHaveLength(9);
    expect(container.querySelector(".nakama-count")!.textContent).toBe("1 / 9");
    expect(container.querySelector(".nakama-count")!.getAttribute("aria-label")).toBe("であった なかま 1 / 9");
    const locked = cards().filter((c) => c.classList.contains("is-locked"));
    expect(locked).toHaveLength(8);
    for (const c of locked) {
      expect(c.textContent).toBe("？？？");
      expect(c.getAttribute("aria-label")).toBe("まだ であっていない なかま");
      expect(c.querySelector(".is-silhouette")).not.toBeNull();
      expect(c.tagName).not.toBe("BUTTON"); // タップできない
      expect(c.querySelector("img")?.getAttribute("alt") ?? "").toBe("");
    }
    expect(container.querySelector(".lucide-lock")).toBeNull();
    expect(container.querySelector(".lucide-lock-keyhole")).toBeNull();
    const koto = cards()[0];
    expect(koto.tagName).toBe("BUTTON");
    expect(koto.getAttribute("aria-label")).toBe("コト");
  });

  it("王様の枠は、真相究明を見終わるまで、存在ごと出ない(「？？？」も、10も出ない)。見終わると「n / 10」", () => {
    setSeen(SEEN.afterChancellor);
    render();
    expect(cards()).toHaveLength(9);
    expect(container.querySelector(".nakama-count")!.textContent).toBe("8 / 9");
    expect(everything()).not.toMatch(/10/);
    act(() => setSeen(SEEN.afterTruth));
    expect(cards()).toHaveLength(10);
    expect(container.querySelector(".nakama-count")!.textContent).toBe("9 / 10");
    expect(cards().map((c) => c.getAttribute("aria-label"))).toContain("王様");
  });

  it("詳細: 立ち絵・見出し・名前の由来・役職・持ち場・ひとこと(吹き出し)・メモ(語り手のラベル)・ことばの ひとくち", () => {
    setSeen([subBossClearStoryId("kotobaNoIchiba")]);
    render();
    const m = openCard("メイ");
    expect(m.getAttribute("role")).toBe("dialog");
    expect(m.getAttribute("aria-modal")).toBe("true");
    expect(m.querySelector(".nakama-portrait-large img")).not.toBeNull();
    expect(m.querySelector(".nakama-name")!.textContent).toBe("メイ");
    expect(m.querySelector(".nakama-facts")!.textContent).toContain("名前の由来");
    expect(m.querySelector(".nakama-facts")!.textContent).toContain("から"); // 名詞(ふりがな付き)から
    expect(m.querySelector(".nakama-facts")!.textContent).toContain("役職・持ち場");
    expect(m.querySelector(".nakama-facts")!.textContent).toContain("ことばの市場");
    expect(m.querySelector(".nakama-facts")!.textContent).not.toContain("("); // 内部注記は出さない
    expect(m.querySelector(".nakama-bubble")!.textContent).toContain("を10枚");
    expect(m.textContent).toContain("コトのメモ");
    expect(m.querySelectorAll(".nakama-memo p")).toHaveLength(3);
    expect(m.querySelector(".nakama-hitokuchi")!.textContent).toContain("を ください」");
    expect(m.textContent).toContain("ことばの ひとくち");
  });

  it("ひとくちが空のキャラクター(王様)は、「ことばの ひとくち」の欄を出さない", () => {
    setSeen(SEEN.afterTruth);
    render();
    const m = openCard("王様");
    expect(m.querySelector(".nakama-hitokuchi")).toBeNull();
    expect(m.textContent).not.toContain("ことばの ひとくち");
    expect(m.querySelector(".nakama-name")!.textContent).toBe("王様(名前は不明)");
  });

  it("コト → コレット: 同じ1枠。ラスボス撃破後は、見出し「コレット(もとの名は コト)」、役職「王女」、コレットのメモに変わる", () => {
    render();
    let m = openCard("コト");
    expect(m.querySelector(".nakama-name")!.textContent).toBe("コト");
    expect(m.textContent).toContain("主人公の相棒");
    expect(m.textContent).toContain("コトのメモ");
    closeModal();
    act(() => setSeen(SEEN.afterLastBoss));
    expect(cards().map((c) => c.getAttribute("aria-label"))).not.toContain("コト");
    m = openCard("コレット");
    expect(m.querySelector(".nakama-name")!.textContent).toBe("コレット(もとの名は コト)");
    expect(m.textContent).toContain("王女");
    expect(m.textContent).toContain("コレットのメモ");
    expect(m.textContent).not.toContain("ことだま使い");
    expect(m.querySelector(".nakama-view-switch")).toBeNull();
  });

  it("小ボス: 撃破後は浄化後の立ち絵。詳細で、浄化前の立ち絵に切り替えられる", () => {
    setSeen([subBossClearStoryId("tsunagiNoHashi")]);
    render();
    const card = cards().find((c) => c.getAttribute("aria-label") === "ジョゼット")!;
    expect(card.querySelector("img")).not.toBeNull();
    const m = openCard("ジョゼット");
    const buttons = [...m.querySelectorAll<HTMLButtonElement>(".nakama-view-switch button")];
    expect(buttons.map((b) => b.textContent)).toEqual([expect.stringContaining("後"), expect.stringContaining("前")]);
    expect(buttons.every((b) => b.textContent!.includes("浄化"))).toBe(true);
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    const src = () => m.querySelector(".nakama-portrait-large img")?.getAttribute("src");
    const purified = src();
    act(() => buttons[1].click());
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
    expect(src()).not.toBe(purified);
  });

  it("詳細は、とじるボタン・背景のタップ・Escで閉じる。閉じたら、開いたカードに戻る", () => {
    render();
    openCard("コト");
    expect(modal()).not.toBeNull();
    closeModal();
    expect(modal()).toBeNull();
    openCard("コト");
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(modal()).toBeNull();
    openCard("コト");
    act(() => document.body.querySelector<HTMLElement>(".nakama-overlay")!.click());
    expect(modal()).toBeNull();
    expect(document.activeElement).toBe(cards()[0]);
  });

  describe("ネタバレ(解放前の表示に、禁止語が出ない)", () => {
    const cases: [string, string[], string[]][] = [
      // [状態, 見たストーリー, その状態で出てはいけない語]
      ["宰相撃破前", SEEN.beforeChancellor, SPOILERS],
      ["宰相撃破後・真相究明の前", SEEN.afterChancellor, SPOILERS],
      // 真相究明のあとは、王様の枠が現れる(王様の語は出てよい)。ヴェルバルト・コレット・王女・ラスボスは、まだ出ない
      ["真相究明後・ラスボス撃破前", SEEN.afterTruth, ["ラスボス", "ヴェルバルト", "コレット", "王女"]],
      // ラスボス撃破後は、正体が分かるので、ヴェルバルト・コレット・王女が出る。「ラスボス」は、どの状態でも出ない
      ["ラスボス撃破後", SEEN.afterLastBoss, ["ラスボス"]],
    ];
    for (const [label, seen, forbidden] of cases) {
      it(`${label}: 一覧・数字・aria-label・alt・解放済みの詳細すべてに、${forbidden.join("・")} が出ない`, () => {
        setSeen(seen, true);
        render();
        const text = allTextWithDetails();
        for (const word of forbidden) expect(text, word).not.toContain(word);
      });
    }

    it("宰相撃破前・撃破後でも、ユライまで解放した状態で、禁止語(ラスボス・王様・ヴェルバルト・コレット・王女)が出ない", () => {
      for (const seen of [[], SEEN.beforeChancellor, SEEN.afterChancellor]) {
        setSeen(seen, true);
        render();
        const text = allTextWithDetails();
        for (const word of SPOILERS) expect(text, `${word} / ${seen.length}`).not.toContain(word);
      }
    });

    it("何も見ていない状態のタブ名(せいとう・なかま など)にも、禁止語は出ない", () => {
      const labels = readFileSync("src/features/zukan/zukanTabs.ts", "utf-8");
      const tabsBlock = labels.slice(labels.indexOf("export const ZUKAN_TABS"), labels.indexOf("/** 画面を開いたときに出すタブ */"));
      for (const word of SPOILERS) expect(tabsBlock.replace(/\/\/.*$/gm, ""), word).not.toContain(word);
    });

    it("ラスボス撃破後は、コレット・王女・ヴェルバルト・王様が、詳細に出る(解放されたあとは、出てよい)", () => {
      setSeen(SEEN.afterLastBoss, true);
      render();
      const text = allTextWithDetails();
      for (const word of ["コレット", "王女", "ヴェルバルト", "王様"]) expect(text, word).toContain(word);
    });
  });

  it("CSS: ボタンは44px以上。ふりがな付きの文は line-height(ふりがな用の固定値 --ruby-line-height)。動く飾りは transform/opacity のみで、reduced-motion で止まる。余計な操作を奪わない(pointer-events)", () => {
    const rule = (selector: string) => {
      const start = css.indexOf(`\n${selector} {`);
      return start < 0 ? "" : css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
    };
    for (const sel of [".nakama-card", ".nakama-close", ".nakama-view-switch button"]) {
      expect(Number(rule(sel).match(/min-height: ([\d.]+)rem/)?.[1]), sel).toBeGreaterThanOrEqual(2.75);
    }
    expect(rule(".nakama-memo p,\n.nakama-hitokuchi")).toContain("line-height: var(--ruby-line-height);");
    expect(rule(".nakama-bubble")).toContain("line-height: var(--ruby-line-height);");
    expect(rule(".nakama-facts")).toContain("line-height: var(--ruby-line-height);");
    expect(rule(".nakama-overlay")).toContain("env(safe-area-inset-bottom)");
    expect(rule(".nakama-portrait")).toContain("pointer-events: none;");
    const motion = css.slice(css.indexOf("@keyframes nakama-modal-in"), css.indexOf(".nakama-modal-body {"));
    expect(motion).toContain("transform");
    expect(motion).toContain("opacity");
    expect(motion).not.toMatch(/(top|left|width|height|margin)\s*:/);
    expect(motion).toMatch(/prefers-reduced-motion: reduce[^}]*\{[^}]*animation: none;/);
  });
});

describe("言の葉の森への入場の記録", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    useProgressStore.setState({ clearedStageIds: getStagesForArea("prologue").map((s) => s.id) });
    useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: false });
    useNavigationStore.setState({ screen: { name: "kotonoha" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useProgressStore.setState({ clearedStageIds: [] });
    useKotonohaStore.setState({ collectedIds: [], missedIds: [], enteredForest: false });
  });

  it("遊べる状態で、言の葉の森の画面を開くと、入場が記録される(遊べないうちは、記録されない)", () => {
    useProgressStore.setState({ clearedStageIds: [] });
    act(() => root.render(<KotonohaScreen />));
    expect(useKotonohaStore.getState().enteredForest).toBe(false);
    act(() => useProgressStore.setState({ clearedStageIds: getStagesForArea("prologue").map((s) => s.id) }));
    expect(useKotonohaStore.getState().enteredForest).toBe(true);
  });

  it("入場の記録は、言の葉の森の保存データ(paku-kokubunpo:kotonoha)に入る", () => {
    act(() => root.render(<KotonohaScreen />));
    const saved = JSON.parse(localStorage.getItem("paku-kokubunpo:kotonoha")!);
    expect(saved.state.enteredForest).toBe(true);
  });
});
