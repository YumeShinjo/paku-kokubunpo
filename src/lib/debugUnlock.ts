import { useSyncExternalStore } from "react";

/**
 * 隠しデバッグモード「全解放」(開発・確認用。ふつうのプレイヤーには見つからない)。
 * オンのあいだ、画面を出すときの「解放済みか」の判定だけを、すべて「解放済み」に見せる(features/debug/unlockView.ts)。
 * 進行データ(星・称号・得点・クリア状況・図鑑・言の葉の森の状態)は、書き換えない。スイッチを切れば、本当の進行状況にもどる。
 *
 * 切り替え: 設定の `v0.0.1` を、2秒以内に5回タップすると出る「デバッグ項目」の「全解放」のスイッチ。
 *          URLに `?debug=unlock`(オン)/ `?debug=lock`(オフ)を付けて開いても、切り替えられる(ホーム画面から起動すると、URLは渡せないので、5回タップが基本)。
 * 保存: localStorage の `paku-kokubunpo-debug:unlock`。キーが「paku-kokubunpo:」で始まらないので、「データを初期化する」では消えない。
 *       進行データのキー(paku-kokubunpo:progress など)とは、別。引き継ぎコードにも、入らない(コードは、本当の進行データだけを対象にする)。
 */
export const DEBUG_UNLOCK_KEY = "paku-kokubunpo-debug:unlock";

let on: boolean | null = null;
const listeners = new Set<() => void>();

function readSaved(): boolean {
  try {
    return window.localStorage.getItem(DEBUG_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSaved(value: boolean): void {
  try {
    if (value) window.localStorage.setItem(DEBUG_UNLOCK_KEY, "1");
    else window.localStorage.removeItem(DEBUG_UNLOCK_KEY);
  } catch {
    // 保存できなくても、その回のあいだは、切り替えられる
  }
}

function urlValue(): "unlock" | "lock" | null {
  try {
    const value = new URLSearchParams(window.location.search).get("debug");
    return value === "unlock" || value === "lock" ? value : null;
  } catch {
    return null;
  }
}

function current(): boolean {
  if (on !== null) return on;
  if (typeof window === "undefined") return (on = false);
  const flag = urlValue();
  let value = readSaved();
  if (flag === "unlock") {
    value = true;
    writeSaved(true);
  } else if (flag === "lock") {
    value = false;
    writeSaved(false);
  }
  return (on = value);
}

/** いま、全解放がオンか */
export function isDebugUnlocked(): boolean {
  return current();
}

/** 全解放を切り替える(端末に保存する) */
export function setDebugUnlock(value: boolean): void {
  if (current() === value) return;
  writeSaved(value);
  on = value;
  listeners.forEach((l) => l());
}

export function subscribeDebugUnlock(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 画面の中で使う版(切り替えたとき、画面が更新される) */
export function useDebugUnlock(): boolean {
  return useSyncExternalStore(subscribeDebugUnlock, isDebugUnlocked, () => false);
}

/** テスト用: 状態を初期化する(value を渡すと、保存せずに、その状態から始める) */
export function resetDebugUnlockForTest(value?: boolean): void {
  listeners.clear();
  try {
    window.localStorage.removeItem(DEBUG_UNLOCK_KEY);
  } catch {
    // 無視
  }
  on = value === undefined ? null : value;
}

// アプリを開いた時点で、URLの debug=unlock / lock を読んで、保存する
if (typeof window !== "undefined") current();
