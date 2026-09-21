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
