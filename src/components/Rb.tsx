import { rb } from "@/data/ruby";
import { Ruby } from "@/components/Ruby";

/**
 * システム文(ボタン・見出し・案内・通知など)用の、ふりがな付きテキスト。
 * "漢字[ふりがな]" 記法で書く。例: <Rb t="設定[せってい]" /> → 設定の上に「せってい」。
 * 4章の方針(文法用語だけでなく、システム文も「漢字+ふりがな」にそろえる。ひらがなだけにしない)に沿って使う。
 */
export function Rb({ t }: { t: string }) {
  return <Ruby text={rb(t)} />;
}
