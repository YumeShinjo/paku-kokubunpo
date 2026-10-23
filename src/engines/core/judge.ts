import type { Question, SortingQuestion } from "@/data/schema";

/**
 * 4エンジン共通の正誤判定ロジック(5章: 判定ロジックとUI基盤は共通化する)。
 * 各エンジンUIはここに解答を渡すだけで、正誤判定の実装を持たない。
 */

export type Answer =
  /** sorting: itemId -> 選んだcategoryId */
  | {
      engine: "sorting";
      /** 判定に使う入れ方(1回目に外したときは、やり直す前の1回目の入れ方。集計は、1回目で決まる) */
      placements: Record<string, string>;
      /** 1回目に外して、やり直した2回目で、全部合ったとき true(判定・集計は変えない。画面の表示だけを変えるための印) */
      recoveredOnRetry?: boolean;
    }
  /** assembly: 選んだ/並べたcardIdの配列 */
  | { engine: "assembly"; order: string[] }
  /** choice: 選んだchoiceId(文中タップ表示のときは、タップした文節のid) */
  | { engine: "choice"; choiceId: string };

/** 仕分け: 項目ごとの正誤(項目id → 正しいカゴに入っているか)。まだ入れていない項目は、誤り */
export function judgeSortingItems(question: SortingQuestion, placements: Record<string, string>): Record<string, boolean> {
  return Object.fromEntries(question.items.map((item) => [item.id, placements[item.id] === item.correctCategoryId]));
}

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
