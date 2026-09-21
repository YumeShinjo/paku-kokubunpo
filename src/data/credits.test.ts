import { describe, expect, it } from "vitest";
import { assetCredits, parseAssetCredits } from "./credits";

const SAMPLE = `# 素材管理表

| 素材名 | 種別(画像/BGM/SE) | 出典・生成方法 | ライセンス | 使用箇所 |
| --- | --- | --- | --- | --- |
| (例)相棒_通常.png | 画像 | 生成AIツール名を記載 | 利用規約確認済み | マスコット全般 |
| title.mp3 | BGM | フリー素材サイトA | 商用可 | タイトル画面 |
| （例）全角の例 | 画像 | x | y | z |
| 文章中の | 区切りだけの行 |
`;

describe("素材管理表(docs/ASSET_CREDITS.md)の読み込み", () => {
  it("見出し行・区切り行・「(例)」の行を除き、素材の行だけを取り出す", () => {
    expect(parseAssetCredits(SAMPLE)).toEqual([
      {
        name: "title.mp3",
        kind: "BGM",
        source: "フリー素材サイトA",
        license: "商用可",
        usage: "タイトル画面",
      },
    ]);
  });

  it("実際の素材管理表を読み込め、各行に出典とライセンスが書かれている(空欄の書き忘れ検出)", () => {
    expect(assetCredits.length).toBeGreaterThan(0);
    for (const c of assetCredits) {
      expect(c.name, "素材名").not.toBe("");
      expect(c.source, `${c.name} の出典`).not.toBe("");
      expect(c.license, `${c.name} のライセンス`).not.toBe("");
      expect(c.name.startsWith("(例)")).toBe(false);
    }
  });
});
