import { describe, expect, it } from "vitest";
import { areas } from "./areas";
import { unitLabelText } from "./areaText";
import { autoRuby } from "./furigana";
import { rb } from "./ruby";
import { HARD_WORDS, keepsRuby, limitRuby } from "./rubyPolicy";

const shown = (source: string) =>
  limitRuby(rb(source))
    .filter((s) => s.ruby)
    .map((s) => s.text);

describe("ふりがなの方針(文法用語と難しい語だけ)", () => {
  it("常用の漢字の語には、ふりがなを付けない(漢字はそのまま残る)", () => {
    const result = limitRuby(rb("通信[つうしん]できないみたい。もう一度[いちど]試[ため]してね。"));
    expect(result.some((s) => s.ruby)).toBe(false);
    expect(result.map((s) => s.text).join("")).toBe("通信できないみたい。もう一度試してね。");
  });

  it("読みが難しい語(HARD_WORDS)には、ふりがなを残す", () => {
    expect(shown("苦手[にがて]を克服[こくふく]した。称号[しょうごう]と図鑑[ずかん]")).toEqual(["克服", "称号", "図鑑"]);
    for (const word of ["克服", "浄化", "称号", "図鑑"]) expect(HARD_WORDS.has(word), word).toBe(true);
  });

  it("文法用語(辞書にある語)には、ふりがなを残す。単元名・品詞名など", () => {
    const label = (id: string) => unitLabelText(areas.find((a) => a.id === id)!);
    expect(shown(label("kotobaNoIchiba"))).toEqual(["品詞", "自立語", "付属語"]);
    expect(shown(label("kizunaNoMa"))).toEqual(["文節"]);
    expect(shown(autoRuby("動詞・形容詞・形容動詞の活用"))).toEqual(["動詞", "形容詞", "形容動詞", "活用"]);
    expect(keepsRuby("敬語")).toBe(true);
    expect(keepsRuby("設定")).toBe(false);
  });

  it("ふりがな以外の文字・順序は変わらない", () => {
    const source = "エリアを選[えら]んで、克服[こくふく]しよう";
    expect(
      limitRuby(rb(source))
        .map((s) => s.text)
        .join(""),
    ).toBe("エリアを選んで、克服しよう");
  });
});
