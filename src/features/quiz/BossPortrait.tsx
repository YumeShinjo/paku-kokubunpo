import { findImage, IMAGE } from "@/assets/registry";

/**
 * ボス戦パネルの立ち絵。素材がなければ何も出さない(現状の文字だけのパネルのまま)。
 *  - 小ボス: 共通ベース + 役職ごとの装飾差分(エリアidごと)を重ねる(10章のレイヤー方式)
 *  - ラスボス: 取り憑かれた姿
 */
export function BossPortrait({ type, areaId }: { type: "subBoss" | "lastBoss"; areaId: string }) {
  const layers =
    type === "lastBoss"
      ? [findImage(IMAGE.lastBossPossessed)]
      : [findImage(IMAGE.subBossBase), findImage(IMAGE.subBossRole(areaId))];
  const urls = layers.filter((u): u is string => u !== undefined);
  if (urls.length === 0) return null;
  return (
    <div className="boss-portrait" aria-hidden="true">
      {urls.map((url) => (
        <img key={url} src={url} alt="" draggable={false} />
      ))}
    </div>
  );
}
