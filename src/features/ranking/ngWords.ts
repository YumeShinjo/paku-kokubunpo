/**
 * ニックネームのNGワード判定(8章)。「一般的な不適切語のリスト + 簡単な判定」。
 * 完全な検出はできない(表記の揺れ・当て字はすり抜ける)ので、あくまで目に余るものを弾く簡易チェック。
 * ランキングはクラスコードの同じグループ内にしか見えない設計(見知らぬ人に公開しない)ことで補う。
 *
 * 判定は「正規化したニックネーム」に対して行う:
 *   全角半角をそろえる(NFKC)・小文字化・カタカナをひらがなに・記号や空白や長音を取り除く。
 * リストは2種類:
 *  - 含んでいたらNG(substring): 単独で不適切とはっきり言える、長めの語
 *  - 全体が一致したらNG(exact): 「かすみ」の「かす」のように、名前の一部に自然に入りうる短い語
 * 語を足したいときは、下の配列に1つ足すだけでよい(ひらがなで書く。漢字・英字はそのまま)。
 */

/** 正規化: NFKC・小文字・カタカナ→ひらがな・文字と数字以外(記号・空白・長音)を除く */
export function normalizeForNgCheck(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[^\p{L}\p{N}]/gu, "");
}

/** 含んでいたらNG */
const NG_SUBSTRINGS = [
  // 暴力・自傷をあおる
  "ころす",
  "ころして",
  "殺す",
  "殺し",
  "殺せ",
  "死ね",
  "しねよ",
  "くたばれ",
  "じさつ",
  "自殺",
  // 性的
  "ちんこ",
  "ちんぽ",
  "まんこ",
  "せっくす",
  "おっぱい",
  "えろい",
  "ふぇら",
  "ぽるの",
  // 罵倒・差別
  "ばかやろう",
  "きちがい",
  "きちげえ",
  "つんぼ",
  "めくら",
  "かたわ",
  "ちゃんころ",
  "がいじ",
  "しょうがいしゃ",
  // 汚い言葉
  "うんこ",
  "うんち",
  "くそやろう",
  "くそが",
  // 英語
  "fuck",
  "shit",
  "bitch",
  "porn",
  "nazi",
  "dick",
  "pussy",
  "rape",
  "kill",
  "suicide",
];

/** 全体が一致したらNG(名前の一部になりうる短い語) */
const NG_EXACT = [
  "しね",
  "死",
  "ばか",
  "あほ",
  "まぬけ",
  "ぼけ",
  "かす",
  "くず",
  "ごみ",
  "くそ",
  "ぶす",
  "でぶ",
  "はげ",
  "きもい",
  "きもす",
  "うざい",
  "えろ",
  "ちん",
  "まん",
  "ちんちん",
  "sex",
  "ass",
  "fu",
  "wtf",
];

const substringWords = NG_SUBSTRINGS.map(normalizeForNgCheck);
const exactWords = new Set(NG_EXACT.map(normalizeForNgCheck));

/** ニックネームが不適切な語を含んでいるか */
export function containsNgWord(nickname: string): boolean {
  const normalized = normalizeForNgCheck(nickname);
  if (normalized === "") return false;
  if (exactWords.has(normalized)) return true;
  return substringWords.some((word) => word !== "" && normalized.includes(word));
}
