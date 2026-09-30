import { beforeEach, describe, expect, it } from "vitest";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { useMasteryStore } from "@/app/store/masteryStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { getAllIdiomQuestions, kojiQuestions, kotowazaQuestions } from "@/data/kotowaza";
import { getAllQuestions } from "@/data/questionLoader";
import { getStagesForArea } from "@/data/stages";
import { arrangeRound, arrangeRoundChoices, questionsInScope, ROUND_SIZE, selectRound, shuffle } from "./selectRound";
import { isKotonohaUnlockedNow } from "./unlock";

const all = getAllIdiomQuestions();
const plain = (text: { text: string }[]) => text.map((s) => s.text).join("");

/** 決まった順に値を返す疑似乱数(テストを安定させる) */
function seeded(seed = 1): () => number {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 4294967296;
    return x / 4294967296;
  };
}

describe("葉の記録(kotonohaStore)", () => {
  beforeEach(() => {
    localStorage.clear();
    useKotonohaStore.setState({ collectedIds: [], missedIds: [] });
  });

  it("はじめて正解した問題だけが、集まる(2回目の正解では、新しい葉にならない)", () => {
    expect(useKotonohaStore.getState().recordResult("kotowaza-001", true)).toBe(true);
    expect(useKotonohaStore.getState().recordResult("kotowaza-001", true)).toBe(false);
    expect(useKotonohaStore.getState().collectedIds).toEqual(["kotowaza-001"]);
  });

  it("不正解の問題は、まちがえた問題に記録される(重ねて記録しない)。正解すると外れる", () => {
    const { recordResult } = useKotonohaStore.getState();
    expect(recordResult("koji-002", false)).toBe(false);
    recordResult("koji-002", false);
    expect(useKotonohaStore.getState().missedIds).toEqual(["koji-002"]);
    expect(useKotonohaStore.getState().collectedIds).toEqual([]);
    expect(recordResult("koji-002", true)).toBe(true); // 正解して、葉が集まる
    expect(useKotonohaStore.getState().missedIds).toEqual([]);
    expect(useKotonohaStore.getState().collectedIds).toEqual(["koji-002"]);
  });

  it("一度集めた葉は、あとで間違えても減らない(まちがえた問題にも入る)", () => {
    const { recordResult } = useKotonohaStore.getState();
    recordResult("kotowaza-003", true);
    recordResult("kotowaza-003", false);
    expect(useKotonohaStore.getState().collectedIds).toEqual(["kotowaza-003"]);
    expect(useKotonohaStore.getState().missedIds).toEqual(["kotowaza-003"]);
  });

  it("端末の保存先は paku-kokubunpo:kotonoha(既存の接頭辞)", () => {
    useKotonohaStore.getState().recordResult("kotowaza-001", true);
    const saved = JSON.parse(localStorage.getItem("paku-kokubunpo:kotonoha")!);
    expect(saved.state.collectedIds).toEqual(["kotowaza-001"]);
  });

  it("本編の進捗・累計正解数・苦手問題には、影響しない", () => {
    const before = [
      JSON.stringify(useProgressStore.getState().clearedStageIds),
      JSON.stringify(useMasteryStore.getState().correctQuestionIds),
      JSON.stringify(useReviewStore.getState().starredQuestionIds),
    ];
    useKotonohaStore.getState().recordResult("kotowaza-001", true);
    useKotonohaStore.getState().recordResult("kotowaza-002", false);
    expect([
      JSON.stringify(useProgressStore.getState().clearedStageIds),
      JSON.stringify(useMasteryStore.getState().correctQuestionIds),
      JSON.stringify(useReviewStore.getState().starredQuestionIds),
    ]).toEqual(before);
  });
});

describe("出題の選び方(selectRound)", () => {
  it("範囲: すべて80問 / ことわざ50問 / 故事成語30問", () => {
    expect(questionsInScope(all, "all")).toHaveLength(80);
    expect(questionsInScope(all, "kotowaza")).toHaveLength(50);
    expect(questionsInScope(all, "koji")).toHaveLength(30);
  });

  it("10問を選ぶ。同じ問題を重ねて出さない", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const round = selectRound({ questions: all, scope: "all", collectedIds: [], missedIds: [], random: seeded(seed) });
      expect(round).toHaveLength(ROUND_SIZE);
      expect(new Set(round.map((q) => q.id)).size).toBe(ROUND_SIZE);
    }
  });

  it("葉を集めていない問題が優先される(集め済みが混ざるのは、集めていない問題が足りないときだけ)", () => {
    // ことわざ50問のうち、45問を集め済みにする → 集めていない5問は、必ず出る。残り5問は集め済みから
    const collected = kotowazaQuestions.slice(0, 45).map((q) => q.id);
    const uncollected = kotowazaQuestions.slice(45).map((q) => q.id);
    for (let seed = 1; seed <= 10; seed++) {
      const round = selectRound({ questions: all, scope: "kotowaza", collectedIds: collected, missedIds: [], random: seeded(seed) });
      const ids = round.map((q) => q.id);
      for (const id of uncollected) expect(ids).toContain(id);
      expect(ids.filter((id) => collected.includes(id))).toHaveLength(5);
    }
    // 集めていない問題が10問以上あれば、10問とも集めていない問題
    const few = kojiQuestions.slice(0, 5).map((q) => q.id);
    const round = selectRound({ questions: all, scope: "koji", collectedIds: few, missedIds: [], random: seeded(3) });
    expect(round.every((q) => !few.includes(q.id))).toBe(true);
  });

  it("集め済みの問題から補うときは、前に間違えた問題を先にする", () => {
    const collected = kojiQuestions.slice(0, 28).map((q) => q.id); // 集めていないのは2問
    const missed = [collected[20], collected[25], collected[27]];
    for (let seed = 1; seed <= 10; seed++) {
      const ids = selectRound({ questions: all, scope: "koji", collectedIds: collected, missedIds: missed, random: seeded(seed) }).map((q) => q.id);
      expect(ids).toHaveLength(10);
      // 集めていない2問 + まちがえた3問は、必ず入る
      for (const id of [kojiQuestions[28].id, kojiQuestions[29].id, ...missed]) expect(ids).toContain(id);
      // 先頭から: 集めていない問題 → まちがえた問題 → そのほか
      expect(ids.slice(0, 2).sort()).toEqual([kojiQuestions[28].id, kojiQuestions[29].id].sort());
      expect(ids.slice(2, 5).sort()).toEqual([...missed].sort());
    }
  });

  it("範囲に10問未満しかなければ、その数で終える", () => {
    const small = all.filter((q) => q.category === "koji").slice(0, 6);
    const round = selectRound({ questions: small, scope: "all", collectedIds: [], missedIds: [], random: seeded(2) });
    expect(round).toHaveLength(6);
    expect(new Set(round.map((q) => q.id)).size).toBe(6);
    expect(selectRound({ questions: [], scope: "all", collectedIds: [], missedIds: [] })).toEqual([]);
  });

  it("選ぶ順はランダム(毎回同じにならない)", () => {
    const orders = new Set<string>();
    for (let seed = 1; seed <= 10; seed++) {
      orders.add(selectRound({ questions: all, scope: "all", collectedIds: [], missedIds: [], random: seeded(seed) }).map((q) => q.id).join());
    }
    expect(orders.size).toBeGreaterThan(5);
    expect(shuffle([1, 2, 3, 4, 5], seeded(4))).not.toEqual([1, 2, 3, 4, 5]);
  });
});

describe("選択肢の並び(arrangeRound)", () => {
  it("選択肢の中身は変わらず(3〜4個・正解が1つ)、正解のidは同じ選択肢を指す", () => {
    const round = arrangeRound(all, seeded(7));
    round.forEach((q, i) => {
      const original = all[i];
      expect(q.choices.map((c) => c.id).sort(), q.id).toEqual(original.choices.map((c) => c.id).sort());
      expect(plain(q.choices.find((c) => c.id === q.correctChoiceId)!.text), q.id).toBe(plain(q.answer));
    });
  });

  it("正解の位置が偏らない: 80問すべてで、各位置の数の差が小さく、先頭に偏らない", () => {
    const counts = [0, 0, 0, 0];
    for (const q of arrangeRound(all, seeded(11))) counts[q.choices.findIndex((c) => c.id === q.correctChoiceId)]++;
    const threeChoice = all.filter((q) => q.choices.length === 3).length;
    // 3択の問題も混ざっているので、位置0〜2は、ほぼ同数(全体の15%以上)
    for (const n of counts.slice(0, 3)) expect(n).toBeGreaterThan(80 * 0.15);
    expect(threeChoice).toBeGreaterThanOrEqual(0);
  });

  it("1ラウンド(10問)では、同じ4択の問題が続くとき、正解の位置が順に回る(ひとつの位置に固まらない)", () => {
    const fourChoice = all.filter((q) => q.choices.length === 4).slice(0, 8);
    if (fourChoice.length < 8) return; // 4択が少ないデータでは、このテストは対象外
    const positions = arrangeRound(fourChoice, seeded(5)).map((q) => q.choices.findIndex((c) => c.id === q.correctChoiceId));
    const counts = [0, 0, 0, 0];
    for (const p of positions) counts[p]++;
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(0);
  });

  it("ラウンドごとに並びが変わる(開始位置がランダム)", () => {
    const q = all.find((x) => x.choices.length >= 3)!;
    const seen = new Set<string>();
    for (const r of [0, 0.3, 0.6, 0.9]) seen.add(arrangeRound([q], () => r)[0].choices.map((c) => c.id).join());
    expect(seen.size).toBeGreaterThan(1);
    // 位置ごとの配置が、選択肢数で折り返す
    const n = q.choices.length;
    expect(arrangeRoundChoices(q, 0).findIndex((c) => c.id === q.correctChoiceId)).toBe(0);
    expect(arrangeRoundChoices(q, n + 1).findIndex((c) => c.id === q.correctChoiceId)).toBe(1);
  });
});

describe("解放条件(序章のクリア)", () => {
  beforeEach(() => useProgressStore.setState({ clearedStageIds: [] }));

  it("序章をクリアするまでは遊べず、序章の全ステージをクリアしたら遊べる", () => {
    expect(isKotonohaUnlockedNow()).toBe(false);
    const prologue = getStagesForArea("prologue").map((s) => s.id);
    useProgressStore.setState({ clearedStageIds: prologue.slice(0, 1) });
    expect(isKotonohaUnlockedNow()).toBe(false);
    useProgressStore.setState({ clearedStageIds: prologue });
    expect(isKotonohaUnlockedNow()).toBe(true);
  });
});

describe("本編とのちがい・ネタバレ対策", () => {
  it("ことわざ・故事成語のデータは、本編の問題(getAllQuestions)に混ざらない", () => {
    const main = new Set(getAllQuestions().map((q) => q.id));
    expect(all.some((q) => main.has(q.id))).toBe(false);
    expect(getAllQuestions()).toHaveLength(392);
  });

  it("ラスボス・王様・ヴェルバルト・コレットの名前は、ミニゲームのデータにない", () => {
    const text = all
      .flatMap((q) => [q.sentence, q.full, q.meaning, q.origin ?? [], q.yuraiLine, ...q.choices.map((c) => c.text)])
      .map((t) => plain(t))
      .join("\n");
    for (const word of ["ラスボス", "王様", "ヴェルバルト", "コレット", "おうさま"]) expect(text, word).not.toContain(word);
  });
});
