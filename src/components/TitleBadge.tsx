import { findImage, IMAGE } from "@/assets/registry";
import { Ruby } from "@/components/Ruby";
import type { PlayerTitle } from "@/data/titles";

/**
 * 称号の表示(ことだまの書・結果画面・タイトル画面で共通)。
 * バッジ画像(ui/badge-<id>)が置かれていればそれを添え、なければ絵文字で仮表示する。
 */
export function TitleBadge({ title, className = "" }: { title: PlayerTitle; className?: string }) {
  const badgeUrl = findImage(IMAGE.titleBadge(title.id));
  return (
    <span className={`title-badge ${className}`.trim()} aria-label={`しょうごう ${title.plain}`}>
      {badgeUrl ? (
        <img className="title-badge-image" src={badgeUrl} alt="" draggable={false} />
      ) : (
        <span aria-hidden="true">🏅 </span>
      )}
      <Ruby text={title.name} />
    </span>
  );
}
