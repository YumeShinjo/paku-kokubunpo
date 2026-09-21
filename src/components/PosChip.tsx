import { findPartOfSpeech } from "@/data/partOfSpeech";
import { Ruby } from "@/components/Ruby";
import { rb } from "@/data/ruby";
import { autoRuby } from "@/data/furigana";

/**
 * 品詞の色のついた札(色 + 品詞名の文字)。色だけに頼らないよう、必ず品詞名をそえる。
 * 使ってよいのは、正解が確定したあと(解答後の結果)と、ことだまの書だけ(5・7章)。
 * 品詞でないid(自立語/付属語など)のときは何も出さない。
 */
export function PosChip({ posId }: { posId: string | undefined }) {
  const pos = findPartOfSpeech(posId);
  if (!pos) return null;
  return (
    <span className="pos-chip" style={{ background: pos.color }}>
      <Ruby text={rb(autoRuby(pos.label))} />
    </span>
  );
}
