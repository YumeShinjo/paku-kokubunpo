import { rb } from "@/data/ruby";
import { limitRuby } from "@/data/rubyPolicy";
import { Ruby } from "@/components/Ruby";

/**
 * システム文の地の文・名前用の、ふりがな付きテキスト。"漢字[ふりがな]" 記法で書く。
 * 方針(data/rubyPolicy.ts): 文法用語と、読みが難しい語(HARD_WORDS)だけふりがなを出し、それ以外の漢字にはふりがなを付けない。
 * 操作ボタンや短い案内(はじめる・もどる など)には使わず、ひらがなのまま書く。
 */
export function Rb({ t }: { t: string }) {
  return <Ruby text={limitRuby(rb(t))} />;
}
