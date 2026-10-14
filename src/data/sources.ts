import type { AssetCredit } from "./credits";

/**
 * 「くわしい出典」ページ用のデータ。素材管理表(docs/ASSET_CREDITS.md)の全行を、区分ごとにまとめる。
 * ゲーム内のクレジット(data/credits.ts)は、ネタバレ防止のため曲名などを出さないが、こちらは、曲名・ファイル名・入手元URL・
 * ライセンスの要点まで、すべて出す(ネタバレを含むので、ページ側で「ひらく」を押すまで見せない)。
 */
export interface SourceItem {
  name: string;
  /** 作者・提供元・制作方法 */
  source: string;
  /** 入手元のURL(複数あることがある)。分からないものは空 */
  urls: string[];
  /** URL以外の補足(「要確認」を含む)。なければ空 */
  urlNote: string;
  /** ライセンス・利用条件の要点 */
  license: string;
  usage: string;
}

export interface SourceGroup {
  id: string;
  title: string;
  items: SourceItem[];
}

const URL_PATTERN = /https?:\/\/[^\s()（）、。「」]+/g;

/** 表の「入手元URL」の欄を、URLと、それ以外の補足に分ける(URLは、空白で区切って並べ、補足は(…)で書く) */
export function splitUrlCell(cell: string): { urls: string[]; note: string } {
  const urls = cell.match(URL_PATTERN) ?? [];
  const rest = cell.replace(URL_PATTERN, "").trim();
  const note = rest.replace(/^[(（]\s*(.*?)\s*[)）]$/, "$1").trim();
  return { urls, note };
}

/** 区分(ページの見出し)と、それに入れる種別。この順に出す */
const GROUPS: { id: string; title: string; kinds: string[] }[] = [
  { id: "bgm", title: "BGM(音楽)", kinds: ["BGM"] },
  { id: "se", title: "こうかおん", kinds: ["SE"] },
  { id: "image", title: "がぞう(と、画像をつくったAI)", kinds: ["画像", "生成AIモデル"] },
  { id: "font", title: "フォント", kinds: ["フォント"] },
  { id: "library", title: "アイコン・ライブラリ", kinds: ["ライブラリ"] },
];

export function buildSourceGroups(credits: AssetCredit[]): SourceGroup[] {
  const groups: SourceGroup[] = [];
  for (const g of GROUPS) {
    const items = credits
      .filter((c) => g.kinds.includes(c.kind))
      .map((c) => {
        const { urls, note } = splitUrlCell(c.url);
        return { name: c.name, source: c.source, urls, urlNote: note, license: c.license, usage: c.usage };
      });
    if (items.length > 0) groups.push({ id: g.id, title: g.title, items });
  }
  return groups;
}

/** 素材の規約が「クレジット表記が必要」としているもの。「くわしい出典」の先頭に、指定の書式で出す */
export const requiredCredits: { id: string; kind: string; line: string; note: string }[] = [
  {
    id: "pocketsound",
    kind: "効果音",
    line: "効果音：ポケットサウンド – https://pocket-se.info/",
    note: "ポケットサウンドの規約で、表記が必要とされている書式",
  },
  {
    id: "prairie4",
    kind: "BGM",
    line: "Prairie4 / PeriTune / CC BY 4.0(https://creativecommons.org/licenses/by/4.0/) / https://peritune.com/blog/2019/03/01/prairie4/",
    note: "曲のライセンス(CC BY 4.0)で必要な表示(曲名・作者・ライセンス・入手元)",
  },
];
