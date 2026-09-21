import { useState } from "react";
import type { SortingQuestion } from "@/data/schema";
import type { Answer } from "@/engines/core/judge";
import { Ruby } from "@/components/Ruby";
import { PosChip } from "@/components/PosChip";
import { findPartOfSpeech } from "@/data/partOfSpeech";

interface Props {
  question: SortingQuestion;
  onAnswer: (answer: Answer) => void;
}

/**
 * 仕分けゲームエンジン。品詞分類・自立語/付属語で使用(5章)。
 * MVPではタップ選択方式(選んだ単語→カゴの順にタップ)で実装し、
 * ドラッグ&ドロップ等の演出強化は今後の検討課題とする(5章: 未決事項)。
 * 解答後は項目ごとの正誤と解説を表示する(7章: 無音でも伝わる視覚的フィードバック)。
 */
export function SortingEngine({ question, onAnswer }: Props) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const allPlaced = question.items.every((item) => placements[item.id]);

  function selectItem(itemId: string) {
    if (submitted) return;
    setSelectedItemId(itemId);
  }

  function placeInCategory(categoryId: string) {
    if (submitted || !selectedItemId) return;
    setPlacements((prev) => ({ ...prev, [selectedItemId]: categoryId }));
    setSelectedItemId(null);
  }

  function handleSubmit() {
    setSubmitted(true);
    onAnswer({ engine: "sorting", placements });
  }

  const categoryLabel = (categoryId: string) =>
    question.categories.find((c) => c.id === categoryId)?.label;

  return (
    <div className="engine engine-sorting">
      <p className="engine-prompt">
        <Ruby text={question.instruction} />
      </p>

      <div className="sorting-items">
        {question.items.map((item) => {
          const placedCategory = placements[item.id];
          const isCorrect = placedCategory === item.correctCategoryId;
          const resultClass = submitted ? (isCorrect ? "correct" : "incorrect") : "";
          return (
            <button
              key={item.id}
              type="button"
              disabled={submitted}
              className={[
                selectedItemId === item.id ? "selected" : "",
                resultClass,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => selectItem(item.id)}
            >
              <Ruby text={item.text} />
              {placedCategory && !submitted ? " ✓" : ""}
              {submitted && (isCorrect ? " ◎" : " ×")}
            </button>
          );
        })}
      </div>

      <div className="sorting-categories">
        {question.categories.map((category) => (
          <button
            key={category.id}
            type="button"
            disabled={submitted || !selectedItemId}
            onClick={() => placeInCategory(category.id)}
          >
            <Ruby text={category.label} />
          </button>
        ))}
      </div>

      {!submitted && (
        <button type="button" data-no-tap disabled={!allPlaced} onClick={handleSubmit}>
          こたえる
        </button>
      )}

      {submitted && (
        <ul className="sorting-results">
          {question.items.map((item) => {
            const isCorrect = placements[item.id] === item.correctCategoryId;
            return (
              <li key={item.id} className={isCorrect ? "correct" : "incorrect"}>
                <p className="sorting-result-item">
                  <Ruby text={item.text} />
                  {" → "}
                  {isCorrect && findPartOfSpeech(item.correctCategoryId) ? (
                    // 正解が確定したあとなので、品詞の色をつけてよい(5・7章)
                    <PosChip posId={item.correctCategoryId} />
                  ) : categoryLabel(placements[item.id]) ? (
                    <Ruby text={categoryLabel(placements[item.id])!} />
                  ) : (
                    "(未回答)"
                  )}
                  {isCorrect ? " ◎" : ` ×(正解: `}
                  {!isCorrect &&
                    (findPartOfSpeech(item.correctCategoryId) ? (
                      <PosChip posId={item.correctCategoryId} />
                    ) : (
                      <Ruby text={categoryLabel(item.correctCategoryId)!} />
                    ))}
                  {!isCorrect && ")"}
                </p>
                {item.explanation && (
                  <p className="sorting-result-explanation">
                    <Ruby text={item.explanation} />
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
