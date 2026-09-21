import { useRef, useState } from "react";
import type { ChoiceQuestion } from "@/data/schema";
import type { Answer } from "@/engines/core/judge";
import { Ruby } from "@/components/Ruby";

interface Props {
  question: ChoiceQuestion;
  onAnswer: (answer: Answer) => void;
}

/**
 * 選択式エンジン。助動詞識別・紛らわしい語・敬語(場面説明付き)・文節相互の関係などで使用(5章)。
 * 表示モードは2つ(判定・解答の形は共通): 選択肢を縦に並べる "list"(既定)と、
 * 文中の文節を直接タップする "tapInSentence"(絆の間)。
 * 解答を確定するボタンなので、結果音と重なるタップ音は data-no-tap で外している。
 *
 * 1問につき判定は1回だけ: 選んだ時点で解答が確定し、以後は選択肢を押せない(disabled)。
 * 選んだ選択肢は正誤の色で示し、不正解のときは正解の選択肢も示す。
 */
export function ChoiceEngine({ question, onAnswer }: Props) {
  const [chosenId, setChosenId] = useState<string | null>(null);
  const answered = chosenId !== null;
  // 再描画を待たずに続けて押されても、最初の1回だけを解答にする(state ではなく ref で同期的に記録)
  const answeredRef = useRef(false);

  const answer = (choiceId: string) => {
    if (answeredRef.current) return; // 二重に判定しない
    answeredRef.current = true;
    setChosenId(choiceId);
    onAnswer({ engine: "choice", choiceId });
  };

  /** 解答後の見た目: 選んだものは正誤の色、不正解のときは正解の選択肢も色をつける */
  const resultClass = (choiceId: string) => {
    if (!answered) return "";
    if (choiceId === question.correctChoiceId) return "correct";
    if (choiceId === chosenId) return "incorrect";
    return "";
  };

  if (question.display === "tapInSentence") {
    return (
      <div className="engine engine-choice engine-choice-tap">
        <p className="engine-prompt">
          <Ruby text={question.prompt} />
        </p>
        <p className="engine-sentence">
          {question.choices.map((segment) =>
            segment.given ? (
              <span key={segment.id} className="sentence-given">
                <Ruby text={segment.text} />
              </span>
            ) : (
              <button
                key={segment.id}
                type="button"
                data-no-tap
                disabled={answered}
                className={["sentence-segment", resultClass(segment.id)].filter(Boolean).join(" ")}
                onClick={() => answer(segment.id)}
              >
                <Ruby text={segment.text} />
              </button>
            ),
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="engine engine-choice">
      {question.situation && (
        <p className="engine-situation">
          <Ruby text={question.situation} />
        </p>
      )}
      <p className="engine-prompt">
        <Ruby text={question.prompt} />
      </p>
      <ul className="engine-choice-list">
        {question.choices.map((choice) => (
          <li key={choice.id}>
            <button
              type="button"
              data-no-tap
              disabled={answered}
              className={resultClass(choice.id)}
              onClick={() => answer(choice.id)}
            >
              <Ruby text={choice.text} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
