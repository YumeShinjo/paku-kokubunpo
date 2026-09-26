import type { ReactNode } from "react";
import { areaMotifs } from "@/data/areaTheme";
import { findImage, IMAGE } from "@/assets/registry";

/**
 * 画面の背景(エリアidまたは "title")。素材が置かれていなければ何も出さない(単色のまま)。
 * 文字が読めるよう、既定では上に半透明のクリーム色を重ねる(soft=false でそのまま見せる)。
 */
export function ScreenBackground({ name, soft = true }: { name: string; soft?: boolean }) {
  const url = findImage(IMAGE.background(name));
  if (!url) return null;
  return (
    <div
      className={`screen-bg ${soft ? "screen-bg-soft" : ""}`.trim()}
      style={{ backgroundImage: `url(${url})` }}
      aria-hidden="true"
    />
  );
}

/**
 * ステージ画面の背景。ボス戦(tall)は、上半分に背景+ボス、下半分に問題・UI。通常ステージは、小さな装飾バーにとどめ、問題(特に仕分けのカゴ)の場所を優先する。
 * 素材は、エリアidの背景(bg/<エリアid>)を上半分の枠に収めて(cover・上寄せ)出す。素材が置かれていなければ、
 * エリアの色の仮の帯を出す。正式な素材に差し替えるときは、画像を置くか、枠の高さ(--stage-visual-height)を変えるだけ。
 */
export function StageVisual({
  name,
  tall = false,
  children,
}: {
  name: string;
  /** ボス戦: 上半分に大きく(ボスの立ち絵を中に置く)。false(通常ステージ)は、小さな装飾バー */
  tall?: boolean;
  children?: ReactNode;
}) {
  const url = findImage(IMAGE.background(name));
  const motif = tall ? undefined : areaMotifs[name];
  return (
    <div
      className={["stage-visual", tall ? "stage-visual-tall" : "", url ? "" : "stage-visual-placeholder"].filter(Boolean).join(" ")}
      style={url ? { backgroundImage: `url(${url})` } : undefined}
    >
      {motif && (
        <span className="stage-visual-motif" aria-hidden="true">
          {motif}
        </span>
      )}
      {children}
    </div>
  );
}
