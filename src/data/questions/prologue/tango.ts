import { choiceQ } from "@/data/questionBuilders";
import type { ChoiceQuestion } from "@/data/schema";

const UNIT = "tango-kubun";
const PROMPT = "次の文を、単語[たんご]で正しく区切ったものを選びましょう。";

export const tangoQuestions: ChoiceQuestion[] = [
  choiceQ({
    id: "wakare-tango-01",
    unit: UNIT,
    prompt: PROMPT,
    situation: "私は毎日走る。",
    choices: ["私／は／毎日／走る。", "私は／毎日／走る。", "私／は毎日／走る。"],
    correctIndex: 0,
    explanation:
      "「は」は名詞「私」に付く助詞なので、独立した1つの単語として区切る。",
  }),
  choiceQ({
    id: "wakare-tango-02",
    unit: UNIT,
    prompt: PROMPT,
    situation: "彼女は公園で遊ぶ。",
    choices: [
      "彼女は／公園で／遊ぶ。",
      "彼女／は／公園／で／遊ぶ。",
      "彼女／は／公園で／遊ぶ。",
    ],
    correctIndex: 1,
    explanation:
      "「で」は名詞「公園」に付く助詞なので、独立した1つの単語として区切る。",
  }),
  choiceQ({
    id: "wakare-tango-03",
    unit: UNIT,
    prompt: PROMPT,
    situation: "白い花が庭に咲く。",
    choices: [
      "白い花／が／庭に／咲く。",
      "白／い花／が／庭／に／咲く。",
      "白い／花／が／庭／に／咲く。",
    ],
    correctIndex: 2,
    explanation:
      "「白い」は活用する自立語(形容詞)でこれ以上分けられないが、「花」と「が」は別の単語。",
  }),
  choiceQ({
    id: "wakare-tango-04",
    unit: UNIT,
    prompt: PROMPT,
    situation: "弟が大きな声で笑う。",
    choices: [
      "弟／が／大きな／声／で／笑う。",
      "弟／が／大き／な／声／で／笑う。",
      "弟が／大きな声で／笑う。",
    ],
    correctIndex: 0,
    explanation:
      "「大きな」は連体詞1語でこれ以上分けられない。「大き」と「な」に分けないよう注意。",
  }),
  choiceQ({
    id: "wakare-tango-05",
    unit: UNIT,
    prompt: PROMPT,
    situation: "空に大きな虹がかかる。",
    choices: [
      "空に／大きな／虹が／かかる。",
      "空／に／大きな／虹／が／かかる。",
      "空／に／大き／な／虹／が／かかる。",
    ],
    correctIndex: 1,
    explanation: "「大きな」は問4と同じく1語。「虹が」も名詞「虹」と助詞「が」に分ける。",
  }),
  choiceQ({
    id: "wakare-tango-06",
    unit: UNIT,
    prompt: PROMPT,
    situation: "妹は静かに本を読む。",
    choices: [
      "妹／は／静か／に／本／を／読む。",
      "妹は／静かに／本を／読む。",
      "妹／は／静かに／本／を／読む。",
    ],
    correctIndex: 2,
    explanation:
      "「静かに」は形容動詞「静かだ」の活用した形で1語。「静か」と「に」に分けないよう注意。",
  }),
  choiceQ({
    id: "wakare-tango-07",
    unit: UNIT,
    prompt: PROMPT,
    situation: "姉は毎朝コーヒーを飲む。",
    choices: [
      "姉／は／毎朝／コーヒー／を／飲む。",
      "姉は／毎朝／コーヒーを／飲む。",
      "姉／は毎朝／コーヒー／を／飲む。",
    ],
    correctIndex: 0,
    explanation: "「は」「を」はそれぞれ独立した助詞として区切る。",
  }),
  choiceQ({
    id: "wakare-tango-08",
    unit: UNIT,
    prompt: PROMPT,
    situation: "今日は天気がいい。",
    choices: [
      "今日は／天気が／いい。",
      "今日／は／天気が／いい。",
      "今日／は／天気／が／いい。",
    ],
    correctIndex: 2,
    explanation:
      "「は」「が」はそれぞれ独立した助詞として区切る。「天気」と「が」を1つにまとめないよう注意。",
  }),
];
