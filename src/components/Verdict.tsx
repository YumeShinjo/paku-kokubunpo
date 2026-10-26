import { Circle, Triangle, X } from "lucide-react";
import { recoveredOnRetryMessage } from "@/data/feedbackMessages";

/** 正誤の見出し(固定のラベル)。色だけに頼らず、記号でも区別する: 正解=○・不正解=×・2回目で正解=△(絵文字は使わない) */
export type VerdictKind = "correct" | "incorrect" | "recovered";

const VERDICT_LABEL: Record<VerdictKind, string> = {
  correct: "せいかい！",
  incorrect: "ざんねん",
  recovered: recoveredOnRetryMessage.title,
};

const ICON = { correct: Circle, incorrect: X, recovered: Triangle } as const;

export function Verdict({ kind, className }: { kind: VerdictKind; className?: string }) {
  const Icon = ICON[kind];
  return (
    <p className={["verdict", `verdict-${kind}`, className].filter(Boolean).join(" ")}>
      <Icon className="verdict-icon" aria-hidden="true" size="1.1em" strokeWidth={3} />
      <span className="verdict-label">{VERDICT_LABEL[kind]}</span>
    </p>
  );
}
