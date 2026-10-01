import { IMAGE } from "@/assets/registry";
import { autoRuby } from "@/data/furigana";
import {
  lastBossClearStoryId,
  subBossClearStoryId,
  truthStoryId,
} from "@/features/story/storyIds";

/**
 * ことだまの書「なかまの ずかん」のデータ(12行 = 10枠)。
 * 1つの「枠」(キャラクター)に、見た目・文章が変わる「版」が1〜2つある(コト→コレット、王様→ヴェルバルト)。
 *  - 解放: 版ごとの条件(見たストーリーの記録 / 言の葉の森への入場)。条件を満たした最後の版を出す。
 *  - 最初の版が解放されるまで、枠は「？？？」。hiddenUntilUnlocked の枠は、枠ごと表示しない(総数にも数えない)。
 *  - 「役職・持ち場」の括弧内(内部注記)は、画面に出さない。コト(前)は「主人公の相棒」、コレット(後)は「王女」。
 * ふりがなは付けずに書く。画面に出すとき nakamaRuby() が、文法用語と読みの難しい語(NAKAMA_READINGS)に記法を付け、
 * <Rb> が、rubyPolicy.ts の方針(文法用語・HARD_WORDS)に残る語だけを出す。足す語は、HARD_WORDS にも足すこと。
 */

/** 解放の条件。story は、そのストーリーイベントを見終わったこと(storyStore の seenStoryIds) */
export type UnlockRule =
  | { kind: "always" }
  | { kind: "story"; storyId: string }
  /** 言の葉の森に、はじめて入場したこと(kotonohaStore の enteredForest) */
  | { kind: "forest" };

export interface CharacterVersion {
  /** 版のid(枠のなかで一意) */
  id: string;
  /** 立ち絵(registry の素材名) */
  image: string;
  /** 浄化前の立ち絵(小ボスのみ。詳細で切り替えて見られる) */
  imageBefore?: string;
  /** 名前(見出し) */
  name: string;
  /** 名前のあとに、かっこで添える注記(例: もとの名は コト) */
  nameNote?: string;
  /** 名前の由来 */
  origin?: string;
  /** 役職と持ち場(括弧内の内部注記は含めない) */
  role?: string;
  place?: string;
  /** ひとこと(吹き出し) */
  hitokoto: string;
  /** メモの語り手(コト / コレット) */
  memoBy: string;
  /** メモ。段落ごとに1つ(元の文の <br> の区切り) */
  memo: string[];
  /** ことばの ひとくち。ないキャラクターは undefined(その欄を出さない) */
  hitokuchi?: string;
  unlock: UnlockRule;
}

export interface CharacterSlot {
  id: string;
  /** 解放されるまで、枠ごと表示しない(「？？？」も出さない) */
  hiddenUntilUnlocked?: boolean;
  /** 解放前の「？？？」の枠に出すシルエットの素材(なければ、人影のアイコン) */
  silhouette?: string;
  versions: CharacterVersion[];
}

const clear = (areaId: string): UnlockRule => ({ kind: "story", storyId: subBossClearStoryId(areaId) });

export const ZUKAN_CHARACTERS: readonly CharacterSlot[] = [
  {
    id: "koto",
    versions: [
      {
        id: "before",
        image: IMAGE.mascotBase,
        name: "コト",
        origin: "和語「言」から",
        role: "主人公の相棒",
        hitokoto: "よくないよ!言葉は、ちゃんと伝えたい人がいるから大事なの!",
        memoBy: "コト",
        memo: [
          "頭に乗っている葉っぱ、これ「コトノ葉」って言うんだって。自分でもいつの間にかそう呼んでた気がする。",
          "わたしの / あたまに / のってる / 葉っぱ。……こうやって、文を細かく区切ってみると、ひとつひとつの言葉がどこで切れてるか分かるんだ。「ネ」を入れてみて、変じゃないところで切れば、そこが文節の境目。",
          "あなたは言葉を話さない。だから、わたしが代わりに喋る。最初はそれでいいと思ってたけど、最近、わたしのほうが喋りすぎてる気もする。",
          "服につけてるアクセサリー、1つずつ増えてきてる。ポーチに腕輪、スカーフにブローチ……みんなを助けるたびに、何かが増えていくの、ちょっと嬉しい。",
        ],
        hitokuchi:
          "文は、いくつかの「文節」に分けられる。「ネ・サ・ヨ」を入れて不自然にならないところが、文節の切れ目。例:わたしの(ネ) あたまに(ネ) のってる(ネ) 葉っぱ。",
        unlock: { kind: "always" },
      },
      {
        id: "after",
        image: IMAGE.mascotTrue,
        name: "コレット",
        nameNote: "もとの名は コト",
        origin: "和語「言」+ 西洋風の女性名の語尾 -ette",
        role: "王女",
        hitokoto: "ねえ……わたしが王女だってわかったのに、あなたの態度、全然変わらないね。",
        memoBy: "コレット",
        memo: [
          "わたしの本当の名前は、コレット。王様の娘で、小さいころ乱れに巻き込まれて、ずっとコトの姿のままでいたんだって。",
          "正体が分かっても、あなたの態度は、前と何も変わらなかった。それが、すごく嬉しかった。",
          "名前が変わっても、わたしはわたしのまま。これからも、よろしくね。",
        ],
        unlock: { kind: "story", storyId: lastBossClearStoryId("ohzaNoMa") },
      },
    ],
  },
  {
    id: "mei",
    silhouette: IMAGE.subBossPurified("kotobaNoIchiba"),
    versions: [
      {
        id: "main",
        image: IMAGE.subBossPurified("kotobaNoIchiba"),
        imageBefore: IMAGE.subBoss("kotobaNoIchiba"),
        name: "メイ",
        origin: "名詞から",
        role: "侍女見習い",
        place: "ことばの市場",
        hitokoto: "あの、お城で使う…「拭く」を10枚、ください……!",
        memoBy: "コト",
        memo: [
          "メイって、名詞の「めいし」から来てるんだって。なのに、物の名前がいちばん出てこない子だった。",
          "布巾を「拭く」って言って買おうとしてたの、店主さんもちょっと困ってた。「拭く」は動詞で、ほしいのは布巾っていう名詞なのに。",
          "正気に戻ったあと、「さっきは布巾を『拭く』って言って買おうとしてました…」って、自分で思い出して恥ずかしそうにしてた。真面目な子なんだと思う。",
        ],
        hitokuchi:
          "×「拭くを ください」 → ◎「布巾を ください」。物の名前を表す言葉が「名詞」。動作を表す言葉(動詞)とは違う。名詞がはっきりしないと、何がほしいのか伝わらない。",
        unlock: clear("kotobaNoIchiba"),
      },
    ],
  },
  {
    id: "reru",
    silhouette: IMAGE.subBossPurified("sugatakaeNoKajiba"),
    versions: [
      {
        id: "main",
        image: IMAGE.subBossPurified("sugatakaeNoKajiba"),
        imageBefore: IMAGE.subBoss("sugatakaeNoKajiba"),
        name: "レル",
        origin: "助動詞「れる」から",
        role: "鍛冶見習い",
        place: "姿変えの鍛冶場",
        hitokoto: "くっ…もう、この炎を、支えれない…いや、支えられない…?あれ、わたしは何を言おうと…",
        memoBy: "コト",
        memo: [
          "レルって名前、助動詞の「れる」からもらったんだって。それなのに、本人がいちばん「ら」を落としちゃうの、ちょっとおかしいよね。",
          "炎のそばで、自分の言い方に自分でつっこんでた。「支えれない…いや、支えられない…?」って。",
          "正気に戻ったあとは、何があったかよく覚えてないみたいだった。後で見たら、鍛冶場の火はちゃんと元どおりになってたよ。",
        ],
        hitokuchi:
          "×「支えれない」 → ◎「支えられない」。「食べる」「見る」「支える」のような一段活用の動詞に、可能の「られる」をつけるとき、「ら」が抜けやすい。これが「ら抜き言葉」。",
        unlock: clear("sugatakaeNoKajiba"),
      },
    ],
  },
  {
    id: "onvin",
    silhouette: IMAGE.subBossPurified("namerakaNoTaki"),
    versions: [
      {
        id: "main",
        image: IMAGE.subBossPurified("namerakaNoTaki"),
        imageBefore: IMAGE.subBoss("namerakaNoTaki"),
        name: "オンヴィン",
        origin: "音便から",
        role: "文官",
        place: "なめらかの滝",
        hitokoto: "報告、いたし…言いた…もうしあげ…あれ、どの言い方が正しいのか、分からなく…",
        memoBy: "コト",
        memo: [
          "文官さんで、お城の命令で滝の水量を調べに来てたんだって。仕事中なのに、言葉がガクガクになっちゃって大変そうだった。",
          "正気に戻ってからは、「『申し上げます』も『言いた』もごちゃごちゃで、我ながら意味不明な報告書になるところでした」って、ちょっと照れてた。気にしいな性格なのかも。",
          "報告書、ちゃんと書けたのかな。滝の水も、元どおりなめらかに流れ始めてたし、大丈夫だと思う。",
        ],
        hitokuchi:
          "×「言いた」 → ◎「言った」。「言う」に「た」が続くとき、「言いた」ではなく「言った」と音が変わる。これが音便(促音便)。",
        unlock: clear("namerakaNoTaki"),
      },
    ],
  },
  {
    id: "jozetto",
    silhouette: IMAGE.subBossPurified("tsunagiNoHashi"),
    versions: [
      {
        id: "main",
        image: IMAGE.subBossPurified("tsunagiNoHashi"),
        imageBefore: IMAGE.subBoss("tsunagiNoHashi"),
        name: "ジョゼット",
        origin: "助詞から",
        role: "メイド長",
        place: "つなぎの橋",
        // 本編(events.ts)の台詞は「お持ち…いたしました…」「お持ちいたしました」。ひとこと・メモ・ひとくちの3か所とも、「お持ちいたしました」にそろえる
        hitokoto: "紅茶、お持ち…いたしました…あら?何か、言葉が足りない気が…",
        memoBy: "コト",
        memo: [
          "メイド長さんで、橋を渡ってくる客人を出迎える役目だったんだって。お盆を手にして、ずっと立ってた。",
          "「紅茶、お持ちいたしました」って、「を」が抜けてるの、本人も気づいてなさそうだった。正気に戻ったら、今度はすごく丁寧になって、わたしに向かって一礼されちゃった。なんだか、妙に落ち着かなかったな。",
          "助詞の名前をもらってるのに、助詞を落としちゃうところ、ちょっとだけメイと似てる気がする。",
        ],
        hitokuchi:
          "×「紅茶、お持ちいたしました」 → ◎「紅茶を、お持ちいたしました」。言葉と言葉のつながりを示す「を」のような言葉が「助詞」。これが抜けると、意味は伝わっても、文として据わりが悪くなる。",
        unlock: clear("tsunagiNoHashi"),
      },
    ],
  },
  {
    id: "nejirarudo",
    silhouette: IMAGE.subBossPurified("kizunaNoMa"),
    versions: [
      {
        id: "main",
        image: IMAGE.subBossPurified("kizunaNoMa"),
        imageBefore: IMAGE.subBoss("kizunaNoMa"),
        name: "ネジラルド",
        origin: "「ねじれ」から",
        role: "騎士団長",
        place: "絆の間",
        hitokoto: "私の誇りは、剣を極めたい…いや、極めることだ…?いや、待て、これは主語と述語が……",
        memoBy: "コト",
        memo: [
          "騎士団長さんで、訓練場を守ってる人。立派な体格なのに、自分の言葉のねじれにいちばん動揺してた。",
          "「騎士団長として恥ずべきことだ!」って、真面目すぎるくらい真面目に落ち込んでた。正気に戻ってからも、「今のは主語と述語、合っていたか……?」って自分で確認してて、律儀な人なんだと思う。",
          "的や武具も、ちゃんと元の位置に並び直ってた。几帳面なところ、言葉にも表れてたのかも。",
        ],
        hitokuchi:
          "×「私の誇りは、剣を極めたいのです」 → ◎「私の誇りは、剣を極めることです」。「〜は」で始めた文の終わりが、始めの言葉とかみ合わないことがある。これが「ねじれ文」。主語と述語を、最後にもう一度見比べてみよう。",
        unlock: clear("kizunaNoMa"),
      },
    ],
  },
  {
    id: "sairasu",
    silhouette: IMAGE.subBossPurified("mikakeNoMa"),
    versions: [
      {
        id: "main",
        image: IMAGE.subBossPurified("mikakeNoMa"),
        imageBefore: IMAGE.subBoss("mikakeNoMa"),
        name: "サイラス",
        origin: "「さ入れ」から",
        role: "大臣",
        place: "見分けの間",
        hitokoto: "これは、行かさせて…いえ、行かせて…いただき…おかしいな、言葉が二重に…",
        memoBy: "コト",
        memo: [
          "大臣さんで、みんなに説明する役目。「させていただかさせていただきます」しか言ってない気がして、聞いてるこっちも混乱した。",
          "丁寧に話そうとするほど、言葉がこんがらがっていくみたいだった。正気に戻ったら「少々、言葉を飾りすぎていたようです」って、素直に認めてたのが意外だった。",
          "正直に話してくれたら、それでいいのにね。",
        ],
        hitokuchi:
          "×「行かさせていただきます」 → ◎「行かせていただきます」。「行かせる」など五段活用の動詞に「せる」をつけるとき、いらない「さ」を入れてしまうのが「さ入れ言葉」。",
        unlock: clear("mikakeNoMa"),
      },
    ],
  },
  {
    id: "nijuveru",
    silhouette: IMAGE.subBossPurified("ohzaNoMa"),
    versions: [
      {
        id: "main",
        image: IMAGE.subBossPurified("ohzaNoMa"),
        imageBefore: IMAGE.subBoss("ohzaNoMa"),
        name: "ニジュヴェール",
        origin: "「二重」から",
        role: "宰相",
        place: "王座の間",
        hitokoto: "おやおや、ここまでいらっしゃられるとは。よくぞおいでくださられましたね。",
        memoBy: "コト",
        memo: [
          "宰相さんで、王座の間でずっと待ち構えてた人。話し方が、やけに回りくどくて、丁寧すぎて変だなって最初は思ってた。",
          "撃破したあと、膝をついて、全部打ち明けてくれた。正しい言葉を誰よりも守りたかったこと。でも、その「正しさ」へのこだわりが、乱れにつけ込まれる隙になっちゃったこと。",
          "最後に言ってた「言葉は、生きているものだと、忘れていました」って一言、わたし、今でもたまに思い出す。",
        ],
        hitokuchi:
          "×「おっしゃられる」 → ◎「おっしゃる」。敬語を、必要以上に重ねてしまう言い方が「二重敬語」。丁寧にしようとする気持ちが強すぎると、かえって変になってしまう。",
        unlock: clear("ohzaNoMa"),
      },
    ],
  },
  {
    // 王様の枠は、真相究明(truth)を見終わるまで、存在ごと表示しない
    id: "lastboss",
    hiddenUntilUnlocked: true,
    versions: [
      {
        id: "before",
        image: IMAGE.lastBossPossessed,
        name: "王様",
        nameNote: "名前は不明",
        place: "王座の間",
        hitokoto: "正しい言葉など、いらな……いる……どちらでも……どうでもよい……",
        memoBy: "コト",
        memo: [
          "王座に座っていた人。紫の靄をまとって、何を言っているのかも、自分でよく分かっていないみたいだった。",
          "「よくないよ!」って、わたし、思わず言い返しちゃった。言葉は、ちゃんと伝えたい人がいるから大事なんだって。",
          "これから、この人に向き合わなきゃいけない。それだけは、はっきり分かった。",
        ],
        unlock: { kind: "story", storyId: truthStoryId("ohzaNoMa") },
      },
      {
        id: "after",
        image: IMAGE.lastBossPurified,
        name: "ヴェルバルト",
        nameNote: "もとは 王様",
        origin: "ラテン語 verbum「言葉」+ -bald「支配者」",
        place: "王座の間",
        hitokoto: "……ここは……わたしは、一体……",
        memoBy: "コレット",
        memo: [
          "正気に戻ったこの人の名前は、ヴェルバルト。わたしを見て、「まさか……お前は……」って、声を震わせてた。",
          "あの御守り、化け狸の姿を宿すものだったんだって。乱れは、わたしごとその姿に閉じ込めてしまったらしい。小さな体のまま、ずっと城を彷徨っていたって、この人は言ってた。わたしは、途中までしか覚えてないけど。",
          "「気づいてやれなかった」って謝られたとき、わたしも、なんて言えばいいか分からなかった。でも、ちゃんと思い出せたのは、この人のおかげ。",
        ],
        unlock: { kind: "story", storyId: lastBossClearStoryId("ohzaNoMa") },
      },
    ],
  },
  {
    id: "yurai",
    silhouette: IMAGE.kotonohaYurai,
    versions: [
      {
        id: "main",
        image: IMAGE.kotonohaYurai,
        name: "ユライ",
        origin: "「由来」から",
        role: "言の葉の森の案内役",
        hitokoto: "……ことばが、葉に なって ねむってる。",
        memoBy: "コト",
        memo: [
          "言の葉の森で会った、無口な旅人。世界中を旅してるんだって。多くは語らないけど、ことわざや故事成語のことはすごく詳しい。",
          "何を聞いても、はぐらかされるみたいな、ちょっと不思議な受け答えをする。でも、嫌な感じはしなくて、一緒にいると落ち着く。",
          "どこから来て、どこへ行くのか——聞いても、たぶん教えてくれない気がする。",
        ],
        hitokuchi: "ことわざは、昔から言い伝えられてきた教え。故事成語は、昔の出来事や書物に由来する言葉。",
        unlock: { kind: "forest" },
      },
    ],
  },
];

/** 解放の判定に使う、いまの状態(見たストーリーの記録・言の葉の森への入場) */
export interface UnlockState {
  hasSeen: (storyId: string) => boolean;
  enteredForest: boolean;
}

export function isRuleMet(rule: UnlockRule, state: UnlockState): boolean {
  if (rule.kind === "always") return true;
  if (rule.kind === "story") return state.hasSeen(rule.storyId);
  return state.enteredForest;
}

/** 画面に出す枠1つぶんの状態。version は、解放済みのときの、いま出す版(条件を満たした最後の版) */
export interface ResolvedCharacter {
  slot: CharacterSlot;
  version?: CharacterVersion;
}

/**
 * 表示する枠の一覧(王様の枠は、解放されるまで含めない)。解放されていない枠は version が undefined(「？？？」)。
 * 総数は、この一覧の長さ(王様が出るまで 9、出たら 10)。
 */
export function resolveCharacters(
  state: UnlockState,
  slots: readonly CharacterSlot[] = ZUKAN_CHARACTERS,
): ResolvedCharacter[] {
  const result: ResolvedCharacter[] = [];
  for (const slot of slots) {
    const met = slot.versions.filter((v) => isRuleMet(v.unlock, state));
    if (met.length === 0 && slot.hiddenUntilUnlocked) continue;
    result.push({ slot, version: met[met.length - 1] });
  }
  return result;
}

/**
 * ふりがなの記法を付ける、読みの難しい語。画面に出るのは、rubyPolicy.ts の HARD_WORDS に残る語だけ
 * (ここに足した語は、HARD_WORDS にも足すこと)。語の直前に、別の漢字が続かない箇所にだけ付ける
 * (「言葉」の「葉」などに、誤って付けない)。直後に漢字が続く語(侍女見習い・鍛冶場)も付けられる。
 */
export const NAKAMA_READINGS: ReadonlyArray<readonly [word: string, reading: string]> = [
  ["宰相", "さいしょう"],
  ["侍女", "じじょ"],
  ["鍛冶", "かじ"],
  ["絆", "きずな"],
  ["彷徨", "さまよ"],
  ["律儀", "りちぎ"],
  ["几帳面", "きちょうめん"],
  ["布巾", "ふきん"],
  ["拭", "ふ"],
  ["御守", "おまも"],
  ["狸", "たぬき"],
  ["靄", "もや"],
  ["膝", "ひざ"],
  ["撃破", "げきは"],
  ["和語", "わご"],
  ["据", "す"],
  ["震", "ふる"],
  ["喋", "しゃべ"],
  ["嬉", "うれ"],
  ["葉", "は"],
];

const READINGS_PATTERN = new RegExp(
  "(?<!\\p{Script=Han})(" +
    NAKAMA_READINGS.map(([word]) => word)
      .sort((a, b) => b.length - a.length)
      .join("|") +
    ")(?!\\[)",
  "gu",
);
const READING_OF = new Map(NAKAMA_READINGS);

/** 図鑑の文に、ふりがなの記法("漢字[ふりがな]")を付ける。文法用語は autoRuby、そのほかの難読語は NAKAMA_READINGS */
export function nakamaRuby(text: string): string {
  return autoRuby(text.replaceAll("言の葉の森", "言[こと]の葉[は]の森[もり]").replaceAll("「言」", "「言[こと]」")).replace(
    READINGS_PATTERN,
    (word) => `${word}[${READING_OF.get(word)}]`,
  );
}
