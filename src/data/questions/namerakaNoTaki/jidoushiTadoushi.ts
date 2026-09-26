import { sortingQ } from "@/data/questionBuilders";
import type { SortingQuestion } from "@/data/schema";

const UNIT = "jidoushi-tadoushi";
const INSTRUCTION = "次の動詞を、自動詞と他動詞のカゴに分けましょう。";
const CATEGORIES = [
  { id: "jidoushi", label: "自動詞" },
  { id: "tadoushi", label: "他動詞" },
];

const q = (opts: Parameters<typeof sortingQ>[0]) => sortingQ({ ...opts, autoRuby: true });

/**
 * 自動詞・他動詞は語をランダムに出題する想定のため、各語に独立した解説を持たせている。
 * 仕分けゲームは1画面に複数語を分類させる形式なので、最初の6語は3語ずつ2画面、追加の10語(2026年9月分)は5語ずつ2画面に分けている。
 * 追加分は、対になる語(出る/出す など)が同じ画面に偏らないよう、自動詞と他動詞が混ざるように並べている。
 */
export const jidoushiTadoushiQuestions: SortingQuestion[] = [
  q({
    id: "taki-jitasu-batch-01",
    unit: UNIT,
    instruction: INSTRUCTION,
    categories: CATEGORIES,
    items: [
      {
        id: "taki-jitasu-01",
        text: "止[と]まる",
        correctCategoryId: "jidoushi",
        explanation: "「車が止まる」のように、主語(車)が自分で動く。目的語(〜を)を取らない。",
      },
      {
        id: "taki-jitasu-02",
        text: "止[と]める",
        correctCategoryId: "tadoushi",
        explanation:
          "「車を止める」のように、他のもの(車)に働きかける動作。目的語(〜を)を取る。",
      },
      {
        id: "taki-jitasu-03",
        text: "閉[し]まる",
        correctCategoryId: "jidoushi",
        explanation: "「戸が閉まる」のように、主語(戸)が自分で動く。目的語を取らない。",
      },
    ],
  }),
  q({
    id: "taki-jitasu-batch-02",
    unit: UNIT,
    instruction: INSTRUCTION,
    categories: CATEGORIES,
    items: [
      {
        id: "taki-jitasu-04",
        text: "閉[し]める",
        correctCategoryId: "tadoushi",
        explanation:
          "「戸を閉める」のように、他のもの(戸)に働きかける動作。目的語を取る。",
      },
      {
        id: "taki-jitasu-05",
        text: "上[あ]がる",
        correctCategoryId: "jidoushi",
        explanation:
          "「値段が上がる」のように、主語(値段)が自分で変化する。目的語を取らない。",
      },
      {
        id: "taki-jitasu-06",
        text: "上[あ]げる",
        correctCategoryId: "tadoushi",
        explanation:
          "「値段を上げる」のように、他のもの(値段)に働きかける動作。目的語を取る。",
      },
    ],
  }),
  q({
    id: "taki-jitasu-batch-03",
    unit: UNIT,
    instruction: INSTRUCTION,
    categories: CATEGORIES,
    items: [
      {
        id: "taki-jitasu-07",
        text: "出[で]る",
        correctCategoryId: "jidoushi",
        explanation: "「部屋を出る」のように見えるが、実際は「部屋から出る」の意味で、主語が自分で移動する動き。",
      },
      {
        id: "taki-jitasu-08",
        text: "出[だ]す",
        correctCategoryId: "tadoushi",
        explanation: "「手紙を出す」のように、他のもの(手紙)に働きかける動作。",
      },
      {
        id: "taki-jitasu-09",
        text: "入[はい]る",
        correctCategoryId: "jidoushi",
        explanation: "「教室に入る」のように、主語が自分で移動する動き。",
      },
      {
        id: "taki-jitasu-10",
        text: "入[い]れる",
        correctCategoryId: "tadoushi",
        explanation: "「荷物を入れる」のように、他のもの(荷物)に働きかける動作。",
      },
      {
        id: "taki-jitasu-11",
        text: "落[お]ちる",
        correctCategoryId: "jidoushi",
        explanation: "「石が落ちる」のように、主語(石)が自分で変化する。",
      },
    ],
  }),
  q({
    id: "taki-jitasu-batch-04",
    unit: UNIT,
    instruction: INSTRUCTION,
    categories: CATEGORIES,
    items: [
      {
        id: "taki-jitasu-12",
        text: "落[お]とす",
        correctCategoryId: "tadoushi",
        explanation: "「石を落とす」のように、他のもの(石)に働きかける動作。",
      },
      {
        id: "taki-jitasu-13",
        text: "増[ふ]える",
        correctCategoryId: "jidoushi",
        explanation: "「人数が増える」のように、主語(人数)が自分で変化する。",
      },
      {
        id: "taki-jitasu-14",
        text: "増[ふ]やす",
        correctCategoryId: "tadoushi",
        explanation: "「人数を増やす」のように、他のもの(人数)に働きかける動作。",
      },
      {
        id: "taki-jitasu-15",
        text: "決[き]まる",
        correctCategoryId: "jidoushi",
        explanation: "「予定が決まる」のように、主語(予定)が自分で変化する。",
      },
      {
        id: "taki-jitasu-16",
        text: "決[き]める",
        correctCategoryId: "tadoushi",
        explanation: "「予定を決める」のように、他のもの(予定)に働きかける動作。",
      },
    ],
  }),
];
