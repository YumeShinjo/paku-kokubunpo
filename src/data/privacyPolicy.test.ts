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

  it("「かんたんに言うと」は6つの箇条書きと、「以下は…」の一文からなる", () => {
    const summary = privacyPolicySections.find((s) => s.kind === "summary")!;
    const list = summary.blocks.find((b) => b.type === "ul");
    expect(list && list.type === "ul" ? list.items : []).toHaveLength(6); // 6つ目が、お問い合わせフォームの案内
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
      { type: "ul", items: [{ text: "a", children: [] }, { text: "b", children: [] }] },
    ]);
    expect(groupPolicy(blocks).map((s) => s.kind)).toEqual(["title", "article"]);
  });

  it("字下げした「- 」は、直前の項目の下位の項目になる。親のない字下げや、どれにも当たらない行でも、止まらない", () => {
    expect(parsePolicy("- 親1\n  - 子1\n  - 子2\n- 親2")).toEqual([
      {
        type: "ul",
        items: [
          { text: "親1", children: ["子1", "子2"] },
          { text: "親2", children: [] },
        ],
      },
    ]);
    expect(parsePolicy("  - 親のない字下げ")).toEqual([{ type: "ul", items: [{ text: "親のない字下げ", children: [] }] }]);
    expect(parsePolicy("1. 番号\n  - 子")).toEqual([{ type: "ol", items: [{ text: "番号", children: ["子"] }] }]);
    expect(parsePolicy("|")).toHaveLength(1);
  });
});

describe("第2条の追記(端末に保存する情報・端末の機能の利用)", () => {
  const article2 = () => privacyPolicySections.find((s) => s.heading?.startsWith("第2条"))!;
  const listItems = (heading: string) => {
    const blocks = article2().blocks;
    const start = blocks.findIndex((b) => b.type === "h3" && b.text.startsWith(heading));
    const list = blocks.slice(start).find((b) => b.type === "ul");
    return list && list.type === "ul" ? list.items : [];
  };

  it("端末に保存する情報の一覧: 正誤の記録を加え、匿名認証の情報・キャッシュ・退避コピーの3項目が末尾に足されている", () => {
    const texts = listItems("1. 利用者の端末に保存する情報").map((i) => i.text);
    expect(texts).toContain("出題履歴、単元ごとの直近の正誤の記録、苦手問題(復習対象として記録された問題)の情報");
    expect(texts.slice(-4)).toEqual([
      "お知らせの閲覧状況",
      "匿名認証の情報(匿名IDおよび認証情報。ブラウザのIndexedDBに保存されます)",
      "オフラインで利用するための、アプリ本体(プログラム、画像、音声)のキャッシュ(個人を識別できる情報は含みません)",
      "保存内容が破損した場合に備えた、保存データの退避コピー(「データを初期化」で削除されます)",
    ]);
  });

  it("一覧の直前の文は、匿名認証の情報だけ第2項(3)のとおりと断り、サーバーへ送信されない情報を、第2項(1)(2)を除いて書いている", () => {
    const blocks = article2().blocks;
    const start = blocks.findIndex((b) => b.type === "h3" && b.text.startsWith("1. 利用者の端末に保存する情報"));
    const lead = blocks[start + 1];
    expect(lead.type === "p" ? lead.lines.join("") : "").toBe(
      "次の情報は、利用者が使用するブラウザ(端末)内に保存されます。このうち、匿名認証の情報は、第2項(3)のとおり、Firebase Authenticationにより発行されるものです。その他の情報は、運営者のサーバーには送信されません。ただし、第2項(1)および(2)に定める情報は除きます。",
    );
  });

  it("「3. 端末の機能の利用」の項がある: カメラとクリップボード(入れ子の項目)と、引き継ぎコードの注意", () => {
    const items = listItems("3. 端末の機能の利用");
    expect(items).toHaveLength(2);
    expect(items[0].text).toBe("本アプリは、データの引き継ぎ機能において、次のとおり、端末の機能を利用します。");
    expect(items[0].children).toEqual([
      "QRコードの読み取りのために、端末のカメラを利用します。カメラの映像は、端末内で処理され、保存も送信もされません。",
      "引き継ぎコードの発行時に、端末のクリップボードに、コードを書き込みます。",
    ]);
    expect(items[1].text).toBe(
      "引き継ぎコードには、進み具合に関する情報が含まれます。ニックネームおよび匿名IDは、含まれません。引き継ぎコードは、他人に見せないでください。",
    );
  });

  it("追記した項は、第2条の中(第3条の前)にあり、運営者向けメモには入っていない", () => {
    const headings = article2().blocks.filter((b) => b.type === "h3").map((b) => (b.type === "h3" ? b.text : ""));
    expect(headings).toEqual(["1. 利用者の端末に保存する情報", "2. サーバーに保存する情報", "3. 端末の機能の利用"]);
    expect(publicPolicy).not.toContain("運営者向けメモ");
  });
});

describe("第10条(お問い合わせ)と、関連する条文", () => {
  const article = (heading: string) => privacyPolicySections.find((s) => s.heading?.startsWith(heading))!;
  const textOf = (heading: string) => JSON.stringify(article(heading).blocks);
  const FORM = "https://forms.gle/dtyC4R6VM1JJMpEs9";

  it("第10条: フォームのURL・送信される情報・本名などを入れない注意・Googleのサービス・1年以内の削除・個別のデータを特定できない旨の6項目", () => {
    const blocks = article("第10条").blocks;
    const list = blocks.find((b) => b.type === "ol");
    expect(list && list.type === "ol" ? list.items : []).toHaveLength(6);
    const text = textOf("第10条");
    expect(text).toContain(FORM);
    for (const phrase of [
      "お問い合わせの内容、画面の名称、機器の種類、および任意で入力された連絡先",
      "本名、学校名、住所、電話番号を入力しないでください",
      "連絡先は、返信が必要な場合に限り、入力してください",
      "Google LLC が提供するサービスです",
      "Google のサーバーに保存されます",
      "対応が完了した日から1年以内に削除します",
      "利用者を特定できる情報を取得していません",
      "データを初期化",
    ]) {
      expect(text, phrase).toContain(phrase);
    }
    expect(text).not.toContain("準備中");
  });

  it("第10条には、運営者の名前(Yume Shinjo)を書かない(「運営者」とだけ書く)。ほかの条にある運営者名は、そのまま", () => {
    expect(textOf("第10条")).not.toContain("Yume Shinjo");
    expect(textOf("第10条")).toContain("運営者");
    expect(textOf("第1条")).toContain("Yume Shinjo");
    expect(source).toContain("運営者:Yume Shinjo");
  });

  it("第7条は変えない。第10条(6)は、第7条2項の削除のご依頼を指していて、「個別に特定して削除できない場合がある」と矛盾なく書いてある", () => {
    const seventh = textOf("第7条");
    expect(seventh).toContain("サーバー上の累計正解数および匿名IDは、削除されません");
    expect(seventh).toContain("第10条のお問い合わせ先にご連絡ください");
    expect(textOf("第10条")).toContain("(第7条第2項)");
  });

  it("第5条3: 「外部との通信はFirebaseのみ」は、アプリ本体の通信のこと。お問い合わせフォーム(Googleフォーム)は別のサービスだとわかる", () => {
    const text = textOf("第5条");
    expect(text).toContain("本アプリ本体は、Firebase Hosting、Authentication、Cloud Firestore 以外の外部サービスとの通信を、行いません");
    expect(text).toContain("第10条のお問い合わせフォームは、本アプリとは別のサービス(Googleフォーム)");
  });

  it("第2条: 連絡先を取得しないという記述に、お問い合わせフォームで任意に入力された連絡先は別、という例外がある。第3条の利用目的にも、お問い合わせへの対応がある", () => {
    expect(textOf("第2条")).toContain("第10条のお問い合わせフォームにおいて、利用者が任意で入力した連絡先は、この限りではありません");
    expect(textOf("第3条")).toContain("お問い合わせへの対応のため");
  });

  it("「かんたんに言うと」に、お問い合わせフォームから連絡できること・本名や学校名を書かないことの1つがある(生徒向けのやさしい言葉)", () => {
    const text = JSON.stringify(privacyPolicySections.find((s) => s.kind === "summary")!.blocks);
    expect(text).toContain("お問い合わせフォームから連絡できます。本名や学校名は、書かないでください。");
    expect(text).toContain("連絡先は、返事がほしいときだけ書いてください");
  });

  it("運営者向けメモ(公開しない)に、お問い合わせ先(フォームのURL・回答は1年以内に削除)の項目がある", () => {
    const withNotes = source;
    expect(withNotes).toContain("お問い合わせフォーム(第10条)");
    expect(withNotes).toContain(FORM);
    expect(withNotes).toContain("対応が完了した日から1年以内");
    expect(publicPolicy).not.toContain("お問い合わせフォーム(第10条)"); // メモは、公開用には入らない
    expect(withNotes).not.toContain("お問い合わせ先を、Google フォームなどで用意したら");
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
