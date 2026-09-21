import { choiceQ, createChoiceArranger, tapQ } from "@/data/questionBuilders";
import type { ChoiceQuestion } from "@/data/schema";

/**
 * 絆の間(文節相互の関係)。文中タップ(選択式の表示モード tapInSentence)と通常の選択式が混在する。
 * 元データの「ステージ1(12問)→ステージ2(11問)」の並びをそのまま保っている。
 * idは「kizuna-{単元}-{連番}」で、元データの並び順ではなく単元ごとの連番。
 */
const arrange = createChoiceArranger();

const SHUJUTSU = "shujutsu-kankei";
const SHUSHOKU = "shushoku-hishushoku";
const HEIRITSU = "heiritsu-kankei";
const HOJO = "hojo-kankei";
const SETSUZOKU = "setsuzoku-kankei";
const DOKURITSU = "dokuritsu-kankei";

const REL = {
  shujutsu: "主語・述語の関係",
  shushoku: "修飾・被修飾の関係",
  heiritsu: "並立の関係",
  hojo: "補助の関係",
  setsuzoku: "接続の関係",
  dokuritsu: "独立の関係",
};

/** 文中タップ: 文節を空白で区切った sentence の中から、given を基準に correct をタップさせる */
const tap = (
  id: string,
  unit: string,
  question: string,
  sentence: string,
  given: string,
  correct: string,
  explanation: string,
) =>
  tapQ({
    id,
    unit,
    prompt: `${question}しましょう。`,
    sentence,
    given,
    correct,
    explanation,
    autoRuby: true,
  });

/** 通常の選択式: 「A」と「B」の関係を、6つの関係から選ぶ */
const pick = (
  id: string,
  unit: string,
  prompt: string,
  correct: string,
  wrongs: string[],
  explanation: string,
): ChoiceQuestion => {
  const { choices, correctIndex } = arrange(correct, wrongs);
  return choiceQ({ id, unit, prompt, choices, correctIndex, explanation, autoRuby: true });
};

export const kankeiQuestions: ChoiceQuestion[] = [
  // ---- 元データ ステージ1 ----
  tap("kizuna-shujutsu-01", SHUJUTSU, "「弟が」に対応する述語をタップ", "弟が 公園で 元気に 遊ぶ。", "弟が", "遊ぶ", "「誰が」→「どうする」の対応。"),
  tap("kizuna-shujutsu-02", SHUJUTSU, "「空が」に対応する述語をタップ", "空が 真っ赤に 染まった。", "空が", "染まった", "主語と述語は離れていても対応する。"),
  tap("kizuna-shushoku-01", SHUSHOKU, "「白い」が直接修飾する語をタップ", "白い 犬が 元気に 走る。", "白い", "犬が", "「白い」は「犬」の様子を説明している。"),
  tap("kizuna-shushoku-02", SHUSHOKU, "「とても」が直接修飾する語をタップ", "妹は とても 大きな 声で 笑った。", "とても", "大きな", "「とても」は程度を表し、「大きな」を修飾する。"),
  tap("kizuna-heiritsu-01", HEIRITSU, "「兄と」と対等に並ぶ語をタップ", "兄と 弟が 一緒に 出かけた。", "兄と", "弟が", "「兄」と「弟」が対等な立場で並んでいる。"),
  pick("kizuna-heiritsu-02", HEIRITSU, "「赤くて丸いりんご」の「赤くて」と「丸い」の関係は?", REL.heiritsu, [REL.shushoku, REL.hojo], "どちらも対等に「りんご」を説明している。"),
  pick("kizuna-hojo-01", HOJO, "「宿題をやってみる」の「やって」と「みる」の関係は?", REL.hojo, [REL.heiritsu, REL.setsuzoku], "「みる」は本来の意味(見る)を離れ、前の言葉を補う働きをしている。"),
  pick("kizuna-hojo-02", HOJO, "「窓が開けてある」の「開けて」と「ある」の関係は?", REL.hojo, [REL.shujutsu, REL.shushoku], "「ある」は状態が続いていることを補う働き。"),
  pick("kizuna-setsuzoku-01", SETSUZOKU, "「雨が降ったので、中止になった」の「降ったので」と「中止になった」の関係は?", REL.setsuzoku, [REL.heiritsu, REL.dokuritsu], "前後の文をつなぐ働きをしている。"),
  pick("kizuna-setsuzoku-02", SETSUZOKU, "「疲れたけれど、頑張った」の「疲れたけれど」と「頑張った」の関係は?", REL.setsuzoku, [REL.hojo, REL.heiritsu], "逆の内容をつなぐ働き。"),
  pick("kizuna-dokuritsu-01", DOKURITSU, "「はい、分かりました」の「はい」と「分かりました」の関係は?", REL.dokuritsu, [REL.shujutsu, REL.setsuzoku], "「はい」は他の文節と直接関係を持たず、独立している。"),
  pick("kizuna-dokuritsu-02", DOKURITSU, "「ねえ、聞いてる?」の「ねえ」と「聞いてる?」の関係は?", REL.dokuritsu, [REL.shushoku, REL.heiritsu], "呼びかけの言葉は独立の関係になる。"),

  // ---- 元データ ステージ2 ----
  tap("kizuna-shujutsu-03", SHUJUTSU, "「絵は」に対応する述語をタップ", "妹が 描いた 絵は とても 上手だ。", "絵は", "上手だ", "「絵は」が主語、「上手だ」が述語。"),
  tap("kizuna-shujutsu-04", SHUJUTSU, "「部屋は」に対応する述語をタップ", "この 部屋は 静かで 落ち着く。", "部屋は", "落ち着く", "2つの述語的な語があるが、文全体の主語に対応するのは最後の「落ち着く」。"),
  tap("kizuna-shushoku-03", SHUSHOKU, "「かなり」が直接修飾する語をタップ", "かなり 遠くの 町まで 歩いた。", "かなり", "遠くの", "「かなり」は程度を表し、直後の「遠くの」を修飾する。"),
  pick("kizuna-shushoku-04", SHUSHOKU, "「母が作った料理」の「母が」と「作った」の関係は?", REL.shujutsu, [REL.shushoku], "「母が」は「作った」の主語になっている(文全体の主語とは別)。"),
  pick("kizuna-heiritsu-03", HEIRITSU, "「りんごやみかんを買う」の「りんごや」と「みかんを」の関係は?", REL.heiritsu, [REL.shushoku], "対等に並んでいる2つの語。"),
  tap("kizuna-hojo-03", HOJO, "「教えて」を補う語をタップ", "先生が 教えて くれた。", "教えて", "くれた", "「くれた」は「教えて」に意味を付け加える補助的な働き。"),
  pick("kizuna-hojo-04", HOJO, "「片付けておく」の「片付けて」と「おく」の関係は?", REL.hojo, [REL.setsuzoku, REL.heiritsu], "「おく」は前もって〜する、という意味を補っている。"),
  tap("kizuna-setsuzoku-03", SETSUZOKU, "「練習したのに」がつながる語をタップ", "練習したのに、 うまく いかなかった。", "練習したのに", "いかなかった", "逆接でつながっている。"),
  pick("kizuna-setsuzoku-04", SETSUZOKU, "「走ったが、間に合わなかった」の「走ったが」と「間に合わなかった」の関係は?", REL.setsuzoku, [REL.heiritsu, REL.hojo], "逆の内容をつなぐ接続の関係。"),
  pick("kizuna-dokuritsu-03", DOKURITSU, "「うわあ、すごい景色だ」の「うわあ」と「すごい景色だ」の関係は?", REL.dokuritsu, [REL.shushoku], "感動を表す語は他の文節と直接の関係を持たない。"),
  pick("kizuna-dokuritsu-04", DOKURITSU, "「東京、それは日本の首都だ」の「東京」と「それは日本の首都だ」の関係は?", REL.dokuritsu, [REL.shujutsu], "提示された語(東京)が、独立した形で文の前に置かれている。"),
];
