import { rb } from "@/data/ruby";
import type { MascotForm, StoryEvent, StoryLine } from "./schema";
import {
  areaClearStoryId,
  endingChoiceStoryId,
  epilogueStoryId,
  introStoryId,
  lastBossClearStoryId,
  lastBossIntroStoryId,
  subBossClearStoryId,
  truthStoryId,
} from "@/features/story/storyIds";

/**
 * ストーリー演出データ(3章・2章)。台詞は STORY.md(2026-09-17)のドラフトをそのまま反映している。
 * 発話者名(コト・メイ・レル…)も STORY.md の表記に統一。ナレーションは speaker なし。
 * 台詞の差し替えは lines の中身を書き換えるだけでよく、表示側のコード変更は不要。
 * 読みが難しい漢字には "漢字[ふりがな]" 記法でルビを付けている。
 *
 * イベントidの規則は features/story/storyIds.ts を参照。王座の間だけ、次の複数フェーズを持つ:
 *   subboss-clear(宰相撃破) → truth(真相究明) → [ラスボス挑戦時] lastboss-intro
 *   → [ラスボス撃破後] lastboss-clear → ending-choice(分岐) → ending-castle/ending-journey
 *   → epilogue(宰相の追加台詞) → area-clear(共通の締め)
 */
const KOTO = "コト";

interface LineOptions {
  /** 発話者がコト以外でも、立ち絵(マスコット)を出したい場面で指定する */
  showMascot?: boolean;
  mascotForm?: MascotForm;
}

/** コトの台詞は、立ち絵(マスコット)を出す。それ以外は指定したときだけ出す。 */
function line(speaker: string | undefined, text: string, opts: LineOptions = {}): StoryLine {
  return {
    speaker,
    text: rb(text),
    showMascot: opts.showMascot ?? speaker === KOTO,
    mascotForm: opts.mascotForm,
  };
}

const narration = (text: string, opts?: LineOptions) => line(undefined, text, opts);
const koto = (text: string, mascotForm?: MascotForm) => line(KOTO, text, { mascotForm });

export const storyEvents: StoryEvent[] = [
  // ---- ことばの分かれ道(序章) ----
  {
    id: introStoryId("prologue"),
    lines: [
      narration("目を覚ますと、そこは見知らぬ草原だった。"),
      koto("あ、起きた!よかったぁ〜。ねえねえ、お腹すいてない?わたしペコペコなんだけど。"),
      koto("あなた、これから「ことだま使い」になるんだって。よくわかんないけど、とにかく歩けばわかるよ、たぶん。"),
      koto("この国、最近ちょっとヘンなの。みんなの言葉が、なんだかフワフワしてて。"),
      koto("とりあえず、あそこの市場に行ってみよっか!"),
    ],
  },
  // 序章のエリアクリア台詞(STORY.md には無く、ユーザー提供)。
  {
    id: areaClearStoryId("prologue"),
    lines: [
      narration("はじめてのことだまの力を、主人公はしっかりと示した。"),
      koto("やったね!この調子で、みんなを助けに行こっか!"),
    ],
  },

  // ---- ことばの市場 ----
  {
    id: introStoryId("kotobaNoIchiba"),
    lines: [
      koto("わ、お店の人たちが困ってる。「これは…えーと…なんだっけ…」って、品物の呼び方が全然定まってない。"),
      koto("これも「言葉の乱れ」ってやつの仕業かも。ちょっと見てきてよ。"),
    ],
  },
  {
    id: subBossClearStoryId("kotobaNoIchiba"),
    lines: [
      line("メイ", "あ、あの…わたくし、何がなんだか、その、えーと…名詞? 動詞? もうどれがどれだか…"),
      line("メイ", "す、すみません…頭がはっきりしてきました…。少し働きすぎていたのかもしれません。"),
      koto("ふぅ、元に戻ったね。よかったよかった。"),
    ],
  },
  {
    id: areaClearStoryId("kotobaNoIchiba"),
    lines: [
      narration("市場に活気が戻ってきた。呼び声も、値札の文字も、はっきりと読める。"),
      koto("んー、なんかいい匂い!わたしも今日はいっぱい食べて、ちょっと大きくなった気がする!"),
      koto("次、行こっか。"),
    ],
  },

  // ---- 姿変えの鍛冶場(既視感①) ----
  {
    id: introStoryId("sugatakaeNoKajiba"),
    lines: [
      koto("あれ、鍛冶場[かじば]の道具、形がちゃんと変わってくれないみたい。"),
      narration("金属も、木も、あるべき姿になろうとして、なれずにいる。"),
    ],
  },
  {
    id: subBossClearStoryId("sugatakaeNoKajiba"),
    lines: [
      line("レル", "くっ…もう、この炎[ほのお]を、支えれない…いや、支えられない…?あれ、わたしは何を言おうと…"),
      line("レル", "……あれ、ここは…?わたし、何をしていたんでしょう…"),
      narration("(レルが我[われ]に返[かえ]ると同時に、鍛冶場[かじば]の炎[ほのお]がゆらりと揺[ゆ]れた)"),
      narration("コトは、その炎[ほのお]をじっと見つめたまま、少しの間、動かなかった。", { showMascot: true }),
      koto("……ん、なんでもない。行こ!"),
    ],
  },
  {
    id: areaClearStoryId("sugatakaeNoKajiba"),
    lines: [
      narration("鍛冶場[かじば]の火が、正しい形を取り戻していく。"),
      koto("えらい!えらいよあなた!わたしも、なんだかちょっと逞[たくま]しくなった気がする!"),
    ],
  },

  // ---- なめらかの滝 ----
  {
    id: introStoryId("namerakaNoTaki"),
    lines: [
      koto("きゃー!水の音、なんだかガクガクしてない?"),
      narration("滝の水が、なめらかに流れず、途切[とぎ]れ途切[とぎ]れになっている。"),
      koto("あそこに誰かいる…文官さん?"),
    ],
  },
  {
    id: subBossClearStoryId("namerakaNoTaki"),
    lines: [
      line("オンヴィン", "報告、いたし…言いた…もうしあげ…あれ、どの言い方が正しいのか、分からなく…"),
      line("オンヴィン", "(乱れが晴れて)……失礼いたしました。少々、頭が混乱していたようです。"),
      koto("よかった、元通りだ!"),
    ],
  },
  {
    id: areaClearStoryId("namerakaNoTaki"),
    lines: [
      narration("滝の水が、また美しく流れ始めた。"),
      koto("ふう、スッキリ!さ、次いこ!"),
    ],
  },

  // ---- つなぎの橋(既視感②) ----
  {
    id: introStoryId("tsunagiNoHashi"),
    lines: [
      koto("橋が…バラバラになりかけてる!このままじゃお城に渡れないよ。"),
      narration("橋の板同士をつなぐ言葉が、あちこちで抜け落ちている。"),
    ],
  },
  {
    id: subBossClearStoryId("tsunagiNoHashi"),
    lines: [
      line("ジョゼット", "紅茶、お持ち…いたしました…あら?何か、言葉が足りない気が…"),
      line("ジョゼット", "(乱れが晴れて)……失礼いたしました。どうぞ、紅茶をお持ちいたしました。"),
      line("ジョゼット", "(コトに向き直り、恭[うやうや]しく一礼して)貴方様[あなたさま]には、格別のおもてなしを。"),
      narration("コトは、妙に丁寧に扱われて、なんだか落ち着かない様子だった。", { showMascot: true }),
      koto("え、えっと…そんな、かしこまらなくていいよ…?"),
    ],
  },
  {
    id: areaClearStoryId("tsunagiNoHashi"),
    lines: [
      narration("橋の板が一枚、また一枚とつながっていく。"),
      koto("よーし、これでお城まであと少し!"),
    ],
  },

  // ---- 絆の間 ----
  {
    id: introStoryId("kizunaNoMa"),
    lines: [
      narration("円卓[えんたく]の間。並んでいたはずの椅子や旗が、なぜかちぐはぐな配置になっている。"),
      koto("あれ、なんか…関係性が、めちゃくちゃになってる?"),
    ],
  },
  {
    id: subBossClearStoryId("kizunaNoMa"),
    lines: [
      line("ネジラルド", "私の誇りは、剣を極[きわ]めたい…いや、極[きわ]めることだ…?いや…"),
      line("ネジラルド", "(乱れが晴れて)……失礼した。取[と]り乱[みだ]してしまったようだ。"),
      koto("騎士団長さんも、大変だったんだね。"),
    ],
  },
  {
    id: areaClearStoryId("kizunaNoMa"),
    lines: [
      narration("円卓[えんたく]が正しい位置に並び直される。"),
      koto("うんうん、なんかスッキリした!"),
    ],
  },

  // ---- 見分けの間 ----
  {
    id: introStoryId("mikakeNoMa"),
    lines: [
      narration("大臣が、集まった人々に何やら言い訳めいた説明をしている。"),
      koto("なんか、話が入り組んでてよく分からないよ…?"),
    ],
  },
  {
    id: subBossClearStoryId("mikakeNoMa"),
    lines: [
      line("サイラス", "これは、行かさせて…いえ、行かせて…いただき…おかしいな、言葉が二重に…"),
      line("サイラス", "(乱れが晴れて)……お恥ずかしいところを。少々、言葉を飾りすぎていたようです。"),
      koto("正直に話してくれたら、それでいいのにね。"),
    ],
  },
  {
    id: areaClearStoryId("mikakeNoMa"),
    lines: [
      narration("大臣の説明が、急にはっきりと分かりやすくなった。"),
      koto("よし、あと少しでお城の奥だ!"),
    ],
  },

  // ---- 王座の間(複数フェーズ) ----
  {
    id: introStoryId("ohzaNoMa"),
    lines: [
      narration("玉座[ぎょくざ]の間。重い扉の向こうに、宰相[さいしょう]が立ちはだかっている。"),
      line("ニジュヴェール", "おやおや、ここまでいらっしゃられるとは。よくぞおいでくださられましたね。"),
      koto("な、なんか喋[しゃべ]り方が変…"),
    ],
  },
  // 宰相撃破。コトが淡く光り始める(2章「変身のタイミング」の予兆)。この後 truth へ続く。
  {
    id: subBossClearStoryId("ohzaNoMa"),
    lines: [
      line("ニジュヴェール", "くっ…わたくしめが、お仕[つか]えなさられて…いえ、お仕[つか]えして…もう、限界です…"),
      line("ニジュヴェール", "(乱れが晴れて、膝[ひざ]をつき)……申し上げます。王座には、真の王ではなく、「乱れ」そのものが座っております。"),
      line("ニジュヴェール", "そして……あなた様こそ、行方知[ゆくえし]れずとなっていらっしゃられた、王家の…"),
      narration("コトの姿が、淡[あわ]く光り始める。", { showMascot: true, mascotForm: "glow" }),
      koto("わたし…わたしは…", "glow"),
    ],
  },
  // 真相究明。STORY.md「真相究明〜ラスボス前」の前半(「最後の戦いが始まる。」の手前まで)。
  {
    id: truthStoryId("ohzaNoMa"),
    lines: [
      narration("玉座[ぎょくざ]に座っていたのは、もはや人の形をなさない「乱れ」そのものだった。"),
      line("王(乱れに飲まれた姿)", "正しい言葉など、いらな……いる……どちらでも……どうでもよい……"),
      koto("よくないよ!言葉は、ちゃんと伝えたい人がいるから、大事なんだから!", "glow"),
    ],
  },
  // ラスボス前。STORY.md「真相究明〜ラスボス前」の最後の1行。ラスボスに初めて挑む直前に流れる。
  {
    id: lastBossIntroStoryId("ohzaNoMa"),
    lines: [narration("最後の戦いが始まる。")],
  },
  // ラスボス撃破後(王様浄化)。コトが本来の姿(王女コレット)を取り戻す。
  {
    id: lastBossClearStoryId("ohzaNoMa"),
    lines: [
      narration("「乱れ」が晴れていくと同時に、玉座[ぎょくざ]に座っていた人物の輪郭[りんかく]がはっきりとしていく。"),
      line("ヴェルバルト", "……ここは……わたしは、一体……"),
      narration("正気[しょうき]を取り戻した王様が、ゆっくりと顔を上げる。"),
      line("ヴェルバルト", "(コトを見て)まさか……お前は……", { showMascot: true, mascotForm: "true" }),
      koto("……お父さん?", "true"),
      line("ヴェルバルト", "よく…よく無事で……", { showMascot: true, mascotForm: "true" }),
      narration("長い沈黙[ちんもく]のあと、王様が静かに問いかける。", {
        showMascot: true,
        mascotForm: "true",
      }),
    ],
  },
  // エンディング分岐(選択の瞬間)。選んだ内容で、次に流れる王様の一言が変わる(2章の軽い分岐)。
  {
    id: endingChoiceStoryId("ohzaNoMa"),
    lines: [
      line("ヴェルバルト", "これから、どうする? お前の好きにするといい。", {
        showMascot: true,
        mascotForm: "true",
      }),
    ],
    choice: {
      options: [
        {
          key: "castle",
          label: "城に戻り、王家の一員として過ごす",
          eventId: "ohzaNoMa-ending-castle",
        },
        {
          key: "journey",
          label: "これからも、ことだま使いの相棒として旅を続ける",
          eventId: "ohzaNoMa-ending-journey",
        },
      ],
    },
  },
  {
    id: "ohzaNoMa-ending-castle",
    lines: [
      line("ヴェルバルト", "よく戻ってきてくれた。お前の居場所は、ここにもあるのだから。", {
        showMascot: true,
        mascotForm: "true",
      }),
    ],
  },
  {
    id: "ohzaNoMa-ending-journey",
    lines: [
      line("ヴェルバルト", "……そうか。それも、お前らしい。いつでも帰っておいで。", {
        showMascot: true,
        mascotForm: "true",
      }),
    ],
  },
  // 宰相の追加台詞(浄化後・共通)。「言葉の変化」と「言葉の崩壊」を取り違えていたことに自ら気づく(2章)。
  {
    id: epilogueStoryId("ohzaNoMa"),
    lines: [
      line(
        "ニジュヴェール",
        "言葉は……生きているものだと、忘れていました。変わっていくことと、壊れていくことは、違うのに。",
      ),
    ],
  },
  // 共通の締め。王座の間のエリアクリア = エンディング全体の締め。
  {
    id: areaClearStoryId("ohzaNoMa"),
    lines: [
      narration("コトノハ王国に、正しい言葉と、賑[にぎ]やかな声が戻ってきた。"),
      koto("さ、次はどこ行こっか!", "true"),
    ],
  },
];

const eventsById = new Map(storyEvents.map((e) => [e.id, e]));

export function getStoryEvent(id: string): StoryEvent | undefined {
  return eventsById.get(id);
}
