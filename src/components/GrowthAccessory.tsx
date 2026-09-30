import { findImage, IMAGE } from "@/assets/registry";
import { accessoryCrop } from "@/data/accessoryBounds";

/**
 * 成長アクセサリー(マスコットに重ねる画像)を、1つだけ小さく見せる。エリア選択のカードに置く。
 * 手に入れている(owned)ときは色つき、まだのときはシルエット(黒い影のみ)。画像がなければ、何も出さない。
 * stage は 1〜7(ことばの市場=1 〜 王座の間=7。エリアの order と同じ)。
 */
export function GrowthAccessory({ stage, owned }: { stage: number; owned: boolean }) {
  const url = findImage(IMAGE.mascotAccessory(stage));
  const crop = accessoryCrop(stage);
  if (!url || !crop) return null;
  return (
    <span
      className={`growth-accessory ${owned ? "is-owned" : "is-silhouette"}`}
      role="img"
      aria-label={owned ? "手に入れた成長アクセサリー" : "まだ手に入れていない成長アクセサリー"}
    >
      <img
        src={url}
        alt=""
        draggable={false}
        style={{ width: `${crop.width}%`, left: `${crop.left}%`, top: `${crop.top}%` }}
      />
    </span>
  );
}
