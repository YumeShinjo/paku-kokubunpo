import { describe, expect, it } from "vitest";
import type { Screen } from "@/app/store/navigationStore";
import {
  buildAreaEntryScreen,
  buildEndingReplayScreen,
  buildPostClearScreen,
  buildStageEntryScreen,
} from "./storyFlow";

const never = () => false;

/** 入れ子の遷移先を、表示される順のイベントid+最終画面に展開する */
function unfold(screen: Screen): { events: string[]; end: Screen } {
  const events: string[] = [];
  let current = screen;
  while (current.name === "story") {
    events.push(current.eventId);
    current = current.next;
  }
  return { events, end: current };
}

describe("buildAreaEntryScreen", () => {
  it("未視聴の導入ストーリーがあればstory画面でラップする", () => {
    const screen = buildAreaEntryScreen("prologue", never);
    expect(screen).toEqual({
      name: "story",
      eventId: "prologue-intro",
      next: { name: "stageSelect", areaId: "prologue" },
    });
  });

  it("視聴済みならstory画面を挟まずステージ選択へ直行する", () => {
    expect(buildAreaEntryScreen("prologue", () => true)).toEqual({
      name: "stageSelect",
      areaId: "prologue",
    });
  });

  it("イベントデータが存在しないareaIdではラップしない", () => {
    expect(buildAreaEntryScreen("no-such-area", never)).toEqual({
      name: "stageSelect",
      areaId: "no-such-area",
    });
  });
});

describe("buildStageEntryScreen(ラスボス前・小ボス前のストーリー)", () => {
  const lastBoss = { id: "ohzaNoMa-lastboss", type: "lastBoss" as const };

  it("ラスボスに初めて挑むときは、ラスボス前のストーリーを挟んでからステージへ進む", () => {
    expect(buildStageEntryScreen({ areaId: "ohzaNoMa", stage: lastBoss, hasSeen: never })).toEqual({
      name: "story",
      eventId: "ohzaNoMa-lastboss-intro",
      next: { name: "stage", areaId: "ohzaNoMa", stageId: "ohzaNoMa-lastboss" },
    });
  });

  it("視聴済みなら、そのままステージへ進む(再挑戦のたびに流さない)", () => {
    expect(
      buildStageEntryScreen({ areaId: "ohzaNoMa", stage: lastBoss, hasSeen: () => true }),
    ).toEqual({ name: "stage", areaId: "ohzaNoMa", stageId: "ohzaNoMa-lastboss" });
  });

  it("通常ステージの前には何も挟まない", () => {
    expect(
      buildStageEntryScreen({
        areaId: "ohzaNoMa",
        stage: { id: "ohzaNoMa-x", type: "normal" },
        hasSeen: never,
      }),
    ).toEqual({ name: "stage", areaId: "ohzaNoMa", stageId: "ohzaNoMa-x" });
  });

  describe("小ボス戦の前(取り憑かれて乱れた台詞)", () => {
    const subBoss = { id: "kotobaNoIchiba-subboss", type: "subBoss" as const };

    it("初めて挑むときは、戦闘前のストーリーを挟んでから、ステージ(戦闘開始の画面)へ進む", () => {
      expect(buildStageEntryScreen({ areaId: "kotobaNoIchiba", stage: subBoss, hasSeen: never })).toEqual({
        name: "story",
        eventId: "kotobaNoIchiba-subboss-intro",
        next: { name: "stage", areaId: "kotobaNoIchiba", stageId: "kotobaNoIchiba-subboss" },
      });
    });

    it("視聴済みなら、そのままステージへ進む(再挑戦のたびに流さない)", () => {
      expect(buildStageEntryScreen({ areaId: "kotobaNoIchiba", stage: subBoss, hasSeen: () => true })).toEqual({
        name: "stage",
        areaId: "kotobaNoIchiba",
        stageId: "kotobaNoIchiba-subboss",
      });
    });

    it("撃破後は、戦闘前の台詞ではなく、浄化されたあとの台詞(subboss-clear)だけが流れる", () => {
      const { events } = unfold(
        buildPostClearScreen({ areaId: "kotobaNoIchiba", stageType: "subBoss", justClearedArea: false, hasSeen: never }),
      );
      expect(events).toContain("kotobaNoIchiba-subboss-clear");
      expect(events).not.toContain("kotobaNoIchiba-subboss-intro");
    });
  });
});

describe("buildPostClearScreen", () => {
  it("通常ステージ・エリア未クリアならステージ選択に直行する", () => {
    expect(
      buildPostClearScreen({
        areaId: "kotobaNoIchiba",
        stageType: "normal",
        justClearedArea: false,
        hasSeen: never,
      }),
    ).toEqual({ name: "stageSelect", areaId: "kotobaNoIchiba" });
  });

  it("小ボス撃破かつエリアクリア時は、小ボス撃破ストーリー→エリアクリアストーリー→ステージ選択の順", () => {
    const { events, end } = unfold(
      buildPostClearScreen({
        areaId: "kotobaNoIchiba",
        stageType: "subBoss",
        justClearedArea: true,
        hasSeen: never,
      }),
    );
    expect(events).toEqual(["kotobaNoIchiba-subboss-clear", "kotobaNoIchiba-area-clear"]);
    expect(end).toEqual({ name: "stageSelect", areaId: "kotobaNoIchiba" });
  });

  it("視聴済みのストーリーは挟まない", () => {
    const seen = new Set(["kotobaNoIchiba-subboss-clear"]);
    const { events } = unfold(
      buildPostClearScreen({
        areaId: "kotobaNoIchiba",
        stageType: "subBoss",
        justClearedArea: true,
        hasSeen: (id) => seen.has(id),
      }),
    );
    expect(events).toEqual(["kotobaNoIchiba-area-clear"]);
  });

  it("序章のように小ボスがいないエリアでは、エリアクリアのみ挟む", () => {
    const { events } = unfold(
      buildPostClearScreen({
        areaId: "prologue",
        stageType: "normal",
        justClearedArea: true,
        hasSeen: never,
      }),
    );
    expect(events).toEqual(["prologue-area-clear"]);
  });

  describe("王座の間(複数フェーズ)", () => {
    it("宰相(小ボス)撃破: 小ボス撃破→真相究明の順で、エリアクリアにはならない(ラスボスが残っている)", () => {
      const { events, end } = unfold(
        buildPostClearScreen({
          areaId: "ohzaNoMa",
          stageType: "subBoss",
          justClearedArea: false,
          hasSeen: never,
        }),
      );
      expect(events).toEqual(["ohzaNoMa-subboss-clear", "ohzaNoMa-truth"]);
      expect(end).toEqual({ name: "stageSelect", areaId: "ohzaNoMa" });
    });

    it("ラスボス撃破: 撃破後→エンディング分岐→宰相の追加台詞→共通の締め→称号授与→クレジット→ステージ選択の順", () => {
      const { events, end } = unfold(
        buildPostClearScreen({
          areaId: "ohzaNoMa",
          stageType: "lastBoss",
          justClearedArea: true,
          hasSeen: never,
        }),
      );
      expect(events).toEqual([
        "ohzaNoMa-lastboss-clear",
        "ohzaNoMa-ending-choice",
        "ohzaNoMa-epilogue",
        "ohzaNoMa-area-clear",
      ]);
      // ストーリーのあとは、専用画面(称号授与→クレジット)を経てステージ選択へ
      expect(end.name).toBe("endingResult");
      const credits = (end as Extract<Screen, { name: "endingResult" }>).next;
      expect(credits).toMatchObject({ name: "credits", ending: true, areaId: "ohzaNoMa" });
      expect((credits as Extract<Screen, { name: "credits" }>).next).toEqual({
        name: "stageSelect",
        areaId: "ohzaNoMa",
      });
    });

    it("称号授与・クレジットを見終えた(視聴済み)なら、ラスボスに再挑戦しても繰り返さない", () => {
      const seen = new Set(["ohzaNoMa-ending-result", "ohzaNoMa-credits"]);
      const { end } = unfold(
        buildPostClearScreen({
          areaId: "ohzaNoMa",
          stageType: "lastBoss",
          justClearedArea: true,
          hasSeen: (id) => seen.has(id),
        }),
      );
      expect(end).toEqual({ name: "stageSelect", areaId: "ohzaNoMa" });
    });

    it("称号授与だけ見て中断した場合は、クレジットから再開する", () => {
      const seen = new Set(["ohzaNoMa-ending-result"]);
      const { end } = unfold(
        buildPostClearScreen({
          areaId: "ohzaNoMa",
          stageType: "lastBoss",
          justClearedArea: true,
          hasSeen: (id) => seen.has(id),
        }),
      );
      expect(end).toMatchObject({ name: "credits", ending: true });
    });

    it("称号授与・クレジットはラスボス撃破のときだけ(小ボス・通常ステージでは挟まない)", () => {
      for (const stageType of ["normal", "subBoss"] as const) {
        const { end } = unfold(
          buildPostClearScreen({ areaId: "ohzaNoMa", stageType, justClearedArea: false, hasSeen: never }),
        );
        expect(end).toEqual({ name: "stageSelect", areaId: "ohzaNoMa" });
      }
    });

    it("小ボス撃破の演出は、小ボスの真相究明の前に、ラスボス撃破の演出はラスボスのときだけ流れる", () => {
      const sub = unfold(
        buildPostClearScreen({ areaId: "ohzaNoMa", stageType: "subBoss", justClearedArea: false, hasSeen: never }),
      ).events;
      const last = unfold(
        buildPostClearScreen({ areaId: "ohzaNoMa", stageType: "lastBoss", justClearedArea: true, hasSeen: never }),
      ).events;
      expect(sub).not.toContain("ohzaNoMa-lastboss-clear");
      expect(last).not.toContain("ohzaNoMa-subboss-clear");
      expect(last).not.toContain("ohzaNoMa-truth");
    });

    it("通常ステージが未クリアでも、ラスボス撃破のエンディングには共通の締めまで含まれる", () => {
      const { events } = unfold(
        buildPostClearScreen({
          areaId: "ohzaNoMa",
          stageType: "lastBoss",
          justClearedArea: false,
          hasSeen: never,
        }),
      );
      expect(events[events.length - 1]).toBe("ohzaNoMa-area-clear");
    });

    it("共通の締めを見たあとで通常ステージをクリアしてエリアクリアになっても、締めは繰り返さない", () => {
      const { events } = unfold(
        buildPostClearScreen({
          areaId: "ohzaNoMa",
          stageType: "normal",
          justClearedArea: true,
          hasSeen: (id) => id === "ohzaNoMa-area-clear",
        }),
      );
      expect(events).toEqual([]);
    });

    it("視聴済みの途中フェーズは飛ばして、続きから流れる(エンディング分岐の選択後に中断した場合など)", () => {
      const seen = new Set(["ohzaNoMa-lastboss-clear", "ohzaNoMa-ending-choice"]);
      const { events } = unfold(
        buildPostClearScreen({
          areaId: "ohzaNoMa",
          stageType: "lastBoss",
          justClearedArea: true,
          hasSeen: (id) => seen.has(id),
        }),
      );
      expect(events).toEqual(["ohzaNoMa-epilogue", "ohzaNoMa-area-clear"]);
    });
  });
});

describe("buildEndingReplayScreen(エンディングの見返し)", () => {
  const zukan: Screen = { name: "zukan" };

  it("視聴済みかどうかに関わらず、撃破後→エンディング分岐→後日談→共通の締めを流し、称号授与を経て戻り先へ進む", () => {
    const { events, end } = unfold(buildEndingReplayScreen("ohzaNoMa", zukan));
    expect(events).toEqual([
      "ohzaNoMa-lastboss-clear",
      "ohzaNoMa-ending-choice",
      "ohzaNoMa-epilogue",
      "ohzaNoMa-area-clear",
    ]);
    expect(end).toEqual({ name: "endingResult", areaId: "ohzaNoMa", next: zukan });
  });

  it("クレジットは挟まない(見返しのたびに流れない)", () => {
    const { end } = unfold(buildEndingReplayScreen("ohzaNoMa", zukan));
    const next = (end as Extract<Screen, { name: "endingResult" }>).next;
    expect(next.name).toBe("zukan");
  });
});
