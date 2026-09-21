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
 */
export function ChoiceEngine({ question, onAnswer }: Props) {
  const answer = (choiceId: string) => onAnswer({ engine: "choice", choiceId });

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
                className="sentence-segment"
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
            <button type="button" data-no-tap onClick={() => answer(choice.id)}>
              <Ruby text={choice.text} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
