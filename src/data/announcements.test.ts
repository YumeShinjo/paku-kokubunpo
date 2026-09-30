import { describe, expect, it } from "vitest";
import { announcements, formatAnnouncementDate } from "./announcements";
import { hasUnseenAnnouncement } from "@/app/store/announcementStore";

const plain = (text: string) => text.replace(/\[[^\]]*\]/g, "");

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

  it("2026-09-30 の更新の内容(問題の増量・敬語の修正・立ち絵・コトの表情)が入っている", () => {
    const today = announcements.find((a) => a.id === "2026-09-30")!;
    const text = today.body.map(plain);
    expect(text).toEqual([
      "問題を増やしました(224問から392画面)",
      "敬語の問題の一部を、わかりやすく直しました",
      "立ち絵の位置と大きさを見直しました",
      "コトの表情が増えました(コンボ、苦手問題)",
    ]);
  });

  it("プライバシーポリシーのお知らせが、新しいものとして先頭にある(本文は、指定された文章のとおり)", () => {
    const first = announcements[0];
    expect(first.id).toBe("2026-09-30-privacy");
    expect(first.date).toBe("2026-09-30");
    expect(plain(first.title)).toBe("プライバシーポリシーを追加しました");
    expect(first.body.map(plain)).toEqual([
      "このアプリが、どんな情報を、何のために保存するかを、まとめたページを追加しました。タイトル画面と設定画面の「プライバシーポリシー」から、読めます。ランキングでは、ニックネームに本名や学校名を入れないようにしてください。",
    ]);
    // 本名など、方針で残る語のふりがなが付いている
    expect(first.body[0]).toContain("本名[ほんみょう]");
  });

  it("日付は「2026年9月30日」の形で表示する", () => {
    expect(formatAnnouncementDate("2026-09-30")).toBe("2026年9月30日");
  });
});

describe("hasUnseenAnnouncement", () => {
  it("見ていないお知らせがあれば true、すべて見ていれば false", () => {
    expect(hasUnseenAnnouncement([])).toBe(true);
    expect(hasUnseenAnnouncement(announcements.map((a) => a.id))).toBe(false);
    expect(hasUnseenAnnouncement(["古いお知らせ"])).toBe(true);
    // すでに「2026-09-30 の更新」だけを見た端末には、新しいお知らせがあるので、NEW が出る
    expect(hasUnseenAnnouncement(["2026-09-30"])).toBe(true);
  });
});
