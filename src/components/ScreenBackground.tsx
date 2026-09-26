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
 * ステージ画面の背景。画面全体ではなく、上半分に背景ビジュアル、下半分に問題・UI、の構成にする。
 * 素材は、エリアidの背景(bg/<エリアid>)を上半分の枠に収めて(cover・上寄せ)出す。素材が置かれていなければ、
 * エリアの色の仮の帯を出す。正式な素材に差し替えるときは、画像を置くか、枠の高さ(--stage-visual-height)を変えるだけ。
 */
export function StageVisual({ name }: { name: string }) {
  const url = findImage(IMAGE.background(name));
  return (
    <div
      className={`stage-visual ${url ? "" : "stage-visual-placeholder"}`.trim()}
      style={url ? { backgroundImage: `url(${url})` } : undefined}
      aria-hidden="true"
    />
  );
}
