import { findImage, IMAGE } from "@/assets/registry";

/** 言の葉の森の背景(画面いっぱい)。画像がなければ、何も出さない(単色のまま)。文字が読めるよう、上に薄いクリーム色を重ねる */
export function KotonohaBackground() {
  const url = findImage(IMAGE.kotonohaForestBackground);
  if (!url) return null;
  return <div className="screen-bg screen-bg-forest" style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />;
}
