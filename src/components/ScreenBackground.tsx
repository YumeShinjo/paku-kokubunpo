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
