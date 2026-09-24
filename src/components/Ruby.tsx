import type { RubyText } from "@/data/schema";

/**
 * ふりがな共通コンポーネント(9章: HTMLの <ruby> タグで実装、追加ライブラリ不要)。
 * RubyText(セグメント配列)を受け取り、ruby 指定があるセグメントのみ <ruby><rt> で描画する。
 *
 * 全体を1つの <span class="ruby-text"> にまとめて返す。親が flex / grid のとき(縦並びのバッジなど)に、
 * ふりがな付きの語とその前後の文字が、それぞれ別の行・別のマスに分かれて、1語ごとに改行されてしまうのを防ぐ。
 * 1つの要素にまとめておけば、中の文字は通常の折り返し(禁則処理を含む)で流れる。
 */
export function Ruby({ text }: { text: RubyText }) {
  return (
    <span className="ruby-text">
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
    </span>
  );
}
