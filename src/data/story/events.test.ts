import { describe, expect, it } from "vitest";
import { getStoryEvent, storyEvents } from "./events";
import {
  areaClearStoryId,
  endingChoiceStoryId,
  epilogueStoryId,
  introStoryId,
  lastBossClearStoryId,
  lastBossIntroStoryId,
  subBossClearStoryId,
  subBossIntroStoryId,
  truthStoryId,
} from "@/features/story/storyIds";
import { areas } from "@/data/areas";

const plain = (event: { lines: { text: { text: string }[] }[] }) =>
  event.lines.map((l) => l.text.map((s) => s.text).join(""));

/** STORY.md に登場する発話者(ナレーションは speaker なし) */
const KNOWN_SPEAKERS = [
  "コト",
  "コレット",
  "メイ",
  "レル",
  "オンヴィン",
  "ジョゼット",
  "ネジラルド",
  "サイラス",
  "ニジュヴェール",
  "王(乱れに飲まれた姿)",
  "ヴェルバルト",
];

describe("ストーリーイベント(全エリア)", () => {
  it("全エリアに、導入とエリアクリアのストーリーがある", () => {
    for (const area of areas) {
      for (const id of [introStoryId(area.id), areaClearStoryId(area.id)]) {
        const event = getStoryEvent(id);
        expect(event, `${id} が存在しない`).toBeDefined();
        expect(event!.lines.length).toBeGreaterThan(0);
      }
    }
  });

  it("小ボスを持つエリアには、小ボス戦の前・撃破後のストーリーがあり、序章にはない", () => {
    for (const area of areas.filter((a) => a.subBoss)) {
      expect(getStoryEvent(subBossIntroStoryId(area.id)), `${area.id} の戦闘前`).toBeDefined();
      expect(getStoryEvent(subBossClearStoryId(area.id)), `${area.id} の撃破後`).toBeDefined();
    }
    expect(getStoryEvent(subBossIntroStoryId("prologue"))).toBeUndefined();
    expect(getStoryEvent(subBossClearStoryId("prologue"))).toBeUndefined();
  });

  it("戦闘前は小ボス本人の(取り憑かれて乱れた)台詞だけ。撃破後は、その乱れが晴れたあとの台詞から始まる", () => {
    for (const area of areas.filter((a) => a.subBossName)) {
      const intro = getStoryEvent(subBossIntroStoryId(area.id))!;
      expect(intro.lines.length, area.id).toBeGreaterThan(0);
      for (const line of intro.lines) expect(line.speaker, area.id).toBe(area.subBossName);
      const clear = getStoryEvent(subBossClearStoryId(area.id))!;
      // 戦闘前の台詞が、撃破後に重複して残っていない
      const introTexts = new Set(plain(intro));
      for (const text of plain(clear)) expect(introTexts.has(text), `${area.id}: ${text}`).toBe(false);
    }
  });

  it("イベントidは重複しない", () => {
    const ids = storyEvents.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("存在しないidはundefinedを返す", () => {
    expect(getStoryEvent("no-such-event")).toBeUndefined();
  });

  it("発話者名は STORY.md のキャラクター名に統一されている(仮の「相棒」表記は残っていない)", () => {
    const speakers = new Set(
      storyEvents.flatMap((e) => e.lines.map((l) => l.speaker)).filter((s) => s !== undefined),
    );
    for (const speaker of speakers) {
      expect(KNOWN_SPEAKERS, `未知の発話者 ${speaker}`).toContain(speaker);
    }
    expect(speakers.has("相棒")).toBe(false);
  });

  it("小ボスの撃破ストーリーの発話者は、そのエリアの小ボス名になっている", () => {
    for (const area of areas.filter((a) => a.subBossName)) {
      const event = getStoryEvent(subBossClearStoryId(area.id))!;
      const speakers = new Set(event.lines.map((l) => l.speaker));
      expect(speakers.has(area.subBossName), `${area.id} に ${area.subBossName} の台詞がない`).toBe(true);
    }
  });

  it("コトが話す行は立ち絵(マスコット)を出す", () => {
    for (const event of storyEvents) {
      for (const line of event.lines) {
        if (line.speaker === "コト") expect(line.showMascot, event.id).toBe(true);
      }
    }
  });
});

describe("表記の統一", () => {
  it("エリア名・場所の表記は「王座の間」で統一されている(「玉座」の表記ゆれがない)", () => {
    const all = storyEvents.flatMap((e) => e.lines.map((l) => l.text.map((s) => s.text).join("")));
    for (const text of all) expect(text).not.toContain("玉座");
    expect(all.some((t) => t.includes("王座の間"))).toBe(true);
  });

  it("エリア名を含むストーリーの台詞は、areas.ts の正式名称と一致している", () => {
    const names = areas.map((a) => a.name);
    expect(names).toContain("王座の間");
  });
});

describe("STORY.md の台詞の反映(抜粋の照合)", () => {
  it("序章導入は10行(記憶がないこと・ことだま使いの説明)で、最初の行はナレーション、最後は主人公がうなずくナレーション", () => {
    const event = getStoryEvent(introStoryId("prologue"))!;
    expect(event.lines).toHaveLength(10);
    expect(event.lines[0].speaker).toBeUndefined();
    expect(plain(event)[0]).toBe("目を覚ますと、そこは見知らぬ草原だった。");
    const texts = plain(event);
    expect(texts[3]).toBe("主人公は、静かに首を横に振った。");
    expect(event.lines[3].speaker).toBeUndefined();
    expect(texts.some((t) => t.includes("ことだま使いっていうのはね"))).toBe(true);
    expect(texts[9]).toBe("主人公は、小さくうなずいた。");
    expect(event.lines[9].speaker).toBeUndefined();
    // 主人公は喋らない: 台詞はコトだけ、あとはナレーション
    for (const line of event.lines) expect([undefined, "コト"]).toContain(line.speaker);
  });

  it("絆の間の導入に、黒幕・王様への伏線(陛下の御前に誰も通されない)の1行がある", () => {
    const texts = plain(getStoryEvent(introStoryId("kizunaNoMa"))!);
    expect(texts.some((t) => t.includes("陛下の御前に、誰も通されない"))).toBe(true);
    expect(texts.at(-1)).toContain("きな臭いね");
  });

  it("宰相の撃破後に、乱れを招いた告白(3行)が、正体判明の台詞「あなた様こそ」の直前にある", () => {
    const event = getStoryEvent(subBossClearStoryId("ohzaNoMa"))!;
    const texts = plain(event);
    const reveal = texts.findIndex((t) => t.includes("あなた様こそ"));
    expect(reveal).toBeGreaterThan(0);
    expect(texts[reveal - 3]).toContain("この乱れを、王座に招き入れたのは、わたくしです");
    expect(texts[reveal - 2]).toContain("正しい言葉を、誰よりも守ろうとしました");
    expect(texts[reveal - 1]).toContain("執着そのものが、乱れにつけ込まれておりました");
    for (const i of [reveal - 3, reveal - 2, reveal - 1]) expect(event.lines[i].speaker).toBe("ニジュヴェール");
  });

  it("王様の浄化後に、コレットがたぬきの姿になっていた理由(ヴェルバルト3行+コレット1行)が、分岐の前にある", () => {
    const event = getStoryEvent(lastBossClearStoryId("ohzaNoMa"))!;
    const texts = plain(event);
    const at = texts.findIndex((t) => t.includes("思い出した。乱れが王座に忍び込んだあの日"));
    expect(at).toBeGreaterThan(0);
    expect(event.lines.slice(at, at + 3).map((l) => l.speaker)).toEqual(["ヴェルバルト", "ヴェルバルト", "ヴェルバルト"]);
    expect(texts[at + 1]).toContain("化け狸の姿を宿すもの");
    expect(texts[at + 2]).toContain("すまない、気づいてやれなかった");
    expect(event.lines[at + 3].speaker).toBe("コレット");
    expect(texts[at + 3]).toContain("思い出せた");
    // 「お父さん?」のあと、王様が静かに問いかけて分岐へ進む前に置かれている
    expect(texts.findIndex((t) => t.includes("お父さん"))).toBeLessThan(at);
    expect(texts.findIndex((t) => t.includes("静かに問いかける"))).toBeGreaterThan(at + 3);
  });

  it("序章のエリアクリアは、ナレーション→コトの台詞(ユーザー提供の文面)", () => {
    const event = getStoryEvent(areaClearStoryId("prologue"))!;
    expect(plain(event)).toEqual([
      "はじめてのことだまの力を、主人公はしっかりと示した。",
      "やったね!この調子で、みんなを助けに行こっか!",
    ]);
    expect(event.lines[0].speaker).toBeUndefined();
    expect(event.lines[1].speaker).toBe("コト");
  });

  it("鍛冶場の小ボス撃破(既視感①)は、炎を見つめて動かなくなる間の演出を含む", () => {
    const texts = plain(getStoryEvent(subBossClearStoryId("sugatakaeNoKajiba"))!);
    expect(texts.some((t) => t.includes("少しの間、動かなかった"))).toBe(true);
  });

  it("橋の小ボス撃破(既視感②)は、妙に丁寧に扱われて落ち着かない演出を含む", () => {
    const texts = plain(getStoryEvent(subBossClearStoryId("tsunagiNoHashi"))!);
    expect(texts.some((t) => t.includes("妙に丁寧に扱われて"))).toBe(true);
  });

  it("既視感の演出は、戦闘前の台詞には入らず、撃破後(浄化された台詞のあと)の位置に残っている", () => {
    for (const [areaId, marker] of [
      ["sugatakaeNoKajiba", "少しの間、動かなかった"],
      ["tsunagiNoHashi", "妙に丁寧に扱われて"],
    ] as const) {
      const intro = plain(getStoryEvent(subBossIntroStoryId(areaId))!);
      const clear = plain(getStoryEvent(subBossClearStoryId(areaId))!);
      expect(intro.some((t) => t.includes(marker)), `${areaId} の戦闘前`).toBe(false);
      const at = clear.findIndex((t) => t.includes(marker));
      expect(at, `${areaId} の撃破後`).toBeGreaterThan(0); // 浄化された台詞のあとに来る
      // その行はコトの様子(マスコットの立ち絵つき)
      expect(getStoryEvent(subBossClearStoryId(areaId))!.lines[at].showMascot).toBe(true);
    }
  });

  it("既視感の演出は2回だけ(鍛冶場と橋)で、他の小ボス撃破後にはない", () => {
    const dejaVu = ["少しの間、動かなかった", "妙に丁寧に扱われて"];
    const withDejaVu = areas
      .filter((a) => a.subBoss)
      .filter((a) =>
        plain(getStoryEvent(subBossClearStoryId(a.id))!).some((t) => dejaVu.some((d) => t.includes(d))),
      )
      .map((a) => a.id);
    expect(withDejaVu).toEqual(["sugatakaeNoKajiba", "tsunagiNoHashi"]);
  });
});

describe("王座の間のフェーズ別イベント", () => {
  const A = "ohzaNoMa";

  it("小ボス撃破→真相究明→ラスボス前→ラスボス撃破後→エンディング分岐→追加台詞→共通の締めのイベントがそろっている", () => {
    for (const id of [
      subBossClearStoryId(A),
      truthStoryId(A),
      lastBossIntroStoryId(A),
      lastBossClearStoryId(A),
      endingChoiceStoryId(A),
      epilogueStoryId(A),
      areaClearStoryId(A),
    ]) {
      expect(getStoryEvent(id), `${id} がない`).toBeDefined();
    }
  });

  it("宰相撃破でコトが淡く光り始め、ラスボス撃破後に本来の姿になる(2章の変身のタイミング)", () => {
    const glow = getStoryEvent(subBossClearStoryId(A))!.lines.filter((l) => l.mascotForm === "glow");
    expect(glow.length).toBeGreaterThan(0);
    const trueForm = getStoryEvent(lastBossClearStoryId(A))!.lines.filter((l) => l.mascotForm === "true");
    expect(trueForm.length).toBeGreaterThan(0);
    // 王座の間より前のエリアでは、光る/本来の姿の演出を使わない
    for (const area of areas.filter((a) => a.id !== A)) {
      for (const id of [introStoryId(area.id), subBossClearStoryId(area.id), areaClearStoryId(area.id)]) {
        const event = getStoryEvent(id);
        expect(event?.lines.some((l) => l.mascotForm), id).toBeFalsy();
      }
    }
  });

  it("エンディング分岐は選択肢を持ち、選択肢は2つ(城に戻る/旅を続ける)で、分岐先のイベントが存在する", () => {
    const event = getStoryEvent(endingChoiceStoryId(A))!;
    expect(event.choice?.options).toHaveLength(2);
    expect(event.choice!.options.map((o) => o.key)).toEqual(["castle", "journey"]);
    for (const option of event.choice!.options) {
      expect(getStoryEvent(option.eventId), option.eventId).toBeDefined();
      expect(option.label.length).toBeGreaterThan(0);
    }
  });

  it("分岐先はどちらも王様(ヴェルバルト)の一言で、それぞれ台詞が異なる", () => {
    const [castle, journey] = getStoryEvent(endingChoiceStoryId(A))!.choice!.options.map(
      (o) => getStoryEvent(o.eventId)!,
    );
    expect(castle.lines[0].speaker).toBe("ヴェルバルト");
    expect(journey.lines[0].speaker).toBe("ヴェルバルト");
    expect(plain(castle)[0]).not.toBe(plain(journey)[0]);
    expect(plain(castle)[0]).toContain("お前の居場所は、ここにもある");
    expect(plain(journey)[0]).toContain("いつでも帰っておいで");
  });

  it("選択肢を持つイベントは、王座の間のエンディング分岐だけ", () => {
    expect(storyEvents.filter((e) => e.choice).map((e) => e.id)).toEqual([endingChoiceStoryId(A)]);
  });

  it("宰相の追加台詞は「変化」と「崩壊」の取り違えに気づく内容で、共通の締めがエンディングの終わり", () => {
    expect(plain(getStoryEvent(epilogueStoryId(A))!)[0]).toContain(
      "変わっていくことと、壊れていくことは、違うのに",
    );
    expect(getStoryEvent(epilogueStoryId(A))!.lines[0].speaker).toBe("ニジュヴェール");
    expect(plain(getStoryEvent(areaClearStoryId(A))!)[0]).toContain(
      "正しい言葉と、賑やかな声が戻ってきた",
    );
  });

  it("ラスボス前は「最後の戦いが始まる。」の1行(STORY.md「真相究明〜ラスボス前」の最後の行)", () => {
    expect(plain(getStoryEvent(lastBossIntroStoryId(A))!)).toEqual(["最後の戦いが始まる。"]);
  });

  it("王座の間の導入では宰相が二重敬語で話す(乱れ方の表現)", () => {
    const texts = plain(getStoryEvent(introStoryId(A))!);
    expect(texts.some((t) => t.includes("いらっしゃられる"))).toBe(true);
  });
});
