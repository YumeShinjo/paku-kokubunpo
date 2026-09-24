import assetCreditsMarkdown from "../../docs/ASSET_CREDITS.md?raw";

/**
 * ゲーム内クレジット(10章)。
 * 「使用素材」は docs/ASSET_CREDITS.md の素材管理表をビルド時に読み込んで表示する。
 * つまり提出用の素材管理表に1行足せば、ゲーム内のクレジットにも反映される(二重管理しない)。
 */
export interface AssetCredit {
  name: string;
  /** 画像 / BGM / SE など(表の「種別」列) */
  kind: string;
  source: string;
  license: string;
  usage: string;
}

const isSeparatorCell = (cell: string) => /^:?-{2,}:?$/.test(cell);

/** 素材管理表(Markdownの表)から素材の行を取り出す。見出し行・区切り行・「(例)」の行は除く。 */
export function parseAssetCredits(markdown: string): AssetCredit[] {
  const credits: AssetCredit[] = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("|")) continue;
    const cells = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    if (cells.length < 5) continue;
    const [name, kind, source, license, usage] = cells;
    if (cells.every(isSeparatorCell) || name === "素材名" || name === "") continue;
    if (/^[(（]例[)）]/.test(name)) continue;
    credits.push({ name, kind, source, license, usage });
  }
  return credits;
}

export const assetCredits: AssetCredit[] = parseAssetCredits(assetCreditsMarkdown);

/**
 * ゲーム内クレジットの表示用(ネタバレ防止のため、曲名・効果音名・ファイル名・使用箇所は出さない)。
 *  - BGM・効果音: 「作曲者名 - サイト名」の並びだけ。素材管理表の出典が「サイト名 / 作曲者名」の形ならその順に直し、
 *    サイト名(または作者名)だけのときは、それだけを出す。同じ出典は1回にまとめる。
 *  - 画像(生成AIによるキャラクター): 「キャラクターイラスト: (制作方法の1文)」に1つにまとめる。
 *  - 画像(それ以外)・フォント: 素材名と出典・ライセンスだけ。
 * 提出用の素材管理表(docs/ASSET_CREDITS.md)は、詳細をそのまま持つ。ここで簡略化するのは、ゲーム内の表示だけ。
 */
export interface CreditGroup {
  /** 種別(画像 / BGM / SE / フォント / …) */
  kind: string;
  lines: string[];
}

/** 出典「サイト名 / 作曲者名」を、「作曲者名 - サイト名」に直す。「 / 」がなければ、そのまま */
export function formatMusicCredit(source: string): string {
  const parts = source.split(/\s+\/\s+/).map((p) => p.trim()).filter(Boolean);
  return parts.length === 2 ? `${parts[1]} - ${parts[0]}` : source.trim();
}

/** 末尾の補足(「(…)」)を取り除く。ゲーム内の表示では、作り方の細かい注記や、ライセンスの説明書きを出さない */
export const withoutNote = (text: string): string => text.replace(/\s*[(（][^()（）]*[)）]\s*$/, "").trim();

const isGeneratedByAi = (c: AssetCredit) => c.license.startsWith("生成AI");
const unique = (lines: string[]) => [...new Set(lines)];

const KIND_ORDER = ["画像", "BGM", "SE", "フォント"];

export function buildCreditGroups(credits: AssetCredit[]): CreditGroup[] {
  const kinds = [...KIND_ORDER, ...credits.map((c) => c.kind).filter((k) => !KIND_ORDER.includes(k))];
  const groups: CreditGroup[] = [];
  for (const kind of unique(kinds)) {
    const rows = credits.filter((c) => c.kind === kind);
    if (rows.length === 0) continue;
    let lines: string[];
    if (kind === "BGM" || kind === "SE") {
      lines = unique(rows.map((c) => formatMusicCredit(c.source)));
    } else if (kind === "画像") {
      const ai = unique(rows.filter(isGeneratedByAi).map((c) => c.license));
      const others = rows.filter((c) => !isGeneratedByAi(c)).map((c) => `${withoutNote(c.name)}: ${withoutNote(c.source)}`);
      lines = [...ai.map((license) => `キャラクターイラスト: ${license}`), ...unique(others)];
    } else {
      lines = unique(rows.map((c) => `${c.name}(${withoutNote(c.license)})`));
    }
    groups.push({ kind, lines });
  }
  return groups;
}

/** 制作者 */
export const staffCredits: { role: string; name: string }[] = [
  { role: "企画・制作", name: "Yume Shinjo" },
];

/** 使用しているオープンソースソフトウェア */
export const softwareCredits: { name: string; license: string }[] = [
  { name: "React", license: "MIT License" },
  { name: "Vite / vite-plugin-pwa", license: "MIT License" },
  { name: "Zustand", license: "MIT License" },
  { name: "Firebase JS SDK", license: "Apache License 2.0" },
];
