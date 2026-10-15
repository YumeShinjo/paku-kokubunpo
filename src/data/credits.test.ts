import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assetCredits, buildCreditGroups, formatMusicCredit, parseAssetCredits, softwareCredits, withoutNote } from "./credits";

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

const credit = (name: string, kind: string, source: string, license: string) => ({ name, kind, source, license, usage: "使用箇所", url: "" });

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

  it("解説書用の出典一覧(docs/SOURCES_FOR_REPORT.md)に、台帳の全素材と、入手元URLがある(台帳を直したら、一覧も作り直す)", () => {
    const report = readFileSync("docs/SOURCES_FOR_REPORT.md", "utf-8");
    expect(report).toContain("情報通信技術活用論 2026");
    for (const c of assetCredits) {
      expect(report, c.name).toContain(c.name);
      for (const url of c.url.match(/https?:\/\/[^\s()（）、。「」]+/g) ?? []) expect(report, `${c.name}: ${url}`).toContain(url);
    }
  });

  it("ポケットサウンドは、規約が必須とする書式「効果音:ポケットサウンド – https://pocket-se.info/」の1行になり、リンクになる", () => {
    const se = buildCreditGroups(assetCredits).find((g) => g.kind === "SE")!;
    expect(se.lines).toContain("効果音:ポケットサウンド – https://pocket-se.info/");
    expect(se.lines).not.toContain("ポケットサウンド"); // 同じ出典の行が、二重にならない
    expect(se.links).toEqual({ "効果音:ポケットサウンド – https://pocket-se.info/": "https://pocket-se.info/" });
    // ほかの出典の行は、これまでどおり(曲名・効果音名は出さない)
    expect(se.lines).toContain("Springin' Sound Stock");
    expect(buildCreditGroups(assetCredits).find((g) => g.kind === "BGM")!.links).toBeUndefined();
  });

  it("つかったソフトウェアに、lucide-react・qrcode-generator・jsQR がある(ライセンス名つき)。くわしい出典にも、同じ3つがある", () => {
    const names = softwareCredits.map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(["lucide-react", "qrcode-generator", "jsQR"]));
    expect(softwareCredits.find((s) => s.name === "lucide-react")!.license).toBe("ISC License");
    expect(softwareCredits.find((s) => s.name === "qrcode-generator")!.license).toBe("MIT License");
    expect(softwareCredits.find((s) => s.name === "jsQR")!.license).toBe("Apache License 2.0");
    const libraries = assetCredits.filter((c) => c.kind === "ライブラリ");
    for (const word of ["lucide-react", "qrcode-generator", "jsQR"]) {
      const row = libraries.find((c) => c.name.includes(word))!;
      expect(row, word).toBeDefined();
      expect(row.url, word).toMatch(/https?:\/\//);
      expect(row.license, word).not.toBe("");
    }
  });
});

describe("素材管理表: 2026-10-15 に特定した出典・規約の反映", () => {
  const byName = (part: string) => assetCredits.find((c) => c.name.includes(part))!;

  it("効果音: くらげ工匠・効果音工房・VSQ plus+・ポケットサウンドの入手元と、規約の要点", () => {
    for (const name of ["hit02", "one23"]) {
      const row = byName(name);
      expect(row.url, name).toContain("http://www.kurage-kosho.info/");
      expect(row.url.match(/https?:\/\/\S+/g), `${name}: 直リンクは載せない(サイトのトップだけ)`).toEqual(["http://www.kurage-kosho.info/"]);
      expect(row.url, name).toContain(`${name}.mp3`); // ファイル名だけ
      for (const word of ["商用・非商用可", "加工可", "クレジットは不要", "フリー効果音素材 くらげ工匠", "再配布は禁止", "直リンク"]) expect(row.license, `${name}: ${word}`).toContain(word);
    }
    const cancel = byName("se_cancel15");
    expect(cancel.url).toBe("https://umipla.com/soundeffect/4388");
    for (const word of ["個人・サークル", "報告・クレジットは不要", "再配布は禁止", "Content ID", "法人"]) expect(cancel.license, word).toContain(word);
    const vsq = byName("VSQ_JINGLE");
    expect(vsq.url).toBe("https://vsq.co.jp/plus/wordpress/wp-content/uploads/2021/07/VSQ_JINGLE_0067_Otoboke_01.mp3");
    for (const word of ["ゲームへの利用可", "クレジットは任意", "単体で頒布することは禁止"]) expect(vsq.license, word).toContain(word);
    const holy = byName("holy1");
    expect(holy.url).toContain("https://pocket-se.info/archives/412/");
    for (const word of ["クレジット表記か、サイトへのリンクが必須", "教育機関でリンクが困難な場合は免除", "効果音：ポケットサウンド – https://pocket-se.info/", "直リンクは禁止"]) expect(holy.license, word).toContain(word);
  });

  it("Springin' の効果音には、Sound Stockのガイドラインが適用され、アプリ本体の規約は混ぜない", () => {
    for (const name of ["正解4", "jingle_23", "衝撃", "ジングル21"]) {
      const row = byName(name);
      expect(row.license, name).toContain("https://www.springin.org/sound-stock/guideline/");
      expect(row.license, name).toContain("Springin'アプリ本体の利用規約");
      expect(row.license, name).toContain("効果音素材の規約ではないので、この台帳には含めない");
    }
  });

  it("BGM: zippyの3曲(FANBOXの規約)・EigHt(利用規約)の条件", () => {
    for (const name of ["始まりの村", "星降る丘", "The Forgotten Girl"]) {
      const row = byName(name);
      for (const word of ["2024-09-18公開", "【フリーBGM】の表記がある曲のみ二次利用可", "ゲームへの利用可", "キー変更・ピッチ変更は禁止", "著作権法第35条", "音楽：zippy（https://www.youtube.com/@zippysound）"]) expect(row.license, `${name}: ${word}`).toContain(word);
    }
    const eight = byName("凍てつく世界の果て");
    for (const word of ["2024-03-22公開", "ゲームへの利用可", "音楽：EigHt", "Content ID登録は禁止", "完全なオリジナルとして公開・販売することは不可", "著作権法第35条", "要確認"]) expect(eight.license, word).toContain(word);
  });

  it("画像の生成: LoRA・Illustrious-XL・sd-webui-forge-classic・Gemini を、記載のページごとに分けて書く", () => {
    const lora = byName("Chibi Lerasigma");
    expect(lora.url).toContain("https://civitai.com/models/966828/chibi-lerasigma-228-style");
    expect(lora.url).toContain("https://civarchive.com/models/966828");
    for (const word of ["Fair AI Public License 1.0-SD", "権利を主張しない", "Pony", "削除された"]) expect(lora.license, word).toContain(word);
    const ill = byName("Illustrious-XL");
    expect(ill.url).toBe("https://huggingface.co/OnomaAIResearch/Illustrious-XL-v2.0");
    expect(ill.license).toContain("Hugging Faceのモデルページ");
    expect(ill.license).toContain("creativeml-openrail-m");
    expect(ill.license).toContain("CivitAI側の表記は、Fair AI Public License 1.0-SD");
    const forge = byName("sd-webui-forge-classic");
    expect(forge.url).toBe("https://github.com/Haoming02/sd-webui-forge-classic");
    expect(forge.license).toContain("AGPL-3.0");
    const gemini = byName("Gemini(");
    expect(gemini.url).toContain("https://support.google.com/gemini/answer/16625148?hl=ja");
    expect(gemini.license).toContain("要確認(ユーザー記入)");
  });

  it("タイトルロゴ: 制作のサービス・イラスト・フォントの行があり、ゲーム内のクレジットには出ない", () => {
    const names = ["Vサムネ", "Photopea", "肉球のアイコン3", "葉っぱアイコン", "あかずきんポップ", "M+ FONTS", "Monomaniac One"];
    for (const name of names) {
      const row = byName(name);
      expect(row.kind, name).toBe("制作素材");
      expect(row.url, name).toMatch(/https?:\/\//);
    }
    expect(byName("Vサムネ").license).toContain("素材そのものの配布・再配布は禁止");
    expect(byName("Photopea").license).toContain("制作物は、すべて制作者のもの");
    expect(byName("肉球のアイコン3").license).toContain("アイコンやフォントのジェネレーターの素材にすることも禁止");
    expect(byName("肉球のアイコン3").url).toContain("https://icooon-mono.com/12783-");
    expect(byName("葉っぱアイコン").url).toContain("https://icooon-mono.com/13591-");
    expect(byName("あかずきんポップ").url).toBe("https://flopdesign.booth.pm/items/1748058");
    expect(byName("あかずきんポップ").license).toContain("Copyright(c) 2018 M+ FONTS PROJECT");
    expect(byName("Monomaniac One").license).toContain("SIL Open Font License, Version 1.1");
    const logo = byName("タイトルロゴ");
    expect(logo.license).toContain("単体で配布しない");
    expect(logo.usage).toContain("Vサムネ・Photopeaで制作し、ICOON MONOのイラストを加工");
    // ゲーム内のクレジットの表記は、これまでどおり(制作素材は出ない。ロゴの行は「ロゴ: 制作者による制作」のまま)
    const game = buildCreditGroups(assetCredits).flatMap((g) => g.lines).join("\n");
    for (const word of names) expect(game, word).not.toContain(word);
    expect(game).toContain("制作者による制作");
  });
});
