import { rb } from "@/data/ruby";
import type { CharacterPosition, MascotForm, StoryEvent, StoryLine } from "./schema";
import {
  areaClearStoryId,
  endingChoiceStoryId,
  epilogueStoryId,
  introStoryId,
  lastBossClearStoryId,
  lastBossIntroStoryId,
  subBossClearStoryId,
  subBossIntroStoryId,
  truthStoryId,
} from "@/features/story/storyIds";

/**
 * ストーリー演出データ(3章・2章)。ベースは STORY.md(2026-09-17)のドラフトだが、
 * 2026-09-27 のブラッシュアップで一部を改稿済み(詳細は STORY.md 側の更新履歴を参照)。
 * 発話者名(コト・メイ・レル…)も STORY.md の表記に統一。ナレーションは speaker なし。
 * 一部シーンには、立ち絵を持たない点景NPC(店主・騎士など)の台詞も含む。
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
  /** 立ち絵の左右の寄せ方。省略時は中央。橋の上など、中央だと落ちそうに見える場面で指定する */
  position?: CharacterPosition;
}

/** コトの台詞は、立ち絵(マスコット)を出す。それ以外は指定したときだけ出す。 */
function line(speaker: string | undefined, text: string, opts: LineOptions = {}): StoryLine {
  return {
    speaker,
    text: rb(text),
    showMascot: opts.showMascot ?? speaker === KOTO,
    mascotForm: opts.mascotForm,
    position: opts.position,
  };
}

const narration = (text: string, opts?: LineOptions) => line(undefined, text, opts);
const koto = (text: string, mascotForm?: MascotForm, position?: CharacterPosition) =>
  line(KOTO, text, { mascotForm, position });

export const storyEvents: StoryEvent[] = [
  // ---- ことばの分かれ道(序章) ----
  {
    id: introStoryId("prologue"),
    lines: [
      narration("目を覚ますと、そこは見知らぬ草原だった。"),
      koto("あ、起きた!よかったぁ〜。"),
      koto("あなたね、村の外れで倒れてたんだよ。傷はないみたいだけど……記憶、ある?"),
      narration("主人公は、静かに首を横に振った。"),
      koto("えー、なんにも覚えてないの!? まあ、大丈夫、なんとかなるって。"),
      koto("あのね、あなたの手、ちょっと不思議な感じがするの。……もしかして「ことだま使い」の力を持ってるんじゃないかな。"),
      koto("ことだま使いっていうのはね、言葉の乱[みだ]れを、また元通りに整[ととの]えられる人のこと。今、この国じゃ数[かぞ]えるほどしかいないんだって。"),
      koto("最近、王国のあちこちで、言葉がおかしくなる出来事が増えててね。誰[だれ]かが直さなきゃって、みんな困ってるの。"),
      koto("記憶がないなら、これも何かの縁[えん]かも。とりあえず、わたしと一緒に、困ってる人たちを助けに行かない?"),
      narration("主人公は、小さくうなずいた。"),
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
  // メイは侍女見習い(お城の買い出しで市場に来ている)。品物の名前(名詞)を動作(動詞)で呼んでしまう乱れ。
  // 店主にも国全体の「言葉の乱れ」による軽い言い淀みを持たせ、メイの重症さとの濃淡をつけている。
  {
    id: introStoryId("kotobaNoIchiba"),
    lines: [
      narration("市場のあちこちで、看板の文字がかすれ、呼び声もどこか噛み合っていない。"),
      narration("露店で、お城の侍女見習いらしき少女が、店主相手に何かを必死に伝えようとしている。"),
      line("メイ", "あの、お城で使う…「拭く」を10枚、ください……!"),
      line("店主", "「拭く」……?えっと、それは、その……ふ、布巾[ふきん]のことですかね、たぶん……"),
      line("メイ", "あ、そう、それです…!"),
      koto("市場のみんな、なんだか言葉がふわふわしてる。あの子は特にひどそうだね。"),
      koto("これも「言葉の乱れ」ってやつの仕業かも。ちょっと見てきてよ。"),
    ],
  },
  // 小ボス戦の前: 取り憑かれて乱れた話し方(STORY.md の撃破後ドラフトの冒頭の台詞。撃破後は浄化されたあとの台詞から始まる)
  {
    id: subBossIntroStoryId("kotobaNoIchiba"),
    lines: [
      line("メイ", "あ、あの…わたくし、何がなんだか…「布巾」も「拭く」も、もう頭の中でぐちゃぐちゃで…"),
    ],
  },
  {
    id: subBossClearStoryId("kotobaNoIchiba"),
    lines: [
      line("メイ", "す、すみません…頭がはっきりしてきました…。さっきは、布巾を「拭く」って言って買おうとしてました…"),
      koto("侍女見習いさんも大変だね。ふぅ、元に戻ってよかった。"),
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
      koto("あれ!?剣[つるぎ]が槍[やり]にも鍬[くわ]にもなりきれなくて、中途半端[ちゅうとはんぱ]な形のまま固まってるよ!"),
      narration("金属も、木も、あるべき姿になろうとして、なれずにいる。"),
    ],
  },
  // 小ボス戦の前: 取り憑かれて乱れた話し方(STORY.md の撃破後ドラフトの冒頭の台詞。撃破後は浄化されたあとの台詞から始まる)
  {
    id: subBossIntroStoryId("sugatakaeNoKajiba"),
    lines: [
      line("レル", "くっ…もう、この炎[ほのお]を、支えれない…いや、支えられない…?あれ、わたしは何を言おうと…"),
    ],
  },
  {
    id: subBossClearStoryId("sugatakaeNoKajiba"),
    lines: [
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
      narration("文官が、王命[おうめい]により滝の水量を検分[けんぶん]しに来ていたらしい。"),
      koto("あそこに誰かいる…文官さん?"),
    ],
  },
  // 小ボス戦の前: 取り憑かれて乱れた話し方(STORY.md の撃破後ドラフトの冒頭の台詞。撃破後は浄化されたあとの台詞から始まる)
  {
    id: subBossIntroStoryId("namerakaNoTaki"),
    lines: [
      line("オンヴィン", "報告、いたし…言いた…もうしあげ…あれ、どの言い方が正しいのか、分からなく…"),
    ],
  },
  {
    id: subBossClearStoryId("namerakaNoTaki"),
    lines: [
      line(
        "オンヴィン",
        "……失礼いたしました。少々、頭が混乱していたようです。「申し上げます」も「言いた」もごちゃごちゃで、我ながら意味不明な報告書になるところでした。",
      ),
      koto("よかった、元通りだ!でも文官さんって、そんなに気にしいだったんだね。"),
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
      // 壊れかけた橋の背景で、真ん中に立たせると落ちそうに見えるため、左寄せにする
      koto("橋が…バラバラになりかけてる!このままじゃお城に渡れないよ。", undefined, "left"),
      narration("橋の板同士をつなぐ言葉が、あちこちで抜け落ちている。"),
      narration("メイド長は、橋を渡ってくる客人を出迎える役目で、お盆を手にじっと立っていたらしい。"),
    ],
  },
  // 小ボス戦の前: 取り憑かれて乱れた話し方(STORY.md の撃破後ドラフトの冒頭の台詞。撃破後は浄化されたあとの台詞から始まる)
  {
    id: subBossIntroStoryId("tsunagiNoHashi"),
    lines: [
      // 壊れかけた橋の背景で、真ん中に立たせると落ちそうに見えるため、右寄せにする
      line("ジョゼット", "紅茶、お持ち…いたしました…あら?何か、言葉が足りない気が…", { position: "right" }),
    ],
  },
  {
    id: subBossClearStoryId("tsunagiNoHashi"),
    lines: [
      line("ジョゼット", "……失礼いたしました。どうぞ、紅茶をお持ちいたしました。"),
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
      line("騎士", "……近ごろ陛下[へいか]の御前[ごぜん]に、誰[だれ]も通されないらしい……"),
      koto("今の話……なんだか、きな臭[くさ]いね。"),
    ],
  },
  // 小ボス戦の前: 取り憑かれて乱れた話し方(STORY.md の撃破後ドラフトの冒頭の台詞。撃破後は浄化されたあとの台詞から始まる)
  {
    id: subBossIntroStoryId("kizunaNoMa"),
    lines: [
      line(
        "ネジラルド",
        "私の誇りは、剣を極[きわ]めたい…いや、極[きわ]めることだ…?いや、待て、これは主語[しゅご]と述語[じゅつご]が……くっ、言葉すらままならぬとは、騎士団長として恥[は]ずべきことだ!",
      ),
    ],
  },
  {
    id: subBossClearStoryId("kizunaNoMa"),
    lines: [
      line(
        "ネジラルド",
        "……失礼した。取[と]り乱[みだ]してしまったようだ。ん、待てよ、今のは主語[しゅご]と述語[じゅつご]、合っていたか……?",
      ),
      koto("さっきよりはね。えらいえらい。"),
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
      line("サイラス", "皆様[みなさま]には、ご説明[せつめい]させていただかさせていただきます……"),
      koto("なんか、話が入り組んでてよく分からないよ…?さっきから「させていただかさせていただきます」しか言ってない気がする…"),
    ],
  },
  // 小ボス戦の前: 取り憑かれて乱れた話し方(STORY.md の撃破後ドラフトの冒頭の台詞。撃破後は浄化されたあとの台詞から始まる)
  {
    id: subBossIntroStoryId("mikakeNoMa"),
    lines: [
      line("サイラス", "これは、行かさせて…いえ、行かせて…いただき…おかしいな、言葉が二重に…"),
    ],
  },
  {
    id: subBossClearStoryId("mikakeNoMa"),
    lines: [
      line("サイラス", "……お恥ずかしいところを。少々、言葉を飾りすぎていたようです。"),
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
      narration("王座[おうざ]の間。重い扉の向こうに、宰相[さいしょう]が立ちはだかっている。"),
      line("ニジュヴェール", "おやおや、ここまでいらっしゃられるとは。よくぞおいでくださられましたね。"),
      koto("な、なんか喋[しゃべ]り方が変…"),
    ],
  },
  // 小ボス戦の前: 取り憑かれて乱れた話し方(STORY.md の撃破後ドラフトの冒頭の台詞。撃破後は浄化されたあとの台詞から始まる)
  {
    id: subBossIntroStoryId("ohzaNoMa"),
    lines: [
      line("ニジュヴェール", "くっ…わたくしめが、お仕[つか]えなさられて…いえ、お仕[つか]えして…もう、限界です…"),
    ],
  },
  // 宰相撃破。コトが淡く光り始める(2章「変身のタイミング」の予兆)。この後 truth へ続く。
  {
    id: subBossClearStoryId("ohzaNoMa"),
    lines: [
      line("ニジュヴェール", "(膝[ひざ]をつき)……申し上げます。王座には、真の王ではなく、「乱れ」そのものが座っております。"),
      line("ニジュヴェール", "恥[はじ]を忍[しの]んで、申し上げます。……この乱[みだ]れを、王座[おうざ]に招[まね]き入[い]れたのは、わたくしです。"),
      line("ニジュヴェール", "正しい言葉を、誰[だれ]よりも守ろうとしました。変わっていく話し言葉のひとつひとつが、崩[くず]れていくように見えて、恐[おそ]ろしくて……"),
      line("ニジュヴェール", "気づけば、その「正しさ」への執着[しゅうちゃく]そのものが、乱れにつけ込[こ]まれておりました。"),
      line("ニジュヴェール", "そして……あなた様こそ、行方知[ゆくえし]れずとなっていらっしゃられた、王家の…"),
      narration("戸惑[とまど]うコトの手を、主人公がそっと握[にぎ]った。"),
      narration("コトの姿が、淡[あわ]く光り始める。", { showMascot: true, mascotForm: "glow" }),
      koto("わたし…わたしは…", "glow"),
    ],
  },
  // 真相究明。STORY.md「真相究明〜ラスボス前」の前半(「最後の戦いが始まる。」の手前まで)。
  {
    id: truthStoryId("ohzaNoMa"),
    lines: [
      narration("王座[おうざ]に座っていたのは、もはや人の形をなさない「乱れ」そのものだった。"),
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
      narration("「乱れ」が晴れていくと同時に、王座[おうざ]の間に眩[まぶ]い光があふれる。"),
      narration("光の中心で、丸い体がすっとほどけ、人の姿へと変わっていく——コトが、コレットに戻る瞬間[しゅんかん]だった。", {
        showMascot: true,
        mascotForm: "true",
      }),
      narration("驚[おどろ]いた様子も、たじろぐ様子もなく、主人公はいつも通り、すぐそばに立っていた。"),
      narration("同時に、王座[おうざ]に座っていた人物の輪郭[りんかく]もはっきりとしていく。"),
      line("ヴェルバルト", "……ここは……わたしは、一体……"),
      narration("正気[しょうき]を取り戻した王様が、ゆっくりと顔を上げる。"),
      line("ヴェルバルト", "(コトを見て)まさか……お前は……", { showMascot: true, mascotForm: "true" }),
      koto("……お父さん?", "true"),
      line("ヴェルバルト", "よく…よく無事で……", { showMascot: true, mascotForm: "true" }),
      line("ヴェルバルト", "……思い出した。乱れが王座[おうざ]に忍[しの]び込[こ]んだあの日、まだ幼[おさな]かったお前は、王家に伝わる守り獣[じゅう]の御守[おまも]りを抱[いだ]いて、わたしを庇[かば]おうとしたのだったな。", { showMascot: true, mascotForm: "true" }),
      line("ヴェルバルト", "あの御守りは、王家の言葉を代々守ってきたと伝わる、化[ば]け狸[たぬき]の姿を宿[やど]すもの。乱れはお前ごと、その姿に閉[と]じ込[こ]めてしまった。", { showMascot: true, mascotForm: "true" }),
      line("ヴェルバルト", "小さな体のまま、ずっと城を彷徨[さまよ]っていたというのか……すまない、気づいてやれなかった。", { showMascot: true, mascotForm: "true" }),
      line("コレット", "ううん。わたしも、途中までしか覚えてない。でも、あなたたちのおかげで、思い出せた。", { showMascot: true, mascotForm: "true" }),
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
      line(
        "コレット",
        "ねえ……わたしが王女だってわかったのに、あなたの態度、全然変わらないね。",
        { showMascot: true, mascotForm: "true" },
      ),
      line(
        "コレット",
        "これからはきっと、みんな畏[かしこ]まったり、急に距離を置いたりするようになるんだろうな。……でも、あなたにだけは、ずっといつも通りでいてほしいな。",
        { showMascot: true, mascotForm: "true" },
      ),
      narration("主人公は、いつものように小さく笑って、うなずいた。"),
      line("コレット", "……ふふ、そういうところ、好きだよ。あ、変な意味じゃなくてね!", {
        showMascot: true,
        mascotForm: "true",
      }),
      koto("さ、次はどこ行こっか!", "true"),
    ],
  },
];

const eventsById = new Map(storyEvents.map((e) => [e.id, e]));

export function getStoryEvent(id: string): StoryEvent | undefined {
  return eventsById.get(id);
}
