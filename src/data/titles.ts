import type { RubyText } from "./schema";
import { rb } from "./ruby";

/**
 * 称号(二つ名)。王座の間のエンディング分岐(ending-choice)での選択に応じて主人公に付く(2章)。
 * 選択は storyStore.choices に「イベントid → 選択肢のキー」で保存されているので、称号はそこから導く
 * (称号そのものは別に保存しない。選択が変われば称号も変わり、二重管理にならない)。
 * 選択肢のキーは data/story/events.ts の ending-choice と一致させること(テストで検証している)。
 */
export interface PlayerTitle {
  /** 選択肢のキーと同じ(称号バッジ画像 ui/badge-<id> のファイル名にも使う) */
  id: string;
  /** ふりがな付きの称号名 */
  name: RubyText;
  /** ふりがななしの称号名(aria-label・テスト用) */
  plain: string;
  /** どの選択でもらえるか(結果画面の補足に使う) */
  reason: string;
}

/** 称号が決まる選択肢を持つイベントのid(王座の間のエンディング分岐) */
export const ENDING_CHOICE_EVENT_ID = "ohzaNoMa-ending-choice";

/** 選択肢のキー → 称号 */
export const endingTitles: Record<string, PlayerTitle> = {
  castle: {
    id: "castle",
    name: rb("言葉[ことば]を結[むす]びし者[もの]"),
    plain: "言葉を結びし者",
    reason: "城に戻り、王家の一員として過ごすことを選んだ",
  },
  journey: {
    id: "journey",
    name: rb("風[かぜ]のことだま使[つか]い"),
    plain: "風のことだま使い",
    reason: "ことだま使いの相棒として、旅を続けることを選んだ",
  },
};

/** 保存された選択(storyStore.choices)から、いま持っている称号を返す。まだ選んでいなければ undefined。 */
export function getEndingTitle(choices: Record<string, string>): PlayerTitle | undefined {
  const key = choices[ENDING_CHOICE_EVENT_ID];
  return key === undefined ? undefined : endingTitles[key];
}
