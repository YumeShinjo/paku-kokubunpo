import { Crown } from "lucide-react";
import { findImage, IMAGE } from "@/assets/registry";
import { Ruby } from "@/components/Ruby";
import type { PlayerTitle } from "@/data/titles";

/**
 * 称号の表示。ホーム画面・ことだまの書・エンディング結果の、称号を出すすべての画面で、この部品を使う
 * (見た目は1つだけ。画面ごとにアイコンや大きさを変えない)。
 * バッジ画像(ui/badge-<id>)が置かれていればそれを添え、なければ王冠のアイコンを添える。
 * flat は、押せない場所(ホーム画面の称号と進捗)用。枠・背景のチップをやめて、アイコンと文字だけにする(ボタンに見えないように)。
 */
export function TitleBadge({ title, className = "", flat = false }: { title: PlayerTitle; className?: string; flat?: boolean }) {
  const badgeUrl = findImage(IMAGE.titleBadge(title.id));
  return (
    <span className={`title-badge ${flat ? "title-badge-flat" : ""} ${className}`.replace(/\s+/g, " ").trim()} aria-label={`称号 ${title.plain}`}>
      {badgeUrl ? (
        <img className="title-badge-image" src={badgeUrl} alt="" draggable={false} />
      ) : (
        <Crown aria-hidden="true" size={16} className="title-badge-icon" />
      )}
      <Ruby text={title.name} />
    </span>
  );
}
