import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { rb } from "@/data/ruby";
import { splitTargets, targetOnly } from "@/data/targetText";
import { TargetText } from "./TargetText";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flat = (pieces: ReturnType<typeof splitTargets>) =>
  pieces.map((p) => `${p.target ? "[" : ""}${p.text.map((s) => s.text).join("")}${p.target ? "]" : ""}`).join("|");

describe("splitTargets(「」でくくられた対象の語を取り出す)", () => {
  it("対象の語を「」の外と分ける。「」そのものは取り除く", () => {
    expect(flat(splitTargets(rb("校庭に「桜」が咲いている。")))).toBe("校庭に|[桜]|が咲いている。");
    expect(flat(splitTargets(rb("彼は「ゆっくり」歩く。")))).toBe("彼は|[ゆっくり]|歩く。");
  });

  it("文頭・文末の対象、「」のない文、複数の対象", () => {
    expect(flat(splitTargets(rb("「走る」のは楽しい。")))).toBe("[走る]|のは楽しい。");
    expect(flat(splitTargets(rb("これは私の本「だ」")))).toBe("これは私の本|[だ]");
    expect(flat(splitTargets(rb("何も無い文。")))).toBe("何も無い文。");
    expect(flat(splitTargets(rb("「花」と「山」")))).toBe("[花]|と|[山]");
  });

  it("ふりがな付きの語は、ふりがなを保ったまま、対象にも外側にも入る", () => {
    const pieces = splitTargets(rb("「品詞[ひんし]」を答[こた]える"));
    expect(pieces[0]).toEqual({ text: [{ text: "品詞", ruby: "ひんし" }], target: true });
    expect(pieces[1].target).toBe(false);
    expect(pieces[1].text).toEqual([{ text: "を" }, { text: "答", ruby: "こた" }, { text: "える" }]);
  });

  it("「」が閉じていなくても、文字は失われない", () => {
    expect(flat(splitTargets(rb("あ「い")))).toBe("あ|[い]");
  });
});

describe("TargetText", () => {
  it("対象の語をカード(.target-card)にし、「」は表示しない。文全体の文字は保たれる", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<TargetText text={rb("校庭に「桜」が咲いている。")} />));
    expect(container.querySelector(".target-card")?.textContent).toBe("桜");
    expect(container.textContent).toBe("校庭に桜が咲いている。");
    expect(container.textContent).not.toContain("「");
    act(() => root.unmount());
    container.remove();
  });
});

describe("targetOnly(対象の語だけ。カゴの中・ドラッグ中の小さな表示用)", () => {
  it("「」の内側だけを取り出す。複数あれば順に並べる。ない文は null", () => {
    const text = (t: ReturnType<typeof targetOnly>) => t?.map((s) => s.text).join("") ?? null;
    expect(text(targetOnly(rb("校庭に「桜」が咲いている。")))).toBe("桜");
    expect(text(targetOnly(rb("「花」と「山」")))).toBe("花山");
    expect(targetOnly(rb("何も無い文。"))).toBeNull();
  });
});
