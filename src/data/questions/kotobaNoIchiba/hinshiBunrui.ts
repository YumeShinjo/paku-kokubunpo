import { sortingQ } from "@/data/questionBuilders";
import type { SortingQuestion } from "@/data/schema";

const UNIT = "hinshi-bunrui";
const INSTRUCTION =
  "次の文の、白いカードになっている言葉を、正しい品詞[ひんし]のカゴに分けましょう。";

/** 品詞10種(4章)。仕分けゲームの基本カゴとして全バッチで共通利用する。 */
const CATEGORIES = [
  { id: "doushi", label: "動詞" },
  { id: "keiyoushi", label: "形容詞" },
  { id: "keiyoudoushi", label: "形容動詞" },
  { id: "meishi", label: "名詞" },
  { id: "fukushi", label: "副詞" },
  { id: "rentaishi", label: "連体詞" },
  { id: "setsuzokushi", label: "接続詞" },
  { id: "kandoushi", label: "感動詞" },
  { id: "jodoushi", label: "助動詞" },
  { id: "joshi", label: "助詞" },
];

export const hinshiBunruiQuestions: SortingQuestion[] = [
  sortingQ({
    id: "ichiba-pos-batch-01",
    unit: UNIT,
    instruction: INSTRUCTION,
    categories: CATEGORIES,
    items: [
      {
        id: "ichiba-pos-01",
        text: "彼は毎朝公園を「走る」。",
        correctCategoryId: "doushi",
        explanation:
          "言い切りの形がウ段の音(る)で終わる自立語[じりつご]で、動作・存在を表す。",
      },
      {
        id: "ichiba-pos-02",
        text: "机の上に本が「ある」。",
        correctCategoryId: "doushi",
        explanation: "「存在する」という意味を持ち、活用する自立語[じりつご]。",
      },
      {
        id: "ichiba-pos-03",
        text: "「ある」日、旅人が村を訪れた。",
        correctCategoryId: "rentaishi",
        explanation:
          "体言[たいげん]「日」を修飾するだけの、活用しない自立語[じりつご]。動詞の「ある」(存在する)と形は同じだが、働きが違う。",
      },
      {
        id: "ichiba-pos-04",
        text: "この本はとても「面白い」。",
        correctCategoryId: "keiyoushi",
        explanation: "言い切りの形が「い」で終わる、活用する自立語[じりつご]。",
      },
      {
        id: "ichiba-pos-05",
        text: "彼女の部屋はいつも「きれいだ」。",
        correctCategoryId: "keiyoudoushi",
        explanation:
          "言い切りの形が「だ」で終わり、状態・性質を表す、活用する自立語[じりつご]。",
      },
    ],
  }),
  sortingQ({
    id: "ichiba-pos-batch-02",
    unit: UNIT,
    instruction: INSTRUCTION,
    categories: CATEGORIES,
    items: [
      {
        id: "ichiba-pos-06",
        text: "これは私の本「だ」。",
        correctCategoryId: "jodoushi",
        explanation:
          "「本」という名詞(体言[たいげん])に、断定の意味を付け加える付属語[ふぞくご]。「本」と「だ」は別の単語。",
      },
      {
        id: "ichiba-pos-07",
        text: "校庭に「桜」が咲いている。",
        correctCategoryId: "meishi",
        explanation:
          "活用しない自立語[じりつご]で、主語になることができる(体言[たいげん])。",
      },
      {
        id: "ichiba-pos-08",
        text: "彼は「ゆっくり」歩く。",
        correctCategoryId: "fukushi",
        explanation:
          "活用しない自立語[じりつご]で、おもに用言[ようげん](動詞)を修飾する。",
      },
      {
        id: "ichiba-pos-09",
        text: "彼女は「静かに」部屋を出た。",
        correctCategoryId: "keiyoudoushi",
        explanation:
          "「静かだ」の連用形[れんようけい]。言い切りの形「静かだ」に戻せるので形容動詞と判断する。",
      },
      {
        id: "ichiba-pos-10",
        text: "大きな「花」が咲いた。",
        correctCategoryId: "meishi",
        explanation: "「花」自体は活用しない自立語[じりつご]で、文の主語になれる。",
      },
    ],
  }),
  sortingQ({
    id: "ichiba-pos-batch-03",
    unit: UNIT,
    instruction: INSTRUCTION,
    categories: CATEGORIES,
    items: [
      {
        id: "ichiba-pos-11",
        text: "「大きな」花が咲いた。",
        correctCategoryId: "rentaishi",
        explanation:
          "活用せず、体言[たいげん]だけを修飾する自立語[じりつご]。「大きい」(形容詞)と混同しやすいので注意。",
      },
      {
        id: "ichiba-pos-12",
        text: "雨が降った。「しかし」、試合は行われた。",
        correctCategoryId: "setsuzokushi",
        explanation:
          "活用しない自立語[じりつご]で、前後の文や語句をつなぐ働きをする。",
      },
      {
        id: "ichiba-pos-13",
        text: "「ああ」、疲れた。",
        correctCategoryId: "kandoushi",
        explanation:
          "活用しない自立語[じりつご]で、他の文節と直接関係を結ばず、感動・呼びかけなどを表す。",
      },
      {
        id: "ichiba-pos-14",
        text: "花「が」咲く。",
        correctCategoryId: "joshi",
        explanation:
          "活用しない付属語[ふぞくご]で、単独では文節を作れず、語と語の関係を示す。",
      },
      {
        id: "ichiba-pos-15",
        text: "先生が来「られる」ので、生徒たちは立って迎えた。",
        correctCategoryId: "jodoushi",
        explanation:
          "用言[ようげん](動詞)に付いて意味を付け加える活用する付属語[ふぞくご]。ここでは尊敬の意味。",
      },
    ],
  }),
];
