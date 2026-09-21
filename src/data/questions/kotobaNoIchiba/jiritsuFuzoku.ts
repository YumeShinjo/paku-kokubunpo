import { choiceQ } from "@/data/questionBuilders";
import type { ChoiceQuestion } from "@/data/schema";

const UNIT = "jiritsugo-fuzokugo";
const PROMPT_PREFIX = "文中の「%」は自立語[じりつご]・付属語[ふぞくご]のどちらでしょう。";
const CHOICES = ["自立語", "付属語"];

function q(
  id: string,
  target: string,
  situation: string,
  correctIndex: 0 | 1,
  explanation: string,
  hint?: string,
): ChoiceQuestion {
  return choiceQ({
    id,
    unit: UNIT,
    prompt: PROMPT_PREFIX.replace("%", target),
    situation,
    choices: CHOICES,
    correctIndex,
    explanation: hint ? `${explanation}(まちがえやすいポイント: ${hint})` : explanation,
    tags: [correctIndex === 0 ? "自立語" : "付属語"],
  });
}

export const jiritsuFuzokuQuestions: ChoiceQuestion[] = [
  q(
    "ichiba-jiritsu-01",
    "桜",
    "「桜」が咲く。",
    0,
    "単独で意味を持ち、文節の最初に来る語。",
  ),
  q(
    "ichiba-jiritsu-02",
    "が",
    "桜「が」咲く。",
    1,
    "単独で文節を作れず、常に他の自立語[じりつご]の下に付く。",
    "「桜が」を1語と思い込みやすい",
  ),
  q(
    "ichiba-jiritsu-03",
    "静かに",
    "彼は「静かに」話す。",
    0,
    "「静かだ」の連用形[れんようけい]。これで1つの自立語[じりつご](形容動詞)。",
    "「に」を独立した付属語と勘違いしやすい",
  ),
  q(
    "ichiba-jiritsu-04",
    "に",
    "学校「に」行く。",
    1,
    "場所を示す格助詞[かくじょし]。単独では意味をなさず、上の語に付属する。",
    "「学校に」で1語と思い込みやすい",
  ),
  q(
    "ichiba-jiritsu-05",
    "られる",
    "先生が来「られる」。",
    1,
    "尊敬の意味を付け加える助動詞。「来(られる)」と分けられる。",
    "「来られる」全体を動詞1語と思い込みやすい",
  ),
  q(
    "ichiba-jiritsu-06",
    "ない",
    "食べ「ない」。",
    1,
    "打消しの助動詞。「食べ」(未然形[みぜんけい])に付属し、単独で意味を持たない。",
    "問7の「ない」と混同しやすい",
  ),
  q(
    "ichiba-jiritsu-07",
    "ない",
    "彼は美しく「ない」。",
    0,
    "補助形容詞。「美しくはない」と「は」を挟める＝それ自体で独立した語。",
    "問6の「ない」と混同しやすい",
  ),
  q(
    "ichiba-jiritsu-08",
    "大きな",
    "「大きな」夢を持つ。",
    0,
    "連体詞。それ自体で意味を持ち、単独で文節の先頭になれる。",
    "「大きな」を活用語尾だけの付属語部分と勘違いしやすい",
  ),
  q(
    "ichiba-jiritsu-09",
    "う",
    "走ろ「う」。",
    1,
    "意志を表す助動詞。「走ろ」(未然形[みぜんけい])に付属する。",
    "「走ろう」全体を動詞1語と思い込みやすい",
  ),
  q(
    "ichiba-jiritsu-10",
    "しかし",
    "「しかし」、彼は来た。",
    0,
    "接続詞。それ自体で文と文の意味関係を示す独立した語。",
    "「、」の前後で助詞的な働きと勘違いしやすい",
  ),
  q(
    "ichiba-jiritsu-11",
    "ああ",
    "「ああ」、驚いた。",
    0,
    "感動詞。他の文節に頼らず、それだけで文節になる。",
    "感動を表す語だから軽い付け足し(付属語)と勘違いしやすい",
  ),
  q(
    "ichiba-jiritsu-12",
    "ね",
    "これは本です「ね」。",
    1,
    "終助詞。単独で文節を作れず、直前の語に付属する。",
    "「ですね」を1語のあいさつ表現と思い込みやすい",
  ),
  q(
    "ichiba-jiritsu-13",
    "たい",
    "旅行に行き「たい」。",
    1,
    "希望の助動詞。「行き」(連用形[れんようけい])に付属する。",
    "「行きたい」全体を動詞の一種と思い込みやすい",
  ),
  q(
    "ichiba-jiritsu-14",
    "を",
    "魚「を」食べる。",
    1,
    "対象を示す格助詞[かくじょし]。単独では意味をなさない。",
    "「魚を」で1語と思い込みやすい",
  ),
  q(
    "ichiba-jiritsu-15",
    "その",
    "「その」本を読んだ。",
    0,
    "連体詞。それ自体で意味を持ち、体言[たいげん]を修飾する独立した語。",
    "「その」を「本」の一部のように感じやすい",
  ),
];
