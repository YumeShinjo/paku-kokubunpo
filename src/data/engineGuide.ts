import type { Question, RubyText } from "./schema";
import { autoRuby } from "./furigana";
import { rb } from "./ruby";

/**
 * 初回プレイの操作ガイド(SPEC 44/48: 迷わず始められる)。
 * 出題エンジンの「見た目の操作」ごとに1つ。エンジン数は3つのまま(5章)で、
 * 文中タップは選択式の表示モードなので、ガイドだけ別に持つ。
 * 文面はここを書き換えるだけで変えられる("漢字[ふりがな]" 記法)。
 */
/** 出題形式ごとの操作ガイドのキー(4形式) */
export type QuestionGuideKey = "sorting" | "assembly" | "choice" | "tapInSentence";
/** 操作ガイド全体のキー。出題形式の4つに加えて、ことだまの書(図鑑)の初回ガイドがある */
export type GuideKey = QuestionGuideKey | "zukan";

export interface EngineGuide {
  title: RubyText;
  steps: RubyText[];
  /** 最後のひとこと。なければ全ガイド共通の guideFooter */
  footer?: RubyText;
}

const t = (text: string): RubyText => rb(autoRuby(text));

export const engineGuides: Record<GuideKey, EngineGuide> = {
  sorting: {
    title: t("仕分[しわ]けの遊[あそ]び方[かた]"),
    steps: [
      t("言葉[ことば]を、ドラッグして、合[あ]うグループ(点線[てんせん]のカゴ)に入[い]れる"),
      t("ドラッグしにくいときは、言葉[ことば]をタップして選[えら]び、カゴの名前[なまえ]のボタンをタップしてもOK"),
      t("まちがえて入[い]れたら、カゴの中[なか]の言葉[ことば]を、べつのカゴへ入[い]れなおせる"),
      t("ぜんぶ入[い]れたら「こたえる」をタップ"),
    ],
  },
  assembly: {
    title: t("組[く]み立[た]ての遊[あそ]び方[かた]"),
    steps: [
      t("文[ぶん]の空欄[くうらん](＿＿＿)に入[はい]るカードを、タップして選[えら]ぶ"),
      t("ちがうカードをタップすれば、選[えら]びなおせる"),
      t("決[き]まったら「こたえる」をタップ"),
    ],
  },
  choice: {
    title: t("選[えら]ぶ遊[あそ]び方[かた]"),
    steps: [
      t("問題[もんだい]や場面[ばめん]をよく読[よ]む"),
      t("答[こた]えだと思[おも]う選択肢[せんたくし]をタップ。すぐに答[こた]え合[あ]わせができるよ"),
    ],
  },
  tapInSentence: {
    title: t("文[ぶん]の中[なか]から選[えら]ぶ遊[あそ]び方[かた]"),
    steps: [
      t("問題[もんだい]を読[よ]んで、文[ぶん]の中[なか]から答[こた]えだと思[おも]う言葉[ことば]を、直接[ちょくせつ]タップ"),
      t("下線[かせん]のついた太[ふと]い言葉[ことば]は、問題[もんだい]の基準[きじゅん](ヒント)。そこはタップしなくていいよ"),
      t("タップすると、すぐに答[こた]え合[あ]わせができるよ"),
    ],
  },
  // ことだまの書(図鑑)の、初回に出す使い方
  zukan: {
    title: t("ことだまの書[しょ]の使[つか]い方[かた]"),
    steps: [
      t("ここは、これまでの成果[せいか]をまとめる「ことだまの書[しょ]」だよ"),
      t("エリアをクリアすると、言葉[ことば]の図鑑[ずかん]のページが増[ふ]えるよ"),
      t("見[み]たストーリーは、「思[おも]い出[で]」からもう一度[いちど]見[み]られるよ"),
      t("単元[たんげん]ごとの正答率[せいとうりつ]も見[み]られる。「苦手[にがて]」の印[しるし]がついた単元[たんげん]は、タップして自由[じゆう]練習[れんしゅう]しよう"),
    ],
    footer: t("この説明[せつめい]は、設定[せってい]からもう一度[いちど]見[み]られるよ。"),
  },
};

/** 全ガイド共通の、最後のひとこと(まちがえても失敗にならない: 3章) */
export const guideFooter: RubyText = t("まちがえても大丈夫[だいじょうぶ]。何度[なんど]でもやりなおせるよ!");

export const guideKeys = Object.keys(engineGuides) as GuideKey[];

/** 問題が使う操作に対応するガイドのキー */
export function guideKeyOf(question: Question): QuestionGuideKey {
  if (question.engine === "choice" && question.display === "tapInSentence") return "tapInSentence";
  return question.engine;
}
