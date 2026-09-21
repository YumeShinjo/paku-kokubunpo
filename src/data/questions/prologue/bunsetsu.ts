import { choiceQ } from "@/data/questionBuilders";
import type { ChoiceQuestion } from "@/data/schema";

const UNIT = "bunsetsu-kubun";
const PROMPT = "次の文を、文節[ぶんせつ]で正しく区切ったものを選びましょう。";

export const bunsetsuQuestions: ChoiceQuestion[] = [
  choiceQ({
    id: "wakare-bunsetsu-01",
    unit: UNIT,
    prompt: PROMPT,
    situation: "私は毎日走る。",
    choices: ["私は／毎日／走る。", "私は毎日／走る。", "私／は毎日走る。"],
    correctIndex: 0,
    explanation:
      "「私は(ネ)毎日(ネ)走る」のように、ネを入れて不自然でない箇所が文節の切れ目。",
  }),
  choiceQ({
    id: "wakare-bunsetsu-02",
    unit: UNIT,
    prompt: PROMPT,
    situation: "彼女は公園で遊ぶ。",
    choices: ["彼女は公園で／遊ぶ。", "彼女は／公園で／遊ぶ。", "彼女／は公園で遊ぶ。"],
    correctIndex: 1,
    explanation: "「公園で」の後にもネを入れられるので、そこも切れ目になる。",
  }),
  choiceQ({
    id: "wakare-bunsetsu-03",
    unit: UNIT,
    prompt: PROMPT,
    situation: "今日は天気がいい。",
    choices: ["今日は天気が／いい。", "今日／は天気がいい。", "今日は／天気が／いい。"],
    correctIndex: 2,
    explanation: "「天気が」の後にもネを入れられる。",
  }),
  choiceQ({
    id: "wakare-bunsetsu-04",
    unit: UNIT,
    prompt: PROMPT,
    situation: "弟が大きな声で笑う。",
    choices: [
      "弟が／大きな／声で／笑う。",
      "弟が／大きな声で／笑う。",
      "弟／が大きな声で笑う。",
    ],
    correctIndex: 0,
    explanation:
      "「大きな」の後にもネを入れられるので、「大きな声で」を1つにまとめてはいけない。",
  }),
  choiceQ({
    id: "wakare-bunsetsu-05",
    unit: UNIT,
    prompt: PROMPT,
    situation: "白い花が庭に咲く。",
    choices: ["白い花が／庭に／咲く。", "白い／花が／庭に／咲く。", "白い／花が／庭に咲く。"],
    correctIndex: 1,
    explanation: "「白い」の後にもネを入れられる。",
  }),
  choiceQ({
    id: "wakare-bunsetsu-06",
    unit: UNIT,
    prompt: PROMPT,
    situation: "姉は毎朝コーヒーを飲む。",
    choices: [
      "姉は毎朝／コーヒーを／飲む。",
      "姉／は毎朝コーヒーを飲む。",
      "姉は／毎朝／コーヒーを／飲む。",
    ],
    correctIndex: 2,
    explanation: "「毎朝」の後にもネを入れられる。",
  }),
  choiceQ({
    id: "wakare-bunsetsu-07",
    unit: UNIT,
    prompt: PROMPT,
    situation: "空に大きな虹がかかる。",
    choices: [
      "空に／大きな／虹が／かかる。",
      "空に大きな／虹が／かかる。",
      "空／に大きな虹がかかる。",
    ],
    correctIndex: 0,
    explanation:
      "「大きな」の後にもネを入れられるので、「大きな虹が」を1つにまとめてはいけない。",
  }),
  choiceQ({
    id: "wakare-bunsetsu-08",
    unit: UNIT,
    prompt: PROMPT,
    situation: "妹は静かに本を読む。",
    choices: [
      "妹は静かに／本を／読む。",
      "妹は／静かに／本を／読む。",
      "妹／は静かに本を読む。",
    ],
    correctIndex: 1,
    explanation: "「静かに」の後にもネを入れられる。",
  }),
];
