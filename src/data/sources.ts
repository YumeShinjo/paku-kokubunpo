import type { AssetCredit } from "./credits";

/**
 * 「くわしい出典」ページ用のデータ。素材管理表(docs/ASSET_CREDITS.md)の全行を、区分ごとにまとめる。
 * ゲーム内のクレジット(data/credits.ts)は、ネタバレ防止のため曲名などを出さないが、こちらは、曲名・ファイル名・入手元URLまで出す
 * (ネタバレを含むので、ページ側で「ひらく」を押すまで見せない)。
 * 1つの素材につき、出すのは、名前・作者(提供元)・入手元(リンク)・条件の要点(1行)の4つだけ。
 */
export interface SourceItem {
  name: string;
  /** 作者・提供元 */
  source: string;
  /** 入手元のURL(複数あることがある)。分からないものは空 */
  urls: string[];
  /** 入手元が「要確認」か(URLが分からない、または、確認が済んでいない) */
  urlUnknown: boolean;
  /** 条件の要点(1行)。先頭の「【表記必須】」は、取り除いてある */
  summary: string;
  /** 規約で、クレジットの表記が必須の素材(行に「表記必須」の印を付ける) */
  mustCredit: boolean;
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
  { id: "bgm", title: "BGM", kinds: ["BGM"] },
  { id: "se", title: "効果音", kinds: ["SE"] },
  { id: "image", title: "画像", kinds: ["画像"] },
  { id: "material", title: "制作素材", kinds: ["生成AIモデル", "制作素材"] },
  { id: "software", title: "ソフトウェア", kinds: ["フォント", "ライブラリ"] },
];

/** 要点の先頭に付ける、表記が必須の印(台帳の7列目に書く) */
export const MUST_CREDIT_MARK = "【表記必須】";

export function buildSourceGroups(credits: AssetCredit[]): SourceGroup[] {
  const groups: SourceGroup[] = [];
  for (const g of GROUPS) {
    const items = credits
      .filter((c) => g.kinds.includes(c.kind))
      .map((c) => {
        const { urls, note } = splitUrlCell(c.url);
        const mustCredit = c.summary.startsWith(MUST_CREDIT_MARK);
        return {
          name: c.name,
          source: c.source,
          urls,
          urlUnknown: note.includes("要確認") || urls.length === 0,
          summary: mustCredit ? c.summary.slice(MUST_CREDIT_MARK.length).trim() : c.summary,
          mustCredit,
        };
      });
    if (items.length > 0) groups.push({ id: g.id, title: g.title, items });
  }
  return groups;
}
