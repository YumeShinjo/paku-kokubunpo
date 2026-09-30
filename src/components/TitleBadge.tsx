import { Award, Crown } from "lucide-react";
import { findImage, IMAGE } from "@/assets/registry";
import { Ruby } from "@/components/Ruby";
import type { PlayerTitle } from "@/data/titles";

/**
 * 称号の表示(ことだまの書・結果画面・タイトル画面で共通)。
 * バッジ画像(ui/badge-<id>)が置かれていればそれを添え、なければ絵文字で仮表示する。
 */
export function TitleBadge({
  title,
  className = "",
  icon = "award",
}: {
  title: PlayerTitle;
  className?: string;
  /** バッジ画像がないときに添えるアイコン(既定=勲章。タイトル画面は王冠) */
  icon?: "award" | "crown";
}) {
  const Icon = icon === "crown" ? Crown : Award;
  const badgeUrl = findImage(IMAGE.titleBadge(title.id));
  return (
    <span className={`title-badge ${className}`.trim()} aria-label={`称号 ${title.plain}`}>
      {badgeUrl ? (
        <img className="title-badge-image" src={badgeUrl} alt="" draggable={false} />
      ) : (
        <Icon aria-hidden="true" size={16} className="title-badge-icon" />
      )}
      <Ruby text={title.name} />
    </span>
  );
}
