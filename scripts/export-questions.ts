/**
 * 全エリア・全単元の出題データ(問題文・選択肢・正解・解説)を、1つのMarkdownに書き出す。
 * 日本語の表現・正解の妥当性を、通しで確認するためのもの。ふりがなは省き、文字だけを出す。
 *
 *   npx vite-node scripts/export-questions.ts
 *
 * 出力: docs/ALL_QUESTIONS.md(問題を直したら、もう一度実行して作り直す)
 */
import { writeFileSync } from "node:fs";
import { areas } from "../src/data/areas";
import { getQuestionsForArea } from "../src/data/questionLoader";
import type { AssemblyQuestion, ChoiceQuestion, Question, RubyText, SortingQuestion } from "../src/data/schema";
import { unitMetas } from "../src/data/units";

const plain = (text: RubyText | undefined): string => (text ?? []).map((s) => s.text).join("");
const unitLabel = (unitId: string) => plain(unitMetas.find((u) => u.id === unitId)?.label) || unitId;
const ENGINE_LABEL = { choice: "選択式", sorting: "仕分け", assembly: "組み立て" } as const;
const LETTERS = "ABCDEFGHIJ";

const warnings: string[] = [];
const warn = (id: string, message: string) => warnings.push(`- \`${id}\`: ${message}`);

function renderChoice(q: ChoiceQuestion): string[] {
  const lines: string[] = [];
  const tap = q.display === "tapInSentence";
  lines.push(`- **形式**: ${tap ? "選択式(文中タップ)" : "選択式"}`);
  if (q.situation) lines.push(`- **場面/文**: ${plain(q.situation)}`);
  lines.push(`- **問い**: ${plain(q.prompt)}`);
  if (tap) {
    lines.push(`- **文(文節の並び)**: ${q.choices.map((c) => plain(c.text) + (c.given ? "【基準】" : "")).join(" / ")}`);
  }
  lines.push("- **選択肢**:");
  q.choices.forEach((c, i) => {
    const mark = c.id === q.correctChoiceId ? " ✅ **正解**" : "";
    const given = c.given ? "(基準・タップ不可)" : "";
    lines.push(`  - ${LETTERS[i] ?? i + 1}. ${plain(c.text)}${given}${mark}`);
  });
  if (!q.choices.some((c) => c.id === q.correctChoiceId)) warn(q.id, "正解の選択肢が、選択肢の中にない");
  if (q.choices.find((c) => c.id === q.correctChoiceId)?.given) warn(q.id, "正解が「基準」の文節になっている");
  const texts = q.choices.map((c) => plain(c.text));
  if (new Set(texts).size !== texts.length) warn(q.id, "同じ文言の選択肢がある");
  return lines;
}

function renderSorting(q: SortingQuestion): string[] {
  const label = (id: string) => plain(q.categories.find((c) => c.id === id)?.label);
  const lines = [`- **形式**: 仕分け`, `- **指示**: ${plain(q.instruction)}`, `- **カゴ**: ${q.categories.map((c) => plain(c.label)).join(" / ")}`, "- **項目と正解**:"];
  for (const item of q.items) {
    lines.push(`  - ${plain(item.text)} → **${label(item.correctCategoryId) || "(カゴが見つからない)"}**${item.explanation ? `  \n    解説: ${plain(item.explanation)}` : ""}`);
    if (!q.categories.some((c) => c.id === item.correctCategoryId)) warn(q.id, `項目「${plain(item.text)}」の正解のカゴが、カゴの一覧にない`);
    if (!item.explanation) warn(q.id, `項目「${plain(item.text)}」に解説がない`);
  }
  return lines;
}

function renderAssembly(q: AssemblyQuestion): string[] {
  const cardText = (id: string) => plain(q.cards.find((c) => c.id === id)?.text);
  const lines = [`- **形式**: 組み立て(${q.mode === "fillBlank" ? "穴埋め" : "並べ替え"})`, `- **指示**: ${plain(q.instruction)}`];
  if (q.sentenceTemplate) lines.push(`- **文(空欄は ＿＿＿)**: ${plain(q.sentenceTemplate).replace(/___/g, "＿＿＿")}`);
  lines.push(`- **カード**: ${q.cards.map((c) => plain(c.text)).join(" / ")}`);
  const answer = q.correctOrder.map(cardText);
  lines.push(`- **正解**: ✅ **${answer.join(" → ")}**`);
  if (q.sentenceTemplate && q.mode === "fillBlank") {
    lines.push(`- **正解を入れた文**: ${plain(q.sentenceTemplate).replace(/___/g, answer[0] ?? "")}`);
  }
  if (q.correctOrder.some((id) => !q.cards.some((c) => c.id === id))) warn(q.id, "正解のカードが、カードの一覧にない");
  return lines;
}

function renderQuestion(q: Question, n: number): string[] {
  const head = `#### ${n}. \`${q.id}\`(${ENGINE_LABEL[q.engine]})`;
  const body = q.engine === "choice" ? renderChoice(q) : q.engine === "sorting" ? renderSorting(q) : renderAssembly(q);
  const lines = [head, ...body];
  if (q.engine !== "sorting") {
    if (q.explanation) lines.push(`- **解説**: ${plain(q.explanation)}`);
    else warn(q.id, "解説がない");
  }
  return [...lines, ""];
}

const out: string[] = [];
const seenIds = new Set<string>();
const summary: string[] = ["| エリア | 単元 | 問題数(画面) | 形式 |", "| --- | --- | --- | --- |"];
const body: string[] = [];
let total = 0;

for (const area of areas.filter((a) => a.implemented)) {
  const questions = getQuestionsForArea(area.id);
  const byUnit = new Map<string, Question[]>();
  for (const q of questions) {
    if (seenIds.has(q.id)) warn(q.id, "問題idが重複している");
    seenIds.add(q.id);
    byUnit.set(q.unit, [...(byUnit.get(q.unit) ?? []), q]);
  }
  body.push(`## ${area.name}(${area.unitLabel})`, "", `問題数: ${questions.length}`, "");
  for (const [unit, list] of byUnit) {
    const engines = [...new Set(list.map((q) => ENGINE_LABEL[q.engine]))].join("・");
    summary.push(`| ${area.name} | ${unitLabel(unit)} | ${list.length} | ${engines} |`);
    body.push(`### ${unitLabel(unit)}(単元ID: \`${unit}\`、${list.length}問)`, "");
    list.forEach((q, i) => body.push(...renderQuestion(q, i + 1)));
    total += list.length;
  }
}

out.push(
  "# 全問題の一覧(日本語表現・正解の確認用)",
  "",
  "全エリア・全単元の出題データを、問題文・選択肢・正解・解説つきで書き出したもの。",
  "`scripts/export-questions.ts` が出題データ(`src/data/questions/`)から自動で作る。問題を直したら `npx vite-node scripts/export-questions.ts` で作り直す。",
  "",
  "- ふりがなは省き、文字だけを出している。",
  "- 正解は ✅ **太字** で示す。選択肢の並び(A, B, C…)は、データ上の並び。実際の画面では、正解の位置がばらつくように並べ替えて出題される。",
  "- 仕分けの項目の「」は、画面では白いカードになる対象の語(仕分けるのは「」の中の語)。",
  "- 「問題数」は画面の数(仕分けは1画面に複数の語を並べるので、語の数とは別)。",
  `- 全部で **${total}画面**。`,
  "",
  "## 目次(エリア×単元)",
  "",
  ...summary,
  "",
  ...body,
);

if (warnings.length > 0) {
  out.push("## 機械チェックで気づいた点", "", "データの整合性(正解がある・解説がある・idが重複しない)を自動で確認した結果。", "", ...warnings, "");
} else {
  out.push("## 機械チェック", "", "データの整合性(正解が選択肢・カゴ・カードの中にある、解説がある、idが重複しない)を自動で確認して、問題は見つからなかった。", "");
}

writeFileSync("docs/ALL_QUESTIONS.md", out.join("\n"), "utf-8");
console.log(`書き出しました: docs/ALL_QUESTIONS.md(${total}画面、警告 ${warnings.length}件)`);
