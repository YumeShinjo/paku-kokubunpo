import { useState } from "react";
import type { AssemblyQuestion } from "@/data/schema";
import type { Answer } from "@/engines/core/judge";
import { Ruby } from "@/components/Ruby";

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
        disabled={!selectedCardId}
        onClick={() =>
          selectedCardId &&
          onAnswer({ engine: "assembly", order: [selectedCardId] })
        }
      >
        こたえる
      </button>
    </div>
  );
}
