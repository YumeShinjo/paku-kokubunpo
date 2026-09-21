import type { Question } from "@/data/schema";
import type { Answer } from "@/engines/core/judge";
import { SortingEngine } from "@/engines/sorting/SortingEngine";
import { AssemblyEngine } from "@/engines/assembly/AssemblyEngine";
import { ChoiceEngine } from "@/engines/choice/ChoiceEngine";

interface Props {
  question: Question;
  onAnswer: (answer: Answer) => void;
}

/**
 * 問題データが指定する engine に応じて描画コンポーネントを切り替える(5章)。
 * エンジンは3つ。文中タップは choice の表示モード(ChoiceQuestion.display)で、ChoiceEngine が描き分ける。
 */
export function EngineRouter({ question, onAnswer }: Props) {
  switch (question.engine) {
    case "sorting":
      return <SortingEngine question={question} onAnswer={onAnswer} />;
    case "assembly":
      return <AssemblyEngine question={question} onAnswer={onAnswer} />;
    case "choice":
      return <ChoiceEngine question={question} onAnswer={onAnswer} />;
  }
}
