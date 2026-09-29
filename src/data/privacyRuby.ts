/**
 * プライバシーポリシー(docs/PRIVACY_POLICY.md)のふりがな。
 * ポリシーの文章は docs のファイルにそのまま置き(ふりがなの記法を混ぜない)、画面に出すときに、
 * この一覧の語に "漢字[ふりがな]" を付ける。どの部分に付けるかは data/privacyPolicy.ts が決める
 * (「かんたんに言うと」の節・すべての見出し・重要な第4条と第7条の本文だけ。条文の本文全体には付けない)。
 * 実際に画面に出るのは、rubyPolicy.ts の方針(HARD_WORDS・文法用語)に残る語だけ。ここに足した語は、HARD_WORDS にも足すこと。
 */
export const PRIVACY_READINGS: ReadonlyArray<readonly [word: string, reading: string]> = [
  ["匿名", "とくめい"],
  ["本名", "ほんみょう"],
  ["端末", "たんまつ"],
  ["運営者", "うんえいしゃ"],
  ["制定日", "せいていび"],
  ["適用範囲", "てきようはんい"],
  ["取得", "しゅとく"],
  ["利用目的", "りようもくてき"],
  ["解析", "かいせき"],
  ["閲覧", "えつらん"],
  ["特定", "とくてい"],
  ["推測", "すいそく"],
  ["委託", "いたく"],
  ["第三者", "だいさんしゃ"],
  ["削除", "さくじょ"],
  ["累計", "るいけい"],
  ["氏名", "しめい"],
  ["未成年者", "みせいねんしゃ"],
  ["改定", "かいてい"],
  ["初期化", "しょきか"],
];

const PATTERN = new RegExp(
  [...PRIVACY_READINGS].sort((a, b) => b[0].length - a[0].length).map(([word]) => word).join("|"),
  "g",
);
const READING = new Map(PRIVACY_READINGS);

/** 文の中の、一覧にある語に、"漢字[ふりがな]" を付ける */
export function addPrivacyRuby(text: string): string {
  return text.replace(PATTERN, (word) => `${word}[${READING.get(word)}]`);
}
