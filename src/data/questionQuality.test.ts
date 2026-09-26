import { describe, expect, it } from "vitest";
import { getAllQuestions } from "./questionLoader";
import type { Question, RubyText } from "./schema";

const plain = (text: RubyText | undefined): string => (text ?? []).map((s) => s.text).join("");

/** 問題・選択肢・解説の、すべての文字列 */
function explanations(q: Question): string[] {
  const list = [plain(q.explanation)];
  if (q.engine === "sorting") for (const item of q.items) list.push(plain(item.explanation));
  return list;
}

describe("出題データの品質", () => {
  it("解説は、その問題だけで完結する。他の問題番号(「問7」など)への言及は、ランダム出題のため書かない", () => {
    for (const q of getAllQuestions()) {
      for (const text of explanations(q)) {
        expect(text, `${q.id} の解説`).not.toMatch(/問\s*[0-9０-９]+/);
      }
    }
  });

  it("穴埋め・選択式で、選択肢どうしが同じ文字になっていない(正解が複数になる誤りを防ぐ)", () => {
    for (const q of getAllQuestions()) {
      const texts =
        q.engine === "choice" ? q.choices.map((c) => plain(c.text)) : q.engine === "assembly" ? q.cards.map((c) => plain(c.text)) : [];
      expect(new Set(texts).size, q.id).toBe(texts.length);
    }
  });

  it("尊敬語・謙譲語の問いは、種類(尊敬語/謙譲語)を示して問う(「〜ます」も正しい言い方なので、「正しい形」とは問わない)", () => {
    for (const q of getAllQuestions()) {
      if (q.unit !== "sonkeigo" && q.unit !== "kenjougo") continue;
      if (q.engine !== "choice") continue;
      expect(plain(q.prompt), q.id).toContain(q.unit === "sonkeigo" ? "尊敬語" : "謙譲語");
    }
  });
});
