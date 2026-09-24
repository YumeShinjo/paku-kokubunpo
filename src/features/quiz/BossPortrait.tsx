import { findImage, IMAGE } from "@/assets/registry";

/**
 * ボス戦パネルの立ち絵。素材がなければ何も出さない(文字だけのパネルのまま)。
 *  - 小ボス: エリアごとの1枚絵(boss/subboss-<エリアid>)
 *  - ラスボス: 取り憑かれた姿(boss/lastboss-possessed)
 */
export function BossPortrait({ type, areaId }: { type: "subBoss" | "lastBoss"; areaId: string }) {
  const url = findImage(type === "lastBoss" ? IMAGE.lastBossPossessed : IMAGE.subBoss(areaId));
  if (!url) return null;
  return (
    <div className="boss-portrait" aria-hidden="true">
      <img src={url} alt="" draggable={false} />
    </div>
  );
}
