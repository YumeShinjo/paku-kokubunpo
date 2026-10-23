import { describe, expect, it } from "vitest";
import { announcements, formatAnnouncementDate } from "./announcements";
import { hasUnseenAnnouncement } from "@/app/store/announcementStore";

const plain = (text: string) => text.replace(/\[[^\]]*\]/g, "");
const SPOILERS = ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女", "黒幕", "正体"];

describe("お知らせのデータ", () => {
  it("id は重複せず、日付は YYYY-MM-DD で、新しいものが先頭に並ぶ", () => {
    expect(new Set(announcements.map((a) => a.id)).size).toBe(announcements.length);
    for (const a of announcements) expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const dates = announcements.map((a) => a.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("どのお知らせにも、タイトルと本文(1行以上)がある", () => {
    for (const a of announcements) {
      expect(a.title.length, a.id).toBeGreaterThan(0);
      expect(a.body.length, a.id).toBeGreaterThan(0);
    }
  });

  it("新しいお知らせ7件(2026-10-23〜2026-10-15)が、古いお知らせの上にある", () => {
    expect(announcements.slice(0, 7).map((a) => a.id)).toEqual([
      "2026-10-23-version",
      "2026-10-22-questions",
      "2026-10-22-boss-sound",
      "2026-10-22-others",
      "2026-10-15-assist",
      "2026-10-15-howto-sources",
      "2026-10-15-kotonoha-about",
    ]);
    // 古いお知らせも、残っている(内容は変えず、口調だけをそろえた)
    for (const id of ["2026-10-02-nakama", "2026-10-01-contact", "2026-10-01-kotonoha", "2026-09-30-privacy", "2026-09-30"]) {
      expect(announcements.some((a) => a.id === id), id).toBe(true);
    }
  });

  it("バージョンの表示と「最新の版をたしかめる」のお知らせは、v0.9.0 を添えている", () => {
    const a = announcements[0];
    expect(plain(a.title)).toBe("バージョン表示と「最新の版をたしかめる」を追加しました(v0.9.0)");
    expect(plain(a.body[0])).toContain("「最新の版をたしかめる」を押すと");
  });

  it("見出しは「〜ました」の形で、本文は「です・ます」調。コトの口調(「〜だよ」「〜ね」「〜よう」)や絵文字はない", () => {
    for (const a of announcements) {
      expect(plain(a.title), a.id).toMatch(/ました(\(v[\d.]+\))?$/);
      for (const line of a.body.map(plain)) {
        // 文の終わり(「。」の前と、行の終わり。行の終わりの「(…)」は除く)が、「です・ます」の形
        const sentences = line.split("。").filter((s) => s.length > 0).map((s) => s.replace(/\([^)]*\)$/, ""));
        for (const sentence of sentences) expect(sentence, `${a.id}: ${line}`).toMatch(/(ます|ました|ません|です|でした|ください|ませんか)$/);
        expect(line, a.id).not.toMatch(/(だよ|るよ|たよ|いよ|だね|のね|ですよ|ますよ)(。|!|$)|しよう|おぼえよう|あそぼう|ね。/);
      }
      expect(a.title + a.body.join(), a.id).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it("ネタバレになる語(ラスボス・王様・ヴェルバルト・コレット・王女・黒幕・正体)は、どのお知らせにもない", () => {
    for (const a of announcements) for (const word of SPOILERS) expect(plain(a.title + a.body.join("")), `${a.id}: ${word}`).not.toContain(word);
  });

  it("2026-09-30 の更新の内容(問題の増量・敬語の修正・立ち絵・コトの表情)が入っている", () => {
    const today = announcements.find((a) => a.id === "2026-09-30")!;
    expect(today.body.map(plain)).toEqual([
      "問題を増やしました(224問から392画面)",
      "敬語の問題の一部を、わかりやすく直しました",
      "立ち絵の位置と大きさを見直しました",
      "コトの表情が増えました(コンボ、苦手問題)",
    ]);
  });

  it("言の葉の森のお知らせ(10-01)は、内容を変えず、口調だけを「です・ます」にした。方針で残る語にふりがながある", () => {
    const first = announcements.find((a) => a.id === "2026-10-01-kotonoha")!;
    expect(first.date).toBe("2026-10-01");
    expect(plain(first.title)).toBe("新しい遊びを追加しました");
    expect(first.body.map(plain)).toEqual([
      "『言の葉の森』を追加しました。ことわざや故事成語を、遊びながら覚えられます。『ことばの分かれ道』をクリアすると、遊べます。",
    ]);
    expect(first.body[0]).toContain("言[こと]の葉[は]の森[もり]");
    expect(first.body[0]).toContain("故事成語[こじせいご]");
  });

  it("「なかまの ずかんを追加しました」(10-02)のお知らせが残っている", () => {
    const a = announcements.find((x) => x.id === "2026-10-02-nakama")!;
    expect(plain(a.title)).toBe("なかまの ずかんを追加しました");
    expect(a.body.map(plain)).toEqual(["ことだまの書に「なかまの ずかん」が増えました。出会ったなかまのすがたや、コトのメモを見られます。"]);
  });

  it("「お問い合わせフォームを追加しました」のお知らせも、残っている。本名などのふりがながある", () => {
    const first = announcements.find((a) => a.id === "2026-10-01-contact")!;
    expect(plain(first.title)).toBe("お問い合わせフォームを追加しました");
    expect(first.body.map(plain)).toEqual([
      "困ったことや聞きたいことは、設定画面と、プライバシーポリシー画面の「お問い合わせ」から送れます。本名や学校名は、書かないでください。",
    ]);
    expect(first.body[0]).toContain("本名[ほんみょう]");
  });

  it("プライバシーポリシーのお知らせも、残っている(本文は変えていない)", () => {
    const first = announcements.find((a) => a.id === "2026-09-30-privacy")!;
    expect(first.date).toBe("2026-09-30");
    expect(plain(first.title)).toBe("プライバシーポリシーを追加しました");
    expect(first.body.map(plain)).toEqual([
      "このアプリが、どんな情報を、何のために保存するかを、まとめたページを追加しました。タイトル画面と設定画面の「プライバシーポリシー」から、読めます。ランキングでは、ニックネームに本名や学校名を入れないようにしてください。",
    ]);
    expect(first.body[0]).toContain("本名[ほんみょう]");
  });

  it("日付は「2026年9月30日」の形で表示する。見ていないお知らせがあるあいだは、「NEW」を出す", () => {
    expect(formatAnnouncementDate("2026-09-30")).toBe("2026年9月30日");
    expect(hasUnseenAnnouncement([])).toBe(true);
    expect(hasUnseenAnnouncement(announcements.map((a) => a.id))).toBe(false);
  });
});
