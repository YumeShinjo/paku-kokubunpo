import { describe, expect, it } from "vitest";
import { autoRuby } from "./furigana";
import { rb } from "./ruby";

describe("autoRuby", () => {
  it("文法用語に rb() 記法のふりがなを付ける", () => {
    expect(autoRuby("「弟が」に対応する述語をタップ")).toBe(
      "「弟が」に対応する述語[じゅつご]をタップ",
    );
  });

  it("長い語を優先する(接続助詞は接続と分けず、接続の関係は接続として付ける)", () => {
    expect(autoRuby("接続助詞")).toBe("接続助詞[せつぞくじょし]");
    expect(autoRuby("接続の関係")).toBe("接続[せつぞく]の関係");
    expect(autoRuby("接続詞")).toBe("接続詞[せつぞくし]");
  });

  it("修飾・被修飾のように並んだ語をそれぞれに付ける", () => {
    expect(autoRuby("修飾・被修飾の関係")).toBe(
      "修飾[しゅうしょく]・被修飾[ひしゅうしょく]の関係",
    );
  });

  it("すでにふりがながある語には二重に付けない", () => {
    expect(autoRuby("格助詞[かくじょし]の識別")).toBe("格助詞[かくじょし]の識別");
    expect(autoRuby("自立語[じりつご]")).toBe("自立語[じりつご]");
  });

  it("辞書にない別の漢字が前後に続く語は、用語の一部として誤って付けない", () => {
    expect(autoRuby("可能性がある")).toBe("可能性がある");
    expect(autoRuby("過去問を解く")).toBe("過去問を解く");
  });

  it("品詞名・活用名・活用の種類にもふりがなが付く", () => {
    expect(autoRuby("名詞と動詞")).toBe("名詞[めいし]と動詞[どうし]");
    expect(autoRuby("形容動詞の連用形")).toBe("形容動詞[けいようどうし]の連用形[れんようけい]");
    expect(autoRuby("サ行変格活用")).toBe("サ行変格活用[ぎょうへんかくかつよう]");
    expect(autoRuby("上一段活用")).toBe("上一段活用[かみいちだんかつよう]");
    expect(autoRuby("促音便")).toBe("促音便[そくおんびん]");
  });

  it("辞書にない語や、ふりがな不要な文はそのまま", () => {
    expect(autoRuby("これは私の本だ。")).toBe("これは私の本だ。");
  });

  it("rb() に渡すと、用語だけが正しくルビ付きセグメントになる", () => {
    expect(rb(autoRuby("並立の関係"))).toEqual([
      { text: "並立", ruby: "へいりつ" },
      { text: "の関係" },
    ]);
  });
});
