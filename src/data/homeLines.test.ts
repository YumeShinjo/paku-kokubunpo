import { describe, expect, it } from "vitest";
import {
  LEAF_TOTAL,
  MANY_STARS,
  SLEEPY_OK,
  STATUS_LINES,
  TAP_LINES,
  homeLinePlain,
  homeLineText,
  nextTapLine,
  statusLine,
  type HomeStatus,
} from "./homeLines";

const FORBIDDEN = ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"];
const base: HomeStatus = { starCount: 0, prologueCleared: true, forestUnlocked: true, leafCount: 0 };
const status = (patch: Partial<HomeStatus>) => statusLine({ ...base, ...patch });

describe("ホームの状況の一言(上から順に判定して、最初に当てはまるものを使う)", () => {
  it("1. 苦手な問題(星)が残っている → 一言1。ほかの条件(序章・葉)より優先", () => {
    expect(status({ starCount: 1 }).id).toBe("status-stars");
    expect(status({ starCount: 4 }).id).toBe("status-stars");
    expect(status({ starCount: MANY_STARS }).id).toBe("status-stars-many"); // 同じ文。表情だけ違う(眠そう)
    expect(status({ starCount: 2, prologueCleared: false, forestUnlocked: false }).id).toBe("status-stars");
    expect(status({ starCount: 2, leafCount: 80 }).id).toBe("status-stars");
    expect(STATUS_LINES.stars.text).toBe("苦手な問題が残ってるよ。いっしょにやっつけよう!");
    expect(STATUS_LINES.starsMany.text).toBe(STATUS_LINES.stars.text);
  });

  it("2. 序章が未クリア(はじめて) → 一言2", () => {
    expect(status({ prologueCleared: false, forestUnlocked: false }).text).toBe("まずは「はじめる」から。いっしょにことばを集めよう!");
  });

  it("3. 言の葉の森が解放済みで、葉が0枚 → 一言3", () => {
    expect(status({ leafCount: 0 }).text).toBe("言の葉の森にも行ってみない?ユライが待ってるよ");
  });

  it("4. 葉が1枚以上80枚未満 → 一言4。5. 葉が80枚 → 一言5", () => {
    expect(status({ leafCount: 1 }).id).toBe("status-leaves");
    expect(status({ leafCount: 79 }).id).toBe("status-leaves");
    expect(status({ leafCount: LEAF_TOTAL }).id).toBe("status-leaves-all");
    expect(status({ leafCount: LEAF_TOTAL }).text).toBe("言の葉の森の葉っぱ、ぜんぶそろったね!");
  });

  it("6. それ以外(言の葉の森が未解放でも、序章が終わっていないとは限らない状態など)→ 一言6", () => {
    expect(status({ forestUnlocked: false }).text).toBe("今日は、どのことばを集める?");
  });

  it("{n} は、80 − 集めた枚数。「あと1枚」〜「あと79枚」", () => {
    expect(homeLinePlain(STATUS_LINES.leaves, 1)).toBe("言の葉の森の葉っぱ、あと79枚でぜんぶそろうよ!");
    expect(homeLinePlain(STATUS_LINES.leaves, 12)).toBe("言の葉の森の葉っぱ、あと68枚でぜんぶそろうよ!");
    expect(homeLinePlain(STATUS_LINES.leaves, 79)).toBe("言の葉の森の葉っぱ、あと1枚でぜんぶそろうよ!");
    expect(homeLinePlain(STATUS_LINES.leaves, 200)).toContain("あと0枚"); // 万一、多くても、マイナスにならない
  });
});

describe("コトをタップしたときの一言", () => {
  it("8つの一言がある(文は、依頼のとおり)", () => {
    expect(TAP_LINES.map((l) => l.text)).toEqual([
      "ん?呼んだ?",
      "えへへ、くすぐったいよ!",
      "今日も、ことばをいっぱい食べようね",
      "ふんふん♪ ことばって、おいしいよね",
      "わたしのこの葉っぱ、コトノ葉っていうんだよ",
      "いっしょにがんばろうね!",
      "ちょっと休憩する?",
      "文法って、パズルみたいで楽しいよね",
    ]);
  });

  it("直前と同じ一言は、連続で出ない(どの乱数でも)。8つとも、出る", () => {
    const seen = new Set<string>();
    for (const previous of [undefined, ...TAP_LINES.map((l) => l.id)]) {
      for (let i = 0; i < 100; i++) {
        const next = nextTapLine(previous, () => i / 100);
        if (previous) expect(next.id).not.toBe(previous);
        seen.add(next.id);
      }
    }
    expect(seen.size).toBe(TAP_LINES.length);
    expect(nextTapLine("tap-call", () => 0.9999).id).not.toBe("tap-call");
  });

  it("続けてタップしても、同じ一言が2回続かない", () => {
    let previous: string | undefined;
    for (let i = 0; i < 500; i++) {
      const line = nextTapLine(previous);
      expect(line.id).not.toBe(previous);
      previous = line.id;
    }
  });
});

describe("一言の文字と表情", () => {
  const all = [...Object.values(STATUS_LINES), ...TAP_LINES];

  it("どの一言も、40字以内(葉の数が最大のとき=あと79枚も含む)。禁止語・絵文字が出ない", () => {
    for (const line of all) {
      for (const leaves of [0, 1, 79, 80]) {
        const text = homeLinePlain(line, leaves);
        expect([...text].length, text).toBeLessThanOrEqual(40);
        for (const word of FORBIDDEN) expect(text, `${line.id}: ${word}`).not.toContain(word);
        expect(text, line.id).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });

  it("画面に出す文は、ふりがなを付けても、文字は変わらない。「葉」「言の葉の森」には、ふりがなの記法が付く", () => {
    for (const line of all) expect(homeLineText(line, 12).replace(/\[[^\]]*\]/g, ""), line.id).toBe(homeLinePlain(line, 12));
    expect(homeLineText(STATUS_LINES.forestNew, 0)).toContain("言[こと]の葉[は]の森[もり]");
    expect(homeLineText(TAP_LINES.find((l) => l.id === "tap-leaf")!, 0)).toContain("葉[は]");
  });

  it("一言ごとの表情は、依頼の対応どおり(1つの定義)。使う表情は、通常・コンボ・ハングリー・眠そうだけ", () => {
    const sleepy = SLEEPY_OK ? "sleepy" : undefined;
    const sleepyStatus = SLEEPY_OK ? "sleepy" : "hungry";
    expect(Object.fromEntries(Object.values(STATUS_LINES).map((l) => [l.id, l.expression]))).toEqual({
      "status-stars": "hungry", // 苦手な問題が1〜4問
      "status-stars-many": sleepyStatus, // 5問以上(眠そうが使えないときは、ハングリー)
      "status-first": undefined,
      "status-forest-new": undefined,
      "status-leaves": "combo",
      "status-leaves-all": "combo",
      "status-usual": undefined,
    });
    expect(Object.fromEntries(TAP_LINES.map((l) => [l.id, l.expression]))).toEqual({
      "tap-call": undefined,
      "tap-tickle": "combo",
      "tap-eat": "hungry",
      "tap-hum": undefined,
      "tap-leaf": undefined,
      "tap-together": "combo",
      "tap-rest": sleepy, // 眠そうが使えないときは、通常
      "tap-puzzle": undefined,
    });
    for (const line of all) expect([undefined, "combo", "hungry", "sleepy"], line.id).toContain(line.expression);
    for (const banned of ["surprised", "happy", "eating", "sad"]) {
      expect(all.map((l) => l.expression), banned).not.toContain(banned);
    }
  });

  it("眠そうは、成長アクセサリーの全段階で、腕輪・ブローチなどの位置を、スクリーンショットで確かめて、使っている(SLEEPY_OK)", () => {
    expect(SLEEPY_OK).toBe(true);
  });
});
