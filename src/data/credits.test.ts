import { describe, expect, it } from "vitest";
import { assetCredits, buildCreditGroups, formatMusicCredit, parseAssetCredits, withoutNote } from "./credits";

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

const credit = (name: string, kind: string, source: string, license: string) => ({ name, kind, source, license, usage: "使用箇所" });

describe("ゲーム内クレジットの表示(ネタバレ防止のため簡略化)", () => {
  it("出典が「サイト名 / 作曲者名」なら「作曲者名 - サイト名」に直す。それ以外はそのまま", () => {
    expect(formatMusicCredit("OpenTracks / 鷹尾まさき(タカオマサキ)")).toBe("鷹尾まさき(タカオマサキ) - OpenTracks");
    expect(formatMusicCredit("zippy")).toBe("zippy");
    expect(formatMusicCredit("On-Jin ～音人～")).toBe("On-Jin ～音人～");
  });

  it("BGM・効果音は、曲名・ファイル名・使用箇所を出さず、出典だけを重複なく並べる", () => {
    const groups = buildCreditGroups([
      credit("始まりの村 A / 始まりの村 B", "BGM", "zippy", "規約"),
      credit("星降る丘 LoopA / LoopB", "BGM", "zippy", "規約"),
      credit("爽やかなアイリッシュ的なBGM_2", "BGM", "OpenTracks / 鷹尾まさき(タカオマサキ)", "規約"),
      credit("正解4", "SE", "Springin", "規約"),
      credit("jingle_23", "SE", "Springin", "規約"),
      credit("one23", "SE", "くらげ工匠", "規約"),
    ]);
    expect(groups.find((g) => g.kind === "BGM")!.lines).toEqual(["zippy", "鷹尾まさき(タカオマサキ) - OpenTracks"]);
    expect(groups.find((g) => g.kind === "SE")!.lines).toEqual(["Springin", "くらげ工匠"]);
    const all = groups.flatMap((g) => g.lines).join("\n");
    for (const secret of ["始まりの村", "星降る丘", "正解4", "jingle_23", "one23", "使用箇所", "規約"]) {
      expect(all, secret).not.toContain(secret);
    }
  });

  it("生成AIのキャラクター画像は、ファイルごとではなく、「キャラクターイラスト: (制作方法)」の1文にまとめる", () => {
    const ai = "生成AI(Stable Diffusion / Illustrious-XL v2.0)によるオリジナル制作";
    const groups = buildCreditGroups([
      credit("マスコット コト", "画像", "生成AIによるオリジナル制作(制作者が加工)", ai),
      credit("王様ヴェルバルト", "画像", "生成AIによるオリジナル制作(制作者が加工)", ai),
      credit("小ボス7人", "画像", "生成AIによるオリジナル制作(制作者が加工)", ai),
    ]);
    expect(groups.find((g) => g.kind === "画像")!.lines).toEqual([`キャラクターイラスト: ${ai}`]);
  });

  it("実際の素材管理表からも、曲名・効果音名・キャラクター名を含まない簡略な表示になる", () => {
    const groups = buildCreditGroups(assetCredits);
    const all = groups.flatMap((g) => g.lines).join("\n");
    expect(all).toContain("鷹尾まさき(タカオマサキ) - OpenTracks");
    expect(all).toContain("キャラクターイラスト: 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA");
    for (const secret of ["始まりの村", "禁忌の詠唱", "凍てつく世界", "The Forgotten Girl", "ヴェルバルト", "ニジュヴェール", "正解4", "hit02"]) {
      expect(all, secret).not.toContain(secret);
    }
    expect(groups.find((g) => g.kind === "画像")!.lines.filter((l) => l.startsWith("キャラクターイラスト"))).toHaveLength(1);
  });

  it("素材管理表そのものは、詳細(素材名・使用箇所)を保持している", () => {
    expect(assetCredits.some((c) => c.name.includes("始まりの村") && c.usage !== "")).toBe(true);
  });

  it("画像(生成AI以外)・フォントは、細かい注記(スクリプト名・ライセンスの説明書き)を出さない", () => {
    expect(withoutNote("自作(scripts/generate-icons.py で生成)")).toBe("自作");
    expect(withoutNote("SIL Open Font License 1.1(自由に使用・再配布可)")).toBe("SIL Open Font License 1.1");
    expect(withoutNote("注記のない文")).toBe("注記のない文");
    const all = buildCreditGroups(assetCredits).flatMap((g) => g.lines).join(" / ");
    expect(all).not.toContain("generate-icons");
    expect(all).toContain("M PLUS Rounded 1c(SIL Open Font License 1.1)");
  });
});
