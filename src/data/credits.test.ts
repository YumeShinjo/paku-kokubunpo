import { readFileSync } from "node:fs";
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
        url: "",
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

  it("生成AIのイラスト(キャラクター・背景など)は、ファイルごとではなく、「イラスト: (制作方法)」の1文にまとめる", () => {
    const ai = "生成AI(Stable Diffusion / Illustrious-XL v2.0)によるオリジナル制作";
    const groups = buildCreditGroups([
      credit("マスコット コト", "画像", "生成AIによるオリジナル制作(制作者が加工)", ai),
      credit("王様ヴェルバルト", "画像", "生成AIによるオリジナル制作(制作者が加工)", ai),
      credit("小ボス7人", "画像", "生成AIによるオリジナル制作(制作者が加工)", ai),
      credit("エリア背景8種", "画像", "生成AIによるオリジナル制作(制作者が加工)", ai),
    ]);
    expect(groups.find((g) => g.kind === "画像")!.lines).toEqual([`イラスト: ${ai}`]);
  });

  it("実際の素材管理表からも、曲名・効果音名・キャラクター名を含まない簡略な表示になる", () => {
    const groups = buildCreditGroups(assetCredits);
    const all = groups.flatMap((g) => g.lines).join("\n");
    expect(all).toContain("鷹尾まさき(タカオマサキ) - OpenTracks");
    expect(all).toContain("イラスト: 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA");
    for (const secret of ["始まりの村", "禁忌の詠唱", "凍てつく世界", "The Forgotten Girl", "ヴェルバルト", "ニジュヴェール", "正解4", "hit02"]) {
      expect(all, secret).not.toContain(secret);
    }
    // ベース立ち絵(Stable Diffusion)・差分(表情・浄化後など。Geminiによる画像編集)・背景(SD+Geminiの併記)・
    // 最初の画面の素材(Geminiによる画像生成)は、出典の書き方がそれぞれ違うので4行に分かれる
    expect(groups.find((g) => g.kind === "画像")!.lines.filter((l) => l.startsWith("イラスト"))).toHaveLength(4);
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

describe("素材管理表: 入手元URL(講義の評価項目: 曲名・タイトル・URLまで特定できる形で示す)", () => {
  const byName = (part: string) => assetCredits.find((c) => c.name.includes(part))!;

  it("全素材に、入手元URLの欄がある。分からないものは、推測で書かず「要確認」と書いてある", () => {
    for (const c of assetCredits) {
      expect(c.url, `${c.name} の入手元URL`).not.toBe("");
      expect(/https?:\/\//.test(c.url) || c.url.includes("要確認") || c.url.startsWith("なし") || c.url.includes("参照"), `${c.name}: ${c.url}`).toBe(true);
    }
  });

  it("BGM・効果音は、すべて入手元URLがあるか、「要確認」になっている", () => {
    for (const c of assetCredits.filter((c) => c.kind === "BGM" || c.kind === "SE")) {
      expect(/https?:\/\//.test(c.url) || c.url.includes("要確認"), c.name).toBe(true);
    }
  });

  it("小ボス戦の曲と言の葉の森の曲は、同じ作曲者(Hareno)で、入手元は、それぞれの動画", () => {
    expect(byName("禁忌の詠唱").url).toBe("https://youtu.be/AdWxKyHYQM0");
    expect(byName("千年の内緒話").url).toBe("https://youtu.be/CGjkJKXqgHY");
    expect(byName("禁忌の詠唱").source).toBe("Hareno");
    expect(byName("千年の内緒話").source).toBe("Hareno");
  });

  it("「ライブラリ」「生成AIモデル」は、ゲーム内のクレジットには出さない(くわしい出典のページにだけ出る)", () => {
    expect(assetCredits.some((c) => c.kind === "ライブラリ")).toBe(true);
    expect(assetCredits.some((c) => c.kind === "生成AIモデル")).toBe(true);
    const kinds = buildCreditGroups(assetCredits).map((g) => g.kind);
    expect(kinds).toEqual(["画像", "BGM", "SE", "フォント"]);
  });

  it("音声・画像の素材ファイルは、GitHubに置かない(曲の二次配布の禁止のため。.gitignore で除外)", () => {
    const ignore = readFileSync(".gitignore", "utf-8");
    expect(ignore).toContain("src/assets/audio/*/*");
    expect(ignore).toContain("src/assets/images/*/*");
  });
});
