import type { ReactNode } from "react";
import { findImage, IMAGE } from "@/assets/registry";

/**
 * 旅人ユライ(言の葉の森の案内役)の立ち絵。右向き。
 * 画像(kotonoha/yurai)が置かれていればそれを出し、なければ、CSSで描いた人影(淡い茶色)を仮表示する。
 * 画像は、512×512の中央に、縦438px・上の余白37pxで置く決まり(足元は、画像の下端から約7%上)。
 */
export function Yurai({ className = "" }: { className?: string }) {
  const url = findImage(IMAGE.kotonohaYurai);
  return (
    <div className={`yurai ${className}`.trim()} role="img" aria-label="旅人ユライ">
      {url ? (
        <img className="yurai-image" src={url} alt="" draggable={false} />
      ) : (
        <span className="yurai-silhouette" aria-hidden="true" />
      )}
    </div>
  );
}

/** ユライの吹き出し(名前つき)。仮表示の人影でも、画像が届いたあとでも、そのまま使える */
export function YuraiBubble({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`yurai-bubble ${className}`.trim()}>
      <p className="yurai-name">ユライ</p>
      <div className="yurai-text">{children}</div>
    </div>
  );
}
