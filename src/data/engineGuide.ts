import type { Question, RubyText } from "./schema";
import { autoRuby } from "./furigana";
import { rb } from "./ruby";

/**
 * 初回プレイの操作ガイド(SPEC 44/48: 迷わず始められる)。
 * 出題エンジンの「見た目の操作」ごとに1つ。エンジン数は3つのまま(5章)で、
 * 文中タップは選択式の表示モードなので、ガイドだけ別に持つ。
 * 文面はここを書き換えるだけで変えられる("漢字[ふりがな]" 記法)。
 */
export type GuideKey = "sorting" | "assembly" | "choice" | "tapInSentence";

export interface EngineGuide {
  title: RubyText;
  steps: RubyText[];
}

const t = (text: string): RubyText => rb(autoRuby(text));

export const engineGuides: Record<GuideKey, EngineGuide> = {
  sorting: {
    title: t("しわけの あそびかた"),
    steps: [
      t("上にならんだ言葉[ことば]を1つタップして、選[えら]ぶ"),
      t("その言葉[ことば]に合[あ]うグループ(下のボタン)をタップして、入[い]れる"),
      t("まちがえて入[い]れたら、もう一度[いちど]その言葉[ことば]を選[えら]んで、べつのグループへ"),
      t("ぜんぶ入[い]れたら「こたえる」をタップ"),
    ],
  },
  assembly: {
    title: t("くみたての あそびかた"),
    steps: [
      t("文[ぶん]の空欄[くうらん](＿＿＿)に入[はい]るカードを、タップして選[えら]ぶ"),
      t("ちがうカードをタップすれば、選[えら]びなおせる"),
      t("決[き]まったら「こたえる」をタップ"),
    ],
  },
  choice: {
    title: t("えらぶ あそびかた"),
    steps: [
      t("問題[もんだい]や場面[ばめん]をよく読[よ]む"),
      t("答[こた]えだと思[おも]う選択肢[せんたくし]をタップ。すぐに答[こた]え合[あ]わせができるよ"),
    ],
  },
  tapInSentence: {
    title: t("ぶんの中[なか]から えらぶ あそびかた"),
    steps: [
      t("問題[もんだい]を読[よ]んで、文[ぶん]の中[なか]から答[こた]えだと思[おも]う言葉[ことば]を、直接[ちょくせつ]タップ"),
      t("下線[かせん]のついた太[ふと]い言葉[ことば]は、問題[もんだい]の基準[きじゅん](ヒント)。そこはタップしなくていいよ"),
      t("タップすると、すぐに答[こた]え合[あ]わせができるよ"),
    ],
  },
};

/** 全ガイド共通の、最後のひとこと(まちがえても失敗にならない: 3章) */
export const guideFooter: RubyText = t("まちがえても だいじょうぶ。何度[なんど]でも やりなおせるよ!");

export const guideKeys = Object.keys(engineGuides) as GuideKey[];

/** 問題が使う操作に対応するガイドのキー */
export function guideKeyOf(question: Question): GuideKey {
  if (question.engine === "choice" && question.display === "tapInSentence") return "tapInSentence";
  return question.engine;
}
