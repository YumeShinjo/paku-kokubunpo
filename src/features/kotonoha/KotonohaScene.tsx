import type { ReactNode } from "react";
import { Mascot } from "@/features/mascot/Mascot";
import type { MascotExpression } from "@/assets/registry";
import { Yurai } from "@/features/kotonoha/Yurai";

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
    <div className={`kotonoha-scene ${compact ? "is-compact" : ""} ${bubble ? "has-bubble" : ""}`.replace(/\s+/g, " ").trim()}>
      <Yurai className="kotonoha-yurai" />
      {bubble}
      <div className="kotonoha-koto">
        <Mascot size="normal" expression={expression} />
      </div>
    </div>
  );
}
