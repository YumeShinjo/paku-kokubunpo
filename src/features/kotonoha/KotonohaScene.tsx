import { Mascot } from "@/features/mascot/Mascot";
import type { MascotExpression } from "@/assets/registry";
import { Yurai } from "@/features/kotonoha/Yurai";

/**
 * 言の葉の森の場面: 左にユライ(右向き)、右にホスト役のコト(成長のアクセサリーつき)。背景(森)の上に置く。
 * コトの表情で、正解・不正解の反応を見せる。
 */
export function KotonohaScene({ expression, compact = false }: { expression?: MascotExpression; compact?: boolean }) {
  return (
    <div className={`kotonoha-scene ${compact ? "is-compact" : ""}`.trim()}>
      <Yurai className="kotonoha-yurai" />
      <div className="kotonoha-koto">
        <Mascot size="normal" expression={expression} />
      </div>
    </div>
  );
}
