import { describe, expect, it, vi } from "vitest";
import {
  UPDATE_CHECK_MIN_INTERVAL_MS,
  createUpdateReloader,
  isSafeToReload,
  shouldCheckForUpdate,
} from "./appUpdate";

describe("更新の反映: 読み込み直してよい画面", () => {
  it("途中経過のない画面(タイトル・エリア選択・ステージ選択)だけ", () => {
    for (const name of ["title", "areaSelect", "stageSelect"]) expect(isSafeToReload(name), name).toBe(true);
  });

  it("出題中・会話中・コードの発行/入力中・設定などは、読み込み直さない", () => {
    for (const name of ["stage", "story", "freePractice", "reviewPractice", "transferIssue", "transferRestore", "settings", "ranking", "endingResult", "credits", "zukan"]) {
      expect(isSafeToReload(name), name).toBe(false);
    }
  });
});

describe("createUpdateReloader", () => {
  it("新しい版に入れ替わったとき、安全な画面にいれば、すぐ1度だけ読み込み直す", () => {
    const reload = vi.fn();
    const r = createUpdateReloader({ getScreenName: () => "title", reload });
    r.markUpdateReady();
    r.onScreenChange();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("出題中に入れ替わっても読み込み直さず、安全な画面に戻ったときに読み込み直す", () => {
    const reload = vi.fn();
    let screen = "stage";
    const r = createUpdateReloader({ getScreenName: () => screen, reload });
    r.markUpdateReady();
    expect(reload).not.toHaveBeenCalled();
    screen = "story";
    r.onScreenChange();
    expect(reload).not.toHaveBeenCalled();
    screen = "stageSelect";
    r.onScreenChange();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("入れ替わりがなければ、安全な画面でも読み込み直さない", () => {
    const reload = vi.fn();
    const r = createUpdateReloader({ getScreenName: () => "title", reload });
    r.onScreenChange();
    expect(reload).not.toHaveBeenCalled();
  });
});

describe("shouldCheckForUpdate", () => {
  it("前回の確認から5分たつまでは、確認しない", () => {
    expect(shouldCheckForUpdate(null, 1000)).toBe(true);
    expect(shouldCheckForUpdate(1000, 1000 + UPDATE_CHECK_MIN_INTERVAL_MS - 1)).toBe(false);
    expect(shouldCheckForUpdate(1000, 1000 + UPDATE_CHECK_MIN_INTERVAL_MS)).toBe(true);
  });
});
