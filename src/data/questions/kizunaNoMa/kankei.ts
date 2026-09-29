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
  tap("kizuna-shujutsu-04", SHUJUTSU, "「部屋は」に対応する述語をタップ", "この 部屋は 夜になると 静かだ。", "部屋は", "静かだ", "「部屋は」が主語、「静かだ」が述語。間に「夜になると」が入っても、対応は変わらない。"),
  tap("kizuna-shushoku-03", SHUSHOKU, "「かなり」が直接修飾する語をタップ", "かなり 遠くの 町まで 歩いた。", "かなり", "遠くの", "「かなり」は程度を表し、直後の「遠くの」を修飾する。"),
  pick("kizuna-shushoku-04", SHUSHOKU, "「母が作った料理」の「母が」と「作った」の関係は?", REL.shujutsu, [REL.shushoku], "「母が」は「作った」の主語になっている(文全体の主語とは別)。"),
  pick("kizuna-heiritsu-03", HEIRITSU, "「りんごやみかんを買う」の「りんごや」と「みかんを」の関係は?", REL.heiritsu, [REL.shushoku], "対等に並んでいる2つの語。"),
  tap("kizuna-hojo-03", HOJO, "「教えて」を補う語をタップ", "先生が 教えて くれた。", "教えて", "くれた", "「くれた」は「教えて」に意味を付け加える補助的な働き。"),
  pick("kizuna-hojo-04", HOJO, "「片付けておく」の「片付けて」と「おく」の関係は?", REL.hojo, [REL.setsuzoku, REL.heiritsu], "「おく」は前もって〜する、という意味を補っている。"),
  tap("kizuna-setsuzoku-03", SETSUZOKU, "「練習したのに」がつながる語をタップ", "練習したのに、 うまく いかなかった。", "練習したのに", "いかなかった", "逆接でつながっている。"),
  pick("kizuna-setsuzoku-04", SETSUZOKU, "「走ったが、間に合わなかった」の「走ったが」と「間に合わなかった」の関係は?", REL.setsuzoku, [REL.heiritsu, REL.hojo], "逆の内容をつなぐ接続の関係。"),
  pick("kizuna-dokuritsu-03", DOKURITSU, "「うわあ、すごい景色だ」の「うわあ」と「すごい景色だ」の関係は?", REL.dokuritsu, [REL.shushoku], "感動を表す語は他の文節と直接の関係を持たない。"),
  pick("kizuna-dokuritsu-04", DOKURITSU, "「友情、それは人生の宝だ」の「友情」と「それは人生の宝だ」の関係は?", REL.dokuritsu, [REL.shujutsu], "取り上げたい語(友情)が、独立した形で文の前に置かれている(提示)。"),

  // ---- 追加出題データ(2026年9月分) ----
  tap("kizuna-shujutsu-05", SHUJUTSU, "「夕日が」に対応する述語をタップ", "夕日が 静かに 沈んでいく。", "夕日が", "沈んでいく", "主語「夕日が」に対応する述語は、文末の「沈んでいく」。間に修飾語が入っても対応は変わらない。"),
  tap("kizuna-shujutsu-06", SHUJUTSU, "「夢は」に対応する述語をタップ", "彼の 夢は 宇宙飛行士に なることだ。", "夢は", "なることだ", "「夢は」が主語、「なることだ」が述語。"),
  pick("kizuna-shujutsu-07", SHUJUTSU, "「今日は月曜日だ」の「今日は」と「月曜日だ」の関係は?", REL.shujutsu, [REL.shushoku], "「今日は」が主語、「月曜日だ」が述語。"),
  tap("kizuna-shujutsu-08", SHUJUTSU, "「花が」に対応する述語をタップ", "この 花は とても きれいだ。", "花は", "きれいだ", "「花は」が主語、「きれいだ」が述語。"),
  tap("kizuna-shujutsu-09", SHUJUTSU, "「彼は」に対応する述語をタップ", "彼は 誰よりも 早く 起きる。", "彼は", "起きる", "「彼は」が主語、「起きる」が述語。間に修飾語が入っても対応は変わらない。"),
  tap("kizuna-shujutsu-10", SHUJUTSU, "「花が」に対応する述語をタップ", "花が 咲き、 鳥が 鳴く。", "花が", "咲き、", "「花が」の述語は「鳥が鳴く」ではなく、同じ前半部分にある「咲き」。1つの文に主語・述語の組が2つ含まれることもある。"),
  pick("kizuna-shujutsu-11", SHUJUTSU, "「彼こそ、この計画の責任者だ」の「彼こそ」と「責任者だ」の関係は?", REL.shujutsu, [REL.dokuritsu], "「こそ」が付いていても、「彼こそ」は主語、「責任者だ」は述語という基本の関係は変わらない。"),
  tap("kizuna-shujutsu-12", SHUJUTSU, "「料理は」に対応する述語をタップ", "祖母の 作った 料理は 絶品だ。", "料理は", "絶品だ。", "「料理は」が主語、「絶品だ」が述語。「祖母の作った」という修飾語が間にあっても対応は変わらない。"),

  tap("kizuna-shushoku-05", SHUSHOKU, "「昨日」が直接修飾する語をタップ", "彼は 昨日 買った 本を 読んだ。", "昨日", "買った", "「昨日」は時を表し、直後の「買った」を修飾する。"),
  tap("kizuna-shushoku-06", SHUSHOKU, "「とても」が直接修飾する語をタップ", "妹は とても うれしそうに 笑った。", "とても", "うれしそうに", "「とても」は程度を表し、直後の「うれしそうに」を修飾する。"),
  tap("kizuna-shushoku-07", SHUSHOKU, "「遠くから」が直接修飾する語をタップ", "遠くから 響く 音楽が 聞こえる。", "遠くから", "響く", "「遠くから」は場所を表し、直後の「響く」を修飾する。"),
  pick("kizuna-shushoku-08", SHUSHOKU, "「小さな声で話す」の「小さな」と「声で」の関係は?", REL.shushoku, [REL.heiritsu], "「小さな」は「声で」の様子を説明している。"),
  tap("kizuna-shushoku-09", SHUSHOKU, "「借りた」が直接修飾する語をタップ", "図書館で 借りた 本を、 弟に 貸した。", "借りた", "本を、", "「借りた」は、直後の「本を」を修飾している。"),
  tap("kizuna-shushoku-10", SHUSHOKU, "「かなり」が直接修飾する語をタップ", "彼女は かなり 疲れた 様子だった。", "かなり", "疲れた", "「かなり」は程度を表し、直後の「疲れた」を修飾する。"),
  pick("kizuna-shushoku-11", SHUSHOKU, "「妹が拾った貝殻」の「妹が」と「拾った」の関係は?", REL.shujutsu, [REL.shushoku], "「妹が」は「拾った」の主語になっている(文全体の主語とは別)。"),
  tap("kizuna-shushoku-12", SHUSHOKU, "「新しく」が直接修飾する語をタップ", "駅前に 新しく できた 店に 行った。", "新しく", "できた", "「新しく」は状態を表し、直後の「できた」を修飾する。"),

  tap("kizuna-heiritsu-04", HEIRITSU, "「赤いシャツと」と対等に並ぶ語をタップ", "赤いシャツと 青いシャツを 買った。", "赤いシャツと", "青いシャツを", "「赤いシャツ」と「青いシャツ」が、どちらも「買った」の対象として対等に並んでいる。"),
  pick("kizuna-heiritsu-05", HEIRITSU, "「日曜日か月曜日に行く」の「日曜日か」と「月曜日に」の関係は?", REL.heiritsu, [REL.setsuzoku, REL.hojo], "「日曜日」と「月曜日」のどちらかを、対等な立場で並べて示している。"),
  tap("kizuna-heiritsu-06", HEIRITSU, "「速く」と対等に並ぶ語をタップ", "彼は 速く 正確に 計算した。", "速く", "正確に", "「速く」と「正確に」が、どちらも対等に「計算した」を修飾している。"),
  tap("kizuna-heiritsu-07", HEIRITSU, "「母と」と対等に並ぶ語をタップ", "母と 姉が 旅行に 出かけた。", "母と", "姉が", "「母」と「姉」が対等な立場で並んでいる。"),
  pick("kizuna-heiritsu-08", HEIRITSU, "「軽くておいしいケーキ」の「軽くて」と「おいしい」の関係は?", REL.heiritsu, [REL.shushoku], "どちらも対等に「ケーキ」を説明している。"),
  tap("kizuna-heiritsu-09", HEIRITSU, "「赤色と」と対等に並ぶ語をタップ", "赤色と 白色を 混ぜて 作った。", "赤色と", "白色を", "「赤色」と「白色」が対等な立場で並んでいる。"),
  pick("kizuna-heiritsu-10", HEIRITSU, "「安くて軽いかばん」の「安くて」と「軽い」の関係は?", REL.heiritsu, [REL.hojo], "どちらも対等に「かばん」を説明している。"),
  tap("kizuna-heiritsu-11", HEIRITSU, "「兄も」と対等に並ぶ語をタップ", "兄も 弟も 同じ 学校に 通う。", "兄も", "弟も", "「兄」と「弟」が対等な立場で並んでいる。"),
  pick("kizuna-heiritsu-12", HEIRITSU, "「みかんとりんごを買う」の「みかんと」と「りんごを」の関係は?", REL.heiritsu, [REL.shushoku], "対等に並んでいる2つの語。"),

  pick("kizuna-hojo-05", HOJO, "「電気をつけておく」の「つけて」と「おく」の関係は?", REL.hojo, [REL.heiritsu], "「おく」は前もって〜する、という意味を補う働き。"),
  tap("kizuna-hojo-06", HOJO, "「走り抜いて」を補う語をタップ", "彼は 最後まで 走り抜いて みせた。", "走り抜いて", "みせた。", "「みせた」は「走り抜いて」に意味を付け加える補助的な働き。"),
  pick("kizuna-hojo-07", HOJO, "「宿題を忘れてしまった」の「忘れて」と「しまった」の関係は?", REL.hojo, [REL.setsuzoku], "「しまった」は、〜し終える、という意味を補う働き。"),
  tap("kizuna-hojo-08", HOJO, "「準備して」を補う語をタップ", "荷物は もう 準備して ある。", "準備して", "ある。", "「ある」は状態が続いていることを補う働き。"),
  pick("kizuna-hojo-09", HOJO, "「先生に聞いてみる」の「聞いて」と「みる」の関係は?", REL.hojo, [REL.shushoku], "「みる」は本来の意味(見る)を離れ、試しに〜する、という意味を補う働き。"),
  tap("kizuna-hojo-10", HOJO, "「片付いて」を補う語をタップ", "この 部屋は いつも 片付いて いる。", "片付いて", "いる。", "「いる」は状態が続いていることを補う働き。"),
  pick("kizuna-hojo-11", HOJO, "「電話をかけ直してほしい」の「かけ直して」と「ほしい」の関係は?", REL.hojo, [REL.heiritsu], "「ほしい」は、そうしてもらいたいという気持ちを補う働き。"),
  tap("kizuna-hojo-12", HOJO, "「覚えて」を補う語をタップ", "彼女は その 話を 覚えて いない。", "覚えて", "いない。", "「いない」は状態が続いていないことを補う働き。"),

  tap("kizuna-setsuzoku-05", SETSUZOKU, "「更けたので、」がつながる語をタップ", "夜が 更けたので、 そろそろ 帰ろう。", "更けたので、", "帰ろう。", "原因・理由でつながっている。"),
  pick("kizuna-setsuzoku-06", SETSUZOKU, "「呼んだが、返事がなかった」の「呼んだが」と「返事がなかった」の関係は?", REL.setsuzoku, [REL.heiritsu], "逆の内容をつなぐ働き。"),
  tap("kizuna-setsuzoku-07", SETSUZOKU, "「遅れたため、」がつながる語をタップ", "電車が 遅れたため、 遅刻した。", "遅れたため、", "遅刻した。", "原因・理由でつながっている。"),
  pick("kizuna-setsuzoku-08", SETSUZOKU, "「呼んだけれど、聞こえなかったようだ」の「呼んだけれど」と「聞こえなかったようだ」の関係は?", REL.setsuzoku, [REL.hojo], "逆の内容をつなぐ接続の関係。"),
  tap("kizuna-setsuzoku-09", SETSUZOKU, "「あったので、」がつながる語をタップ", "熱が あったので、 学校を 休んだ。", "あったので、", "休んだ。", "原因・理由でつながっている。"),
  pick("kizuna-setsuzoku-10", SETSUZOKU, "「探したけれど、見つからなかった」の「探したけれど」と「見つからなかった」の関係は?", REL.setsuzoku, [REL.heiritsu], "逆の内容をつなぐ接続の関係。"),
  tap("kizuna-setsuzoku-11", SETSUZOKU, "「晴れたので、」がつながる語をタップ", "空が 晴れたので、 洗濯物を 干した。", "晴れたので、", "干した。", "原因・理由でつながっている。"),
  pick("kizuna-setsuzoku-12", SETSUZOKU, "「頑張ったのに、結果が出なかった」の「頑張ったのに」と「結果が出なかった」の関係は?", REL.setsuzoku, [REL.hojo], "逆の内容をつなぐ接続の関係。"),

  pick("kizuna-dokuritsu-05", DOKURITSU, "「もしもし、聞こえますか」の「もしもし」と「聞こえますか」の関係は?", REL.dokuritsu, [REL.shujutsu], "呼びかけの言葉は独立の関係になる。"),
  pick("kizuna-dokuritsu-06", DOKURITSU, "「ああ、間に合わなかった」の「ああ」と「間に合わなかった」の関係は?", REL.dokuritsu, [REL.shushoku], "感動を表す語は他の文節と直接の関係を持たない。"),
  pick("kizuna-dokuritsu-07", DOKURITSU, "「そう、それでいいと思う」の「そう」と「それでいいと思う」の関係は?", REL.dokuritsu, [REL.setsuzoku], "相手の言葉への応答を表す語は、独立の関係になる。"),
  pick("kizuna-dokuritsu-08", DOKURITSU, "「勇気、それが今の彼には必要だ」の「勇気」と「それが今の彼には必要だ」の関係は?", REL.dokuritsu, [REL.shujutsu], "取り上げたい語(勇気)が、独立した形で文の前に置かれている(提示)。"),
  pick("kizuna-dokuritsu-09", DOKURITSU, "「いいえ、そうではありません」の「いいえ」と「そうではありません」の関係は?", REL.dokuritsu, [REL.setsuzoku], "応答・返事の言葉は独立の関係になる。"),
  pick("kizuna-dokuritsu-10", DOKURITSU, "「おや、雨が降ってきた」の「おや」と「雨が降ってきた」の関係は?", REL.dokuritsu, [REL.shushoku], "驚きを表す語は他の文節と直接の関係を持たない。"),
  pick("kizuna-dokuritsu-11", DOKURITSU, "「山田くん、荷物を運んでくれないか」の「山田くん」と「荷物を運んでくれないか」の関係は?", REL.dokuritsu, [REL.shujutsu], "呼びかけの語は、独立の関係になる。"),
  pick("kizuna-dokuritsu-12", DOKURITSU, "「平和、それは人類共通の願いだ」の「平和」と「それは人類共通の願いだ」の関係は?", REL.dokuritsu, [REL.shujutsu], "取り上げたい語(平和)が、独立した形で文の前に置かれている(提示)。"),
];
