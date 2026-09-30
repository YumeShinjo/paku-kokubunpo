import type { CharacterPosition } from "@/data/story/schema";
import { facingOfMascot, facingOfSpeaker, keyOfMascot, keyOfSpeaker, type Facing } from "@/data/story/characterFacing";
import { multiScaleFor } from "@/data/story/portraitScale";

/** 顔の向きの逆側に置く(右向き→画面の左寄り。視線が画面の内側=会話テキスト側を向く) */
function sideFor(facing: Facing): CharacterPosition {
  return facing === "right" ? "left" : "right";
}

const opposite = (side: CharacterPosition): CharacterPosition => (side === "left" ? "right" : "left");

export interface PortraitLayout {
  king?: CharacterPosition;
  boss?: CharacterPosition;
  mascot?: CharacterPosition;
  /** 表示倍率(1人のときは 1。2人以上のときは、data/story/portraitScale.ts の倍率)。立ち絵が1人も出ないときは、付かない */
  scale?: { king?: number; boss?: number; mascot?: number };
}

/**
 * ストーリーの1つの台詞で出す立ち絵(王様・小ボス・マスコット)を、それぞれ画面の左右どちらに置くか決める。
 *  - 話者の立ち絵(王様・小ボス)があればそれが主役、なければマスコットが主役。主役は、顔の向きから決める
 *    (override があれば、それを優先する)。
 *  - 王様(小ボス)とマスコットが同じ場面に出るときは、マスコットを反対側に置いて、2人が重ならないようにする。
 *  - 2人以上が出るときは、全員を縮める(scale)。1人だけのときは 1 倍。
 */
export function layoutPortraits(input: {
  speaker: string | undefined;
  showKing: boolean;
  showBoss: boolean;
  showMascot: boolean;
  mascotForm?: string;
  override?: CharacterPosition;
}): PortraitLayout {
  const speakerSide = input.override ?? sideFor(facingOfSpeaker(input.speaker) ?? "left");
  const mascotSide = sideFor(facingOfMascot(input.mascotForm));
  const layout: PortraitLayout = {};
  const hasSpeakerPortrait = input.showKing || input.showBoss;
  if (input.showKing) layout.king = speakerSide;
  if (input.showBoss) layout.boss = speakerSide;
  if (input.showMascot) {
    layout.mascot = hasSpeakerPortrait ? opposite(speakerSide) : (input.override ?? mascotSide);
  }

  const shown = [input.showKing, input.showBoss, input.showMascot].filter(Boolean).length;
  if (shown > 0) {
    const crowded = shown >= 2;
    const speakerKey = keyOfSpeaker(input.speaker) ?? "";
    layout.scale = {};
    if (input.showKing) layout.scale.king = crowded ? multiScaleFor(speakerKey) : 1;
    if (input.showBoss) layout.scale.boss = crowded ? multiScaleFor(speakerKey) : 1;
    if (input.showMascot) layout.scale.mascot = crowded ? multiScaleFor(keyOfMascot(input.mascotForm)) : 1;
  }
  return layout;
}
