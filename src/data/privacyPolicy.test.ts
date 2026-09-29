import { readFileSync } from "node:fs";
// 画面が読み込むのと同じ経路(vite.config.ts のプラグインが、運営者向けメモを取り除く)
import publicPolicy from "../../docs/PRIVACY_POLICY.md?public";
import { describe, expect, it } from "vitest";
import {
  bodyHasRuby,
  groupPolicy,
  parsePolicy,
  privacyPolicySections,
  stripOperatorNotes,
} from "./privacyPolicy";
import { PRIVACY_READINGS, addPrivacyRuby } from "./privacyRuby";
import { keepsRuby } from "./rubyPolicy";

const source = readFileSync("docs/PRIVACY_POLICY.md", "utf-8");

describe("プライバシーポリシーの表示データ", () => {
  it("末尾の「運営者向けメモ」の節は、画面のデータに含めない(ファイル自体には、そのまま残っている)", () => {
    expect(source).toContain("運営者向けメモ");
    const shown = JSON.stringify(privacyPolicySections);
    expect(shown).not.toContain("運営者向けメモ");
    expect(shown).not.toContain("法的な確認について");
    expect(stripOperatorNotes(source)).not.toContain("運営者向けメモ");
  });

  it("公開用に読み込んだ文章には、運営者向けメモの節が、そもそも入っていない(公開するJSに、内部メモを残さない)", () => {
    expect(publicPolicy).not.toContain("運営者向けメモ");
    expect(publicPolicy).not.toContain("法律の専門家の確認は受けていません");
    expect(publicPolicy).toContain("第10条(お問い合わせ)");
  });

  it("冒頭の「かんたんに言うと」と、第1条〜第10条が、別の節になっている", () => {
    const kinds = privacyPolicySections.map((s) => s.kind);
    expect(kinds[0]).toBe("title");
    expect(kinds[1]).toBe("summary");
    expect(privacyPolicySections[1].heading).toBe("かんたんに言うと");
    const articles = privacyPolicySections.filter((s) => s.kind === "article").map((s) => s.heading!);
    expect(articles).toHaveLength(10);
    articles.forEach((heading, i) => expect(heading.startsWith(`第${i + 1}条`), heading).toBe(true));
    // 最後は、見出しのない日付・運営者の行
    expect(privacyPolicySections[privacyPolicySections.length - 1].kind).toBe("plain");
  });

  it("「かんたんに言うと」は5つの箇条書きと、「以下は…」の一文からなる", () => {
    const summary = privacyPolicySections.find((s) => s.kind === "summary")!;
    const list = summary.blocks.find((b) => b.type === "ul");
    expect(list && list.type === "ul" ? list.items : []).toHaveLength(5);
    expect(JSON.stringify(summary.blocks)).toContain("以下は、正式な取り扱いの内容です。");
  });

  it("表(2つ)・番号つきの項目・箇条書き・太字の記法を読み取る", () => {
    const blocks = parsePolicy(source);
    const tables = blocks.filter((b) => b.type === "table");
    expect(tables).toHaveLength(2);
    if (tables[0].type === "table") {
      expect(tables[0].header).toEqual(["情報", "内容"]);
      expect(tables[0].rows.map((r) => r[0])).toEqual(["ニックネーム", "アイコン", "得点", "更新時刻"]);
    }
    expect(blocks.some((b) => b.type === "ol")).toBe(true);
    expect(blocks.some((b) => b.type === "ul")).toBe(true);
    expect(JSON.stringify(blocks)).toContain("**同一のクラスコード");
  });

  it("小さな入力でも動く(見出し・段落・区切り線・メモの切り取り)", () => {
    const blocks = parsePolicy("# T\n\n段落1\n段落2\n\n---\n\n## 第1条\n\n- a\n- b\n\n## (運営者向けメモ:x)\n\n消える");
    expect(blocks).toEqual([
      { type: "h1", text: "T" },
      { type: "p", lines: ["段落1", "段落2"] },
      { type: "hr" },
      { type: "h2", text: "第1条" },
      { type: "ul", items: ["a", "b"] },
    ]);
    expect(groupPolicy(blocks).map((s) => s.kind)).toEqual(["title", "article"]);
  });
});

describe("ふりがなを付ける範囲", () => {
  it("「かんたんに言うと」・第4条・第7条の本文には付け、条文の本文全体には付けない", () => {
    const ruby = (heading: string) => bodyHasRuby(privacyPolicySections.find((s) => s.heading?.startsWith(heading))!);
    expect(ruby("かんたんに言うと")).toBe(true);
    expect(ruby("第4条")).toBe(true);
    expect(ruby("第7条")).toBe(true);
    for (const h of ["第1条", "第2条", "第3条", "第5条", "第6条", "第8条", "第9条", "第10条"]) expect(ruby(h), h).toBe(false);
  });

  it("辞書の語には、漢字[ふりがな] を付ける(長い語を優先)", () => {
    expect(addPrivacyRuby("ニックネームには、本名や学校名など")).toBe("ニックネームには、本名[ほんみょう]や学校名など");
    expect(addPrivacyRuby("適用範囲と第三者と未成年者")).toBe("適用範囲[てきようはんい]と第三者[だいさんしゃ]と未成年者[みせいねんしゃ]");
  });

  it("辞書の語は、すべて、システム文のふりがなの方針(HARD_WORDS)で残る語になっている", () => {
    for (const [word] of PRIVACY_READINGS) expect(keepsRuby(word), word).toBe(true);
  });
});
