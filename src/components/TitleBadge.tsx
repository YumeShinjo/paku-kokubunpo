import { Crown } from "lucide-react";
import { findImage, IMAGE } from "@/assets/registry";
import { Ruby } from "@/components/Ruby";
import type { PlayerTitle } from "@/data/titles";

/**
 * 称号の表示。ホーム画面・ことだまの書・エンディング結果の、称号を出すすべての画面で、この部品を使う
 * (見た目は1つだけ。画面ごとにアイコンや大きさを変えない)。
 * バッジ画像(ui/badge-<id>)が置かれていればそれを添え、なければ王冠のアイコンを添える。
 */
export function TitleBadge({ title, className = "" }: { title: PlayerTitle; className?: string }) {
  const badgeUrl = findImage(IMAGE.titleBadge(title.id));
  return (
    <span className={`title-badge ${className}`.trim()} aria-label={`称号 ${title.plain}`}>
      {badgeUrl ? (
        <img className="title-badge-image" src={badgeUrl} alt="" draggable={false} />
      ) : (
        <Crown aria-hidden="true" size={16} className="title-badge-icon" />
      )}
      <Ruby text={title.name} />
    </span>
  );
}
