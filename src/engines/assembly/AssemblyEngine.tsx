import { useRef, useState } from "react";
import type { AssemblyQuestion } from "@/data/schema";
import type { Answer } from "@/engines/core/judge";
import { Ruby } from "@/components/Ruby";
import { Rb } from "@/components/Rb";

interface Props {
  question: AssemblyQuestion;
  onAnswer: (answer: Answer) => void;
}

/**
 * 組み立てパズルエンジン。活用・音便・助詞の穴埋めで使用(5章)。
 * MVPでは fillBlank(1カ所の空欄にカードを当てはめる)を実装する。
 * reorder(カード並べ替え)は今後の単元追加時にUIを拡張する。
 */
export function AssemblyEngine({ question, onAnswer }: Props) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  // 1問につき判定は1回だけ: 「こたえる」を押したあとは、カードも「こたえる」も押せない
  const [submitted, setSubmitted] = useState(false);

  const submittedRef = useRef(false); // 再描画を待たずに続けて押されても、最初の1回だけにする

  function handleSubmit() {
    if (submittedRef.current || !selectedCardId) return;
    submittedRef.current = true;
    setSubmitted(true);
    onAnswer({ engine: "assembly", order: [selectedCardId] });
  }

  return (
    <div className="engine engine-assembly">
      <p className="engine-prompt">
        <Ruby text={question.instruction} />
      </p>

      {question.sentenceTemplate && (
        <p className="assembly-sentence">
          {question.sentenceTemplate.map((seg, i) =>
            seg.text === "___" ? (
              <span key={i} className="assembly-blank">
                {selectedCardId
                  ? question.cards.find((c) => c.id === selectedCardId)?.text.map(
                      (s) => s.text,
                    )
                  : "＿＿＿"}
              </span>
            ) : (
              <Ruby key={i} text={[seg]} />
            ),
          )}
        </p>
      )}

      <div className="assembly-cards">
        {question.cards.map((card) => (
          <button
            key={card.id}
            type="button"
            disabled={submitted}
            className={selectedCardId === card.id ? "selected" : ""}
            onClick={() => setSelectedCardId(card.id)}
          >
            <Ruby text={card.text} />
          </button>
        ))}
      </div>

      <button
        type="button"
        data-no-tap
        disabled={!selectedCardId || submitted}
        onClick={handleSubmit}
      >
        <Rb t="答[こた]える" />
      </button>
    </div>
  );
}
