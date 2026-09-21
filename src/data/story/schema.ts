import type { RubyText } from "@/data/schema";

/*
 * ストーリー演出の型定義(3章: ステージ間のストーリーテキストは短く、必ずスキップ可能)。
 * 出題データと同じ方針で、実際のセリフはコードから分離したデータとして持つ。
 */

/** コト(マスコット)の見せ方。淡く光る(宰相撃破の予兆)/本来の姿(王女コレット)。2章「変身のタイミング」 */
export type MascotForm = "glow" | "true";

export interface StoryLine {
  /** 発話者の表示名。省略時はナレーション(地の文)として表示する */
  speaker?: string;
  text: RubyText;
  /** プレースホルダー表示の切り替え用。本番素材が揃うまでは立ち絵の有無だけを表現する */
  showMascot?: boolean;
  /** 指定するとマスコットを通常の成長姿ではなく、この状態で見せる */
  mascotForm?: MascotForm;
}

/** ストーリーの最後に出す選択肢(王座の間のエンディング分岐)。選ぶと eventId のイベントへ進む。 */
export interface StoryChoiceOption {
  /** 選択の記録に使うキー(将来、称号(二つ名)などに反映する) */
  key: string;
  label: string;
  eventId: string;
}

export interface StoryEvent {
  id: string;
  lines: StoryLine[];
  /** あれば、最後の行のあとに選択肢を出す(スキップしても選択は飛ばせない) */
  choice?: { options: StoryChoiceOption[] };
}
