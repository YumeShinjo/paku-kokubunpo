import { GRAMMAR_TERMS } from "./furigana";
import type { RubyText } from "./schema";

/**
 * システム文のふりがなの方針(4章):
 *  - 操作ボタン・短い案内(はじめる・もどる・やめる など)は、ひらがなのまま(ふりがなを付けない)。
 *  - 文法用語(品詞名・単元名など。furigana.ts の辞書にある語)は、漢字+ふりがな。
 *  - その他の地の文は、常用の漢字はそのまま書き、中学生がまだ習っていない・読みが難しい漢字だけふりがなを付ける。
 * 画面の文は "漢字[ふりがな]" 記法で書き、<Rb> が表示のときにこの方針で絞る(下の HARD_WORDS と文法用語だけ残す)。
 * ふりがなを付けたい語が出てきたら、HARD_WORDS に足す。
 */
export const HARD_WORDS: ReadonlySet<string> = new Set([
  "克服",
  "浄化",
  "称号",
  "図鑑",
  "推測",
  "侍女",
  "鍛冶",
  "絆",
  "宰相",
  "正答率",
  "単元",
  "揃",
  "載",
  "好物",
  "直近",
  "成果",
  "順位表",
  "初期化",
  "経験値",
  // 言の葉の森(ことわざ・故事成語のミニゲーム)
  "言",
  "葉",
  "森",
  "故事成語",
  // プライバシーポリシー(data/privacyRuby.ts)
  "匿名",
  "本名",
  "端末",
  "運営者",
  "制定日",
  "適用範囲",
  "取得",
  "利用目的",
  "解析",
  "閲覧",
  "特定",
  "委託",
  "第三者",
  "削除",
  "累計",
  "氏名",
  "未成年者",
  "改定",
]);

/** この語(漢字の連続)には、ふりがなを付けるか */
export const keepsRuby = (word: string): boolean => HARD_WORDS.has(word) || GRAMMAR_TERMS.has(word);

/** ふりがな付きの文から、方針に合わない語のふりがなを取り除く(漢字はそのまま残す) */
export function limitRuby(text: RubyText): RubyText {
  return text.map((seg) => (seg.ruby && !keepsRuby(seg.text) ? { text: seg.text } : seg));
}
