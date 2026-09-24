import { containsNgWord } from "./ngWords";

/**
 * ランキング参加時の入力(クラスコード・ニックネーム)の検証(8章)。
 * サーバー側(firestore.rules)でも形式の最低限の検査をするが、やさしい日本語のエラーを返すためにここでも検証する。
 */

export const CLASS_CODE_MIN = 2;
export const CLASS_CODE_MAX = 20;
export const NICKNAME_MAX = 12;

export type Validation = { ok: true; value: string } | { ok: false; message: string };

const length = (text: string) => Array.from(text).length;

/** 制御文字(改行・タブ・NULなど)を含むか */
const hasControlChar = (text: string) =>
  Array.from(text).some((c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f);

/** クラスコードの正規化: 全角半角をそろえ、前後の空白を除き、英字は小文字にする(「ABC」と「abc」を同じクラスにする) */
export function normalizeClassCode(input: string): string {
  return input.normalize("NFKC").trim().toLowerCase();
}

/**
 * クラスコード(先生が自由に決める短い合言葉)。文字・数字・ハイフン・アンダーバーだけを使える。
 * (FirestoreのドキュメントIDとして使うため、スラッシュやピリオドなどは使えない)
 */
export function validateClassCode(input: string): Validation {
  const code = normalizeClassCode(input);
  const len = length(code);
  if (len < CLASS_CODE_MIN) return { ok: false, message: `クラスコードは${CLASS_CODE_MIN}文字[もじ]以上[いじょう]で入[い]れてね。` };
  if (len > CLASS_CODE_MAX) return { ok: false, message: `クラスコードは${CLASS_CODE_MAX}文字[もじ]以内[いない]にしてね。` };
  if (!/^[\p{L}\p{N}_-]+$/u.test(code) || code.startsWith("__")) {
    return { ok: false, message: "クラスコードには、文字[もじ]・数字[すうじ]・「-」「_」だけ使[つか]えるよ。" };
  }
  return { ok: true, value: code };
}

/** ニックネーム: 1〜12文字。不適切な語を含むものは使えない。 */
export function validateNickname(input: string): Validation {
  const name = input.normalize("NFKC").trim().replace(/\s+/g, " ");
  const len = length(name);
  if (len < 1) return { ok: false, message: "ニックネームを入[い]れてね。" };
  if (len > NICKNAME_MAX) return { ok: false, message: `ニックネームは${NICKNAME_MAX}文字[もじ]以内[いない]にしてね。` };
  if (hasControlChar(name)) return { ok: false, message: "ニックネームに使[つか]えない文字[もじ]があるよ。" };
  if (containsNgWord(name)) {
    return { ok: false, message: "そのニックネームは使[つか]えないよ。別[べつ]の名前[なまえ]にしてね。" };
  }
  return { ok: true, value: name };
}

/**
 * 共有用のURL(例: https://…/?class=合言葉)から、クラスコードの入力欄の初期値を受け取る。
 * 発表会などで、URLやQRコードを配るだけで、みんなが同じクラスに入れるようにするため(入力の手間とミスを減らす)。
 */
export function readClassCodeFromUrl(search: string): string {
  try {
    return new URLSearchParams(search).get("class") ?? "";
  } catch {
    return "";
  }
}
