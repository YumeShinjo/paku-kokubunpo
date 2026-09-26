import { describe, expect, it } from "vitest";
import type { AssemblyQuestion, ChoiceQuestion, SortingQuestion } from "@/data/schema";
import { buildStageIntro } from "./stageIntro";

const t = (text: string) => [{ text }];
const choice: ChoiceQuestion = {
  id: "c",
  unit: "u",
  engine: "choice",
  prompt: t("問題"),
  choices: [{ id: "a", text: t("a") }],
  correctChoiceId: "a",
};
const assembly: AssemblyQuestion = {
  id: "a",
  unit: "u",
  engine: "assembly",
  mode: "fillBlank",
  instruction: t("穴埋め"),
  sentenceTemplate: [{ text: "書" }, { text: "___" }],
  cards: [{ id: "x", text: t("く") }],
  correctOrder: ["x"],
};
const sorting: SortingQuestion = {
  id: "s",
  unit: "u",
  engine: "sorting",
  instruction: t("仕分け"),
  categories: [{ id: "c1", label: t("動詞") }],
  items: [{ id: "i1", text: t("走る"), correctCategoryId: "c1" }],
};
const text = (parts: { text: string }[]) => parts.map((p) => p.text).join("");

describe("ステージ冒頭の説明(buildStageIntro)", () => {
  it("ボス戦は、出題形式に紐づけず、ボス戦専用の対決の文言を使う(「お手伝い」の文言を出さない)", () => {
    const boss = { label: "小ボス", title: "テスト", type: "subBoss" as const };
    const intro = buildStageIntro("kotobaNoIchiba", [choice, sorting], boss, t("ステージ名"))!;
    expect(text(intro.title)).toContain("小ボス");
    expect(text(intro.message)).toMatch(/ボス|ライフ/);
    expect(text(intro.message)).not.toContain("手伝");
    // ラスボスは、ラスボス用の文言
    const last = buildStageIntro("ohzaNoMa", [choice], { ...boss, label: "ラスボス", type: "lastBoss" }, undefined)!;
    expect(text(last.message)).not.toBe(text(intro.message));
  });

  it("通常ステージで出題形式が1つなら、その形式の呼び名と場面を使う", () => {
    const intro = buildStageIntro("prologue", [choice, choice], undefined, t("ステージ名"))!;
    expect(text(intro.title)).toContain("心得");
  });

  it("通常ステージで出題形式が混ざるときは、個別の形式名ではなく、ステージ全体のテーマ名を使う", () => {
    const intro = buildStageIntro("tsunagiNoHashi", [choice, assembly], undefined, t("つなぎの橋"))!;
    expect(text(intro.title)).toBe("つなぎの橋");
    expect(text(intro.title)).not.toContain("番人");
    expect(text(intro.title)).not.toContain("橋板");
  });
});
