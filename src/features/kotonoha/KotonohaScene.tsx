import type { CSSProperties, ReactNode } from "react";
import { Mascot } from "@/features/mascot/Mascot";
import type { MascotExpression } from "@/assets/registry";
import { Yurai } from "@/features/kotonoha/Yurai";
import { KOTO_FEET_ORIGIN_PERCENT, KOTO_FEET_SHIFT_PERCENT, KOTO_SCALE } from "@/data/kotonohaScale";

/**
 * 言の葉の森の場面: 左にユライ(右向き)、右にホスト役のコト(吹き出しがあれば、ユライの隣)(成長のアクセサリーつき)。背景(森)の上に置く。
 * コトの表情で、正解・不正解の反応を見せる。
 */
export function KotonohaScene({
  expression,
  compact = false,
  bubble,
}: {
  expression?: MascotExpression;
  compact?: boolean;
  /** ユライの吹き出し。あれば、ユライ(左)とコト(右)のあいだ、ユライの隣に出す */
  bubble?: ReactNode;
}) {
  return (
    <div
      className={`kotonoha-scene ${compact ? "is-compact" : ""} ${bubble ? "has-bubble" : ""}`.replace(/\s+/g, " ").trim()}
      style={
        {
          // コトは、ユライと同じ大きさの枠の中で、足元を原点に縮める(足元の高さがそろう)
          "--koto-scale": KOTO_SCALE,
          "--koto-feet-origin": `${KOTO_FEET_ORIGIN_PERCENT}%`,
          "--koto-feet-shift": `${KOTO_FEET_SHIFT_PERCENT}%`,
        } as CSSProperties
      }
    >
      <Yurai className="kotonoha-yurai" />
      {bubble}
      <div className="kotonoha-koto">
        <Mascot size="normal" expression={expression} />
      </div>
    </div>
  );
}
