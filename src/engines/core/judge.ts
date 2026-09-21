import type { Question } from "@/data/schema";

/**
 * 4エンジン共通の正誤判定ロジック(5章: 判定ロジックとUI基盤は共通化する)。
 * 各エンジンUIはここに解答を渡すだけで、正誤判定の実装を持たない。
 */

export type Answer =
  /** sorting: itemId -> 選んだcategoryId */
  | { engine: "sorting"; placements: Record<string, string> }
  /** assembly: 選んだ/並べたcardIdの配列 */
  | { engine: "assembly"; order: string[] }
  /** choice: 選んだchoiceId(文中タップ表示のときは、タップした文節のid) */
  | { engine: "choice"; choiceId: string };

export function judgeAnswer(question: Question, answer: Answer): boolean {
  if (question.engine !== answer.engine) {
    throw new Error(
      `engine mismatch: question=${question.engine} answer=${answer.engine}`,
    );
  }

  switch (question.engine) {
    case "sorting": {
      const a = answer as Extract<Answer, { engine: "sorting" }>;
      return question.items.every(
        (item) => a.placements[item.id] === item.correctCategoryId,
      );
    }
    case "assembly": {
      const a = answer as Extract<Answer, { engine: "assembly" }>;
      return (
        a.order.length === question.correctOrder.length &&
        a.order.every((id, i) => id === question.correctOrder[i])
      );
    }
    case "choice": {
      const a = answer as Extract<Answer, { engine: "choice" }>;
      return a.choiceId === question.correctChoiceId;
    }
  }
}
