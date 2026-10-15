import type { RubyText } from "@/data/schema";
import { Ruby } from "@/components/Ruby";
import { splitTargets } from "@/data/targetText";

/**
 * 仕分けゲームの問題文(単語の入った文)。対象の語(「」でくくられた部分)を、カード風の背景で目立たせる。
 * 「」でくくられていない文は、そのままの表示になる。
 */
export function TargetText({ text, mark }: { text: RubyText; /** 同じ表記の語を見分ける番号(①②…)。対象の語のカードの中に添える */ mark?: string }) {
  return (
    <>
      {splitTargets(text).map((piece, i) =>
        piece.target ? (
          <span key={i} className="target-card">
            <Ruby text={piece.text} />
            {mark && <span className="target-mark">{mark}</span>}
          </span>
        ) : (
          <Ruby key={i} text={piece.text} />
        ),
      )}
    </>
  );
}
