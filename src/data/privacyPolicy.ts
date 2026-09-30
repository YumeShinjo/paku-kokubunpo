// `?public` は、vite.config.ts のプラグインが、「運営者向けメモ」の節を取り除いて渡す(公開するJSに入れないため)
import policyMarkdown from "../../docs/PRIVACY_POLICY.md?public";

/**
 * プライバシーポリシーの表示用データ。文章は docs/PRIVACY_POLICY.md をビルド時に読み込む(二重管理しない)。
 * ファイルの末尾の「運営者向けメモ」の節は、公開前に削除するためのものなので、画面には出さない(ファイルはそのまま残す)。
 * 対応する書き方は、このポリシーで使っているものだけ: 見出し(# ## ###)・段落・箇条書き(- / 1.。字下げした - で1段の入れ子)・表・区切り線(---)・太字(**)。
 */
/** 箇条書きの1項目。字下げした「- 」の行は、直前の項目の下位の項目(children)になる(1段だけ) */
export interface PolicyListItem {
  text: string;
  children: string[];
}

export type PolicyBlock =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; lines: string[] }
  | { type: "ul" | "ol"; items: PolicyListItem[] }
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "hr" };

/** 「運営者向けメモ」の節(見出しが「## (運営者向けメモ…」で始まる行から、ファイルの終わりまで)を取り除く */
export function stripOperatorNotes(markdown: string): string {
  const start = markdown.search(/^##\s*[(（]運営者向けメモ/m);
  return start < 0 ? markdown : markdown.slice(0, start);
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function parsePolicy(markdown: string): PolicyBlock[] {
  const lines = stripOperatorNotes(markdown).replace(/\r\n/g, "\n").split("\n");
  const blocks: PolicyBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trimEnd();
    if (line.trim() === "") {
      i++;
    } else if (/^-{3,}$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
    } else if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)![0].length;
      blocks.push({ type: `h${level}` as "h1" | "h2" | "h3", text: line.replace(/^#+\s*/, "") });
      i++;
    } else if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]));
      const isSeparator = (row: string[]) => row.every((cell) => /^:?-{2,}:?$/.test(cell));
      blocks.push({ type: "table", header: rows[0], rows: rows.slice(1).filter((row) => !isSeparator(row)) });
    } else if (/^\s*-\s/.test(line) || /^\d+\.\s/.test(line)) {
      const ordered = /^\d+\.\s/.test(line);
      const top = ordered ? /^\d+\.\s/ : /^-\s/;
      const items: PolicyListItem[] = [];
      while (i < lines.length) {
        const current = lines[i];
        if (top.test(current) || (items.length === 0 && /^\s*-\s/.test(current))) {
          items.push({ text: current.replace(ordered ? /^\d+\.\s+/ : /^\s*-\s+/, "").trim(), children: [] });
        } else if (items.length > 0 && /^\s+-\s/.test(current)) {
          items[items.length - 1].children.push(current.replace(/^\s+-\s+/, "").trim());
        } else {
          break;
        }
        i++;
      }
      blocks.push({ type: ordered ? "ol" : "ul", items });
    } else {
      // 必ず1行は進める(どの書き方にも当たらない行でも、止まらないように)
      const paragraph: string[] = [lines[i++].trim()];
      while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3}\s|-{3,}$|\||-\s|\d+\.\s)/.test(lines[i].trim())) {
        paragraph.push(lines[i++].trim());
      }
      blocks.push({ type: "p", lines: paragraph });
    }
  }
  while (blocks.length > 0 && blocks[blocks.length - 1].type === "hr") blocks.pop();
  return blocks;
}

/** 画面での見せ方の単位。区切り線(---)と、「## 」の見出しで区切る */
export interface PolicySection {
  /** title=最初の見出し / summary=「かんたんに言うと」 / article=第1条以降 / plain=見出しのない、最後の日付など */
  kind: "title" | "summary" | "article" | "plain";
  heading?: string;
  blocks: PolicyBlock[];
}

export const SUMMARY_HEADING = "かんたんに言うと";
/** 本文にもふりがなを付ける、重要な条(本人に関わる公開の範囲と、情報の削除) */
const RUBY_BODY_ARTICLES = [/^第4条/, /^第7条/];

export function groupPolicy(blocks: PolicyBlock[]): PolicySection[] {
  const sections: PolicySection[] = [];
  let current: PolicySection | null = null;
  const start = (section: PolicySection) => {
    current = section;
    sections.push(section);
  };
  for (const block of blocks) {
    if (block.type === "hr") {
      current = null;
    } else if (block.type === "h1") {
      start({ kind: "title", heading: block.text, blocks: [] });
    } else if (block.type === "h2") {
      start({ kind: block.text === SUMMARY_HEADING ? "summary" : "article", heading: block.text, blocks: [] });
    } else {
      if (current === null) start({ kind: "plain", blocks: [] });
      (current as PolicySection | null)!.blocks.push(block);
    }
  }
  return sections;
}

/** その節の本文(見出しは常に付ける)に、ふりがなを付けるか */
export function bodyHasRuby(section: PolicySection): boolean {
  if (section.kind === "summary") return true;
  if (section.kind !== "article") return false;
  return RUBY_BODY_ARTICLES.some((pattern) => pattern.test(section.heading ?? ""));
}

export const privacyPolicySections: PolicySection[] = groupPolicy(parsePolicy(policyMarkdown));
