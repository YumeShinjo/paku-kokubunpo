import type { PosId } from "./partOfSpeech";

/**
 * ことだまの書(図鑑)のページ(6章: 図鑑はエリアクリアごとに中身が増える)。
 * エリアをクリアすると、そのエリアで学んだ用語のまとめページが開く。
 * 文面は "漢字[ふりがな]" 記法で書ける(文法用語には自動でもふりがなが付く)。
 * 例文の各語に pos を付けると、ことだまの書の中だけで品詞ごとの色がつく(問題の中では色を出さない: 5・7章)。
 * 内容は中学校の国語文法の範囲で、学校文法(教科書)の言い方に合わせている。
 */

/** 例文の1語。pos があれば、品詞の色をつけて表示する */
export interface ExampleWord {
  text: string;
  pos?: PosId;
}

export interface ZukanEntry {
  /** 用語(見出し) */
  term: string;
  /** かんたんな説明 */
  meaning: string;
  /** 例(語や文節ごとに区切って書く) */
  example?: ExampleWord[];
  /** 例のひとこと(なにを示している例か) */
  exampleNote?: string;
}

export interface ZukanPage {
  areaId: string;
  title: string;
  /** ページの導入(ひとこと) */
  intro: string;
  entries: ZukanEntry[];
}

const w = (text: string, pos?: PosId): ExampleWord => ({ text, pos });

export const zukanPages: ZukanPage[] = [
  {
    areaId: "prologue",
    title: "ことばの分かれ道",
    intro: "文をどこで区切るかが、文法のはじまりだよ。",
    entries: [
      {
        term: "文節",
        meaning:
          "文を、意味がわかるように、できるだけ短く区切ったひとまとまり。「ネ」や「サ」を入れて自然に区切れるところが、文節の切れ目。",
        example: [w("私は/"), w("毎日/"), w("走る。")],
        exampleNote: "「私は/毎日/走る。」は3つの文節",
      },
      {
        term: "単語",
        meaning:
          "文を、意味をもつ最小の単位まで、さらに細かく区切ったもの。文節は、1つ以上の単語でできている。",
        example: [w("私", "meishi"), w("は", "joshi"), w("毎日", "meishi"), w("走る", "doushi")],
        exampleNote: "「私/は/毎日/走る」は4つの単語",
      },
    ],
  },
  {
    areaId: "kotobaNoIchiba",
    title: "ことばの市場",
    intro: "言葉は、はたらきによって10の品詞に分けられるよ。",
    entries: [
      {
        term: "自立語",
        meaning: "それだけで文節を作れる語。文節の最初にくる。",
        example: [w("花", "meishi"), w("が", "joshi"), w("咲く", "doushi")],
        exampleNote: "「花」「咲く」は自立語",
      },
      {
        term: "付属語",
        meaning: "それだけでは文節を作れず、自立語のあとについて使われる語。助詞と助動詞がある。",
        example: [w("花", "meishi"), w("が", "joshi"), w("咲く", "doushi")],
        exampleNote: "「が」は付属語",
      },
      {
        term: "活用",
        meaning:
          "使い方に合わせて、語の形が変わること。動詞・形容詞・形容動詞・助動詞は活用し、名詞・助詞などは活用しない。",
        example: [w("読ま", "doushi"), w("ない", "jodoushi")],
        exampleNote: "「読む」が「読ま」に変わる",
      },
      {
        term: "名詞",
        meaning: "物や事がらの名前を表す。活用しない。「が」「は」などをつけて主語になれる。",
        example: [w("山", "meishi")],
      },
      {
        term: "動詞",
        meaning: "動作や存在を表す。活用する。言い切りの形が、ウ段の音で終わる。",
        example: [w("走る", "doushi")],
      },
      {
        term: "形容詞",
        meaning: "ものの性質や状態を表す。活用する。言い切りの形が「い」で終わる。",
        example: [w("美しい", "keiyoushi")],
      },
      {
        term: "形容動詞",
        meaning: "ものの性質や状態を表す。活用する。言い切りの形が「だ」で終わる(「です」の形もある)。",
        example: [w("静かだ", "keiyoudoushi")],
      },
      {
        term: "副詞",
        meaning: "おもに、動詞・形容詞・形容動詞を詳しく説明する。活用しない。",
        example: [w("ゆっくり", "fukushi"), w("歩く", "doushi")],
      },
      {
        term: "連体詞",
        meaning: "体言(名詞)だけを詳しく説明する。活用しない。",
        example: [w("大きな", "rentaishi"), w("木", "meishi")],
      },
      {
        term: "接続詞",
        meaning: "文や語をつなぐ。活用しない。",
        example: [w("しかし", "setsuzokushi")],
      },
      {
        term: "感動詞",
        meaning: "感動・呼びかけ・応答などを表す。単独で文節になれる。活用しない。",
        example: [w("ああ", "kandoushi")],
      },
      {
        term: "助動詞",
        meaning: "付属語で、活用する。ほかの語について、意味をそえたり、判断を表したりする。",
        example: [w("読ま", "doushi"), w("れる", "jodoushi")],
      },
      {
        term: "助詞",
        meaning: "付属語で、活用しない。語と語の関係を示したり、意味をそえたりする。",
        example: [w("花", "meishi"), w("が", "joshi")],
      },
    ],
  },
  {
    areaId: "sugatakaeNoKajiba",
    title: "姿変えの鍛冶場",
    intro: "動詞・形容詞・形容動詞は、形を変える(活用する)ことができるよ。",
    entries: [
      {
        term: "活用の種類(動詞)",
        meaning:
          "動詞の活用は5種類。五段活用、上一段活用、下一段活用、カ行変格活用(来る)、サ行変格活用(する・〜する)。",
        example: [w("書く", "doushi"), w("起きる", "doushi"), w("食べる", "doushi"), w("来る", "doushi"), w("する", "doushi")],
        exampleNote: "五段・上一段・下一段・カ変・サ変の順",
      },
      {
        term: "五段活用の見分け方",
        meaning: "「ない」をつけて、その直前の音がア段になるのが五段活用。",
        example: [w("書か", "doushi"), w("ない", "jodoushi")],
        exampleNote: "「書く」→「書か(ka)ない」ア段",
      },
      {
        term: "一段活用の見分け方",
        meaning: "「ない」をつけて、直前がイ段なら上一段活用、エ段なら下一段活用。",
        example: [w("起き", "doushi"), w("ない", "jodoushi"), w("食べ", "doushi"), w("ない", "jodoushi")],
        exampleNote: "「起き」はイ段、「食べ」はエ段",
      },
      {
        term: "語幹と活用語尾",
        meaning: "活用しても変わらない部分が語幹、変わる部分が活用語尾。",
        example: [w("書く", "doushi")],
        exampleNote: "「書く」の語幹は「書」、活用語尾は「く」(か・き・く・け と変わる)",
      },
      {
        term: "六つの活用形",
        meaning:
          "未然形(ない・う・よう)、連用形(ます・た・て)、終止形(言い切る)、連体形(とき・こと)、仮定形(ば)、命令形(命令して言い切る)。",
        example: [w("書か", "doushi"), w("書き", "doushi"), w("書く", "doushi"), w("書く", "doushi"), w("書け", "doushi"), w("書け", "doushi")],
        exampleNote: "未然・連用・終止・連体・仮定・命令の順",
      },
      {
        term: "形容詞の活用",
        meaning: "言い切りが「い」。「かろ・かっ(く)・い・い・けれ」と活用し、命令形はない。",
        example: [w("美しかっ", "keiyoushi"), w("た", "jodoushi")],
        exampleNote: "「美しい」→「美しかった」",
      },
      {
        term: "形容動詞の活用",
        meaning: "言い切りが「だ」。「だろ・だっ・で・に」「だ」「な」「なら」に活用し、命令形はない。",
        example: [w("静かだっ", "keiyoudoushi"), w("た", "jodoushi")],
        exampleNote: "「静かだ」→「静かだった」",
      },
    ],
  },
  {
    areaId: "namerakaNoTaki",
    title: "なめらかの滝",
    intro: "動詞には、いろいろな形と使い方があるよ。",
    entries: [
      {
        term: "自動詞",
        meaning: "動作や変化が、その主語だけに起こることを表す動詞。「〜を」がつかないことが多い。",
        example: [w("ドア", "meishi"), w("が", "joshi"), w("開く", "doushi")],
        exampleNote: "「開く」は自動詞",
      },
      {
        term: "他動詞",
        meaning: "ほかのものに働きかける動作を表す動詞。「〜を」がつくことが多い。",
        example: [w("ドア", "meishi"), w("を", "joshi"), w("開ける", "doushi")],
        exampleNote: "「開ける」は他動詞",
      },
      {
        term: "可能動詞",
        meaning: "「〜することができる」という意味をもつ動詞。五段活用の動詞から作られ、下一段活用をする。",
        example: [w("書く", "doushi"), w("→"), w("書ける", "doushi")],
        exampleNote: "「書く」→「書ける(書くことができる)」",
      },
      {
        term: "音便",
        meaning:
          "連用形に「た」「て」などが続くとき、発音しやすいように音が変わること。イ音便(書いた)、撥音便(読んだ)、促音便(持った)がある。",
        example: [w("書い", "doushi"), w("た", "jodoushi"), w("読ん", "doushi"), w("だ", "jodoushi"), w("持っ", "doushi"), w("た", "jodoushi")],
        exampleNote: "イ音便・撥音便・促音便の順",
      },
    ],
  },
  {
    areaId: "tsunagiNoHashi",
    title: "つなぎの橋",
    intro: "助詞は、言葉と言葉をつなぐ大切なはたらきをするよ。",
    entries: [
      {
        term: "格助詞",
        meaning: "おもに体言(名詞など)について、その語がほかの語とどんな関係かを示す。「が・の・を・に・へ・と・から・より・で」など。",
        example: [w("私", "meishi"), w("が", "joshi"), w("学校", "meishi"), w("へ", "joshi"), w("行く", "doushi")],
        exampleNote: "「が」「へ」が格助詞",
      },
      {
        term: "接続助詞",
        meaning: "前後の文節や文をつなぐ。「ば・と・ても・けれど・が・から・ので・のに・て」など。",
        example: [w("走れ", "doushi"), w("ば", "joshi"), w("間に合う", "doushi")],
        exampleNote: "「ば」が接続助詞",
      },
      {
        term: "副助詞",
        meaning: "いろいろな語について、意味をそえる。「は・も・こそ・さえ・でも・だけ・ばかり・まで・など」など。",
        example: [w("水", "meishi"), w("だけ", "joshi"), w("飲む", "doushi")],
        exampleNote: "「だけ」が副助詞",
      },
      {
        term: "終助詞",
        meaning: "おもに文の終わりについて、疑問・禁止・感動などの気持ちを表す。「か・な・ぞ・ね・よ・わ」など。",
        example: [w("行く", "doushi"), w("よ", "joshi")],
        exampleNote: "「よ」が終助詞",
      },
      {
        term: "「が」の使い分け",
        meaning: "「が」には、主語などを示す格助詞と、前後をつなぐ(逆接の)接続助詞がある。「の」にも、いくつかのはたらきがある。",
        example: [w("雨", "meishi"), w("が", "joshi"), w("降る", "doushi")],
        exampleNote: "この「が」は格助詞",
      },
    ],
  },
  {
    areaId: "kizunaNoMa",
    title: "絆の間",
    intro: "文節と文節は、いろいろな関係で結びついているよ。",
    entries: [
      {
        term: "主語・述語の関係",
        meaning: "「何が(は)」を表す文節が主語、「どうする・どんなだ・何だ」を表す文節が述語。",
        example: [w("鳥が/"), w("鳴く。")],
        exampleNote: "主語「鳥が」・述語「鳴く」",
      },
      {
        term: "修飾・被修飾の関係",
        meaning: "あとの文節をくわしく説明する関係。説明するほうが修飾語、説明されるほうが被修飾語。",
        example: [w("赤い/"), w("花が/"), w("咲く。")],
        exampleNote: "「赤い」が「花が」を修飾する",
      },
      {
        term: "並立の関係",
        meaning: "対等な関係で並んでいる文節どうし。入れかえても意味があまり変わらない。",
        example: [w("山と/"), w("川が/"), w("美しい。")],
        exampleNote: "「山と」「川が」は並立",
      },
      {
        term: "補助の関係",
        meaning: "上の文節の意味を、補助的にそえる関係。あとの文節は、本来の意味がうすれている。",
        example: [w("食べて/"), w("みる。")],
        exampleNote: "「食べて」に「みる」が補助する",
      },
      {
        term: "接続の関係",
        meaning: "前の文節や文が、あとの文節や文へ、つなぎ言葉でつながる関係。",
        example: [w("雨だ。/"), w("だから/"), w("休む。")],
        exampleNote: "「だから」がつなぐ",
      },
      {
        term: "独立の関係",
        meaning: "ほかの文節と直接の関係がなく、独立している文節。呼びかけや応答、あいさつなど。",
        example: [w("はい、/"), w("行きます。")],
        exampleNote: "「はい、」は独立している",
      },
    ],
  },
  {
    areaId: "mikakeNoMa",
    title: "見分けの間",
    intro: "同じ形でも、意味やはたらきがちがう言葉を見分けよう。",
    entries: [
      {
        term: "れる・られる",
        meaning: "受け身・可能・自発・尊敬の4つの意味がある。文の意味から見分ける。",
        example: [w("先生", "meishi"), w("に", "joshi"), w("ほめ", "doushi"), w("られる", "jodoushi")],
        exampleNote: "この「られる」は受け身",
      },
      {
        term: "せる・させる",
        meaning: "使役(ほかの人に、そうさせる)の意味を表す。",
        example: [w("弟", "meishi"), w("を", "joshi"), w("行か", "doushi"), w("せる", "jodoushi")],
        exampleNote: "この「せる」は使役",
      },
      {
        term: "ない・ぬ",
        meaning: "打ち消し(そうではない)の意味を表す。",
        example: [w("読ま", "doushi"), w("ない", "jodoushi")],
        exampleNote: "この「ない」は打ち消しの助動詞",
      },
      {
        term: "た",
        meaning: "過去・完了・存続などを表す。",
        example: [w("読ん", "doushi"), w("だ", "jodoushi")],
        exampleNote: "「読んだ」は過去",
      },
      {
        term: "う・よう",
        meaning: "推量・意志・勧誘などを表す。",
        example: [w("読も", "doushi"), w("う", "jodoushi")],
        exampleNote: "「読もう」は意志(または勧誘)",
      },
      {
        term: "です・ます",
        meaning: "丁寧な言い方(丁寧)を表す。",
        example: [w("読み", "doushi"), w("ます", "jodoushi")],
      },
      {
        term: "だ・そうだ・ようだ",
        meaning: "「だ」は断定、「そうだ」は様態・伝聞、「ようだ」は比況・例示・推定などを表す。",
        example: [w("雨", "meishi"), w("だ", "jodoushi")],
        exampleNote: "「雨だ」の「だ」は断定",
      },
      {
        term: "たい・たがる",
        meaning: "希望(そうしたい、そうしたがっている)を表す。",
        example: [w("読み", "doushi"), w("たい", "jodoushi")],
      },
    ],
  },
  {
    areaId: "ohzaNoMa",
    title: "王座の間",
    intro: "敬語は、話す相手や話題の人への気持ちを表す言葉づかいだよ。",
    entries: [
      {
        term: "尊敬語",
        meaning: "相手や話題の人の動作などを高めて、敬意を表す言い方。",
        example: [w("先生が/"), w("おっしゃる。")],
        exampleNote: "「言う」→「おっしゃる」",
      },
      {
        term: "謙譲語",
        meaning: "自分や身内の動作などを、へりくだって言うことで、相手に敬意を表す言い方。",
        example: [w("私が/"), w("申し上げる。")],
        exampleNote: "「言う」→「申し上げる」",
      },
      {
        term: "丁寧語",
        meaning:
          "話し相手(聞き手)に対して、丁寧に言う言い方。「です」「ます」「ございます」などを使う。だれの動作かに関係なく、聞き手への丁寧さを表す。",
        example: [w("行きます。")],
        exampleNote: "「行く」→「行きます」",
      },
      {
        term: "丁寧語の使い方",
        meaning:
          "物や天気のように、動作をする人がいないものには、尊敬語(いらっしゃる)は使わず、丁寧語(です・ございます・ます)を使う。「ここにある」→「ここにございます」、「雨が降っている」→「雨が降っています」。",
        example: [w("ここに/"), w("ございます。")],
        exampleNote: "「ある」の丁寧語は「ございます」",
      },
      {
        term: "敬語の見分け方",
        meaning:
          "相手や話題の人の動作を高めるのが尊敬語、自分の動作をへりくだるのが謙譲語、聞き手に丁寧に言うのが丁寧語。1つの文に、2種類の敬語が同時に使われることもある。",
        example: [w("先生が/"), w("いらっしゃいます。")],
        exampleNote: "「いらっしゃる」は尊敬語、「ます」は丁寧語",
      },
      {
        term: "「する」の3つの言い方",
        meaning: "同じ「する」でも、尊敬語は「なさる」、謙譲語は「いたす」、丁寧語は「します」と使い分ける。",
        example: [w("なさる(尊敬語)/"), w("いたす(謙譲語)/"), w("します(丁寧語)")],
      },
      {
        term: "二重敬語",
        meaning: "同じ種類の敬語を、重ねて使ってしまうまちがい。ふつうは、1つの敬語だけを使う。",
        example: [w("おっしゃられる(×)/"), w("→ おっしゃる(○)")],
        exampleNote: "「おっしゃる」に「れる」を重ねない",
      },
    ],
  },
];

/** エリアidから図鑑のページを引く */
export function getZukanPage(areaId: string): ZukanPage | undefined {
  return zukanPages.find((p) => p.areaId === areaId);
}
