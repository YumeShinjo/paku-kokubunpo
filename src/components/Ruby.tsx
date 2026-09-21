import type { RubyText } from "@/data/schema";

/**
 * ふりがな共通コンポーネント(9章: HTMLの <ruby> タグで実装、追加ライブラリ不要)。
 * RubyText(セグメント配列)を受け取り、ruby 指定があるセグメントのみ <ruby><rt> で描画する。
 */
export function Ruby({ text }: { text: RubyText }) {
  return (
    <>
      {text.map((seg, i) =>
        seg.ruby ? (
          <ruby key={i}>
            {seg.text}
            <rt>{seg.ruby}</rt>
          </ruby>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}
