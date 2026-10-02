import { readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/global.css", "utf-8");
const rule = (selector: string) => {
  const start = css.lastIndexOf(`\n${selector} {`);
  return start < 0 ? "" : css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
};

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = `${dir}/${name}`;
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("文言: 「ことばの正解」は「正解した問題」に、そろえてある", () => {
  it("ソース・テスト・ドキュメントに、「ことばの正解」が残っていない(この確認のテスト自身は除く)", () => {
    const targets = [...files("src"), ...files("docs"), ...files("e2e").filter((f) => f.endsWith(".ts")), "README.md", "STORY.md.md"].filter(
      (f) => /\.(ts|tsx|md|css)$/.test(f) && !f.endsWith("wordingAndSpacing.test.tsx"),
    );
    const found = targets.filter((f) => readFileSync(f, "utf-8").includes("ことばの正解"));
    expect(found).toEqual([]);
  });

  it("ホーム画面の進捗は「正解した問題 N / 392問」(数え方は、ユニークな正解問題数・分母は全問題)", () => {
    const source = readFileSync("src/components/MasteryProgress.tsx", "utf-8");
    expect(source).toContain("正解した問題 {correctCount} / {total}問");
    expect(source).toContain('aria-label="正解した問題の進み具合"');
    expect(source).toContain("useMasteryStore((s) => s.correctQuestionIds.length)");
    expect(source).toContain("getAllQuestions().length");
  });
});

describe("出題画面の上の3つのボタン(にがて・ぶんぽう・やめる)", () => {
  it("押せる範囲は、見えない枠で、見た目より広げてある(見た目は約29〜33px。押せる高さは44px以上)", () => {
    const before = rule(".stage-actions button::before");
    expect(before).toContain("position: absolute;");
    const inset = before.match(/inset: -([\d.]+)rem -([\d.]+)rem;/)!;
    const vertical = Number(inset[1]) * 16 * 2; // 上下に広げる分(px)
    expect(29 + vertical).toBeGreaterThanOrEqual(44); // いちばん低いボタン(29px)でも、押せる高さは44px以上
    expect(rule(".stage-actions button")).toContain("position: relative;");
    expect(rule(".stage-actions button")).toContain("white-space: nowrap;");
  });

  it("文字サイズ「大」では、「ぶんぽう」が1文字ふえても、ボタンの文字がはみ出さないよう、少し小さくする", () => {
    expect(rule('html[data-text-size="large"] .stage-actions button')).toMatch(/font-size: 0\.\d+rem;/);
  });
});

describe("言の葉の森の入口の余白(ホーム画面と同じ、見える縁から見える縁まで10px)", () => {
  it("縦の間隔は --entry-gap(10px)。範囲のボタンは、下の立体の縁(3px)の分、ボタンどうしを 10px + 3px 離す", () => {
    const entry = rule(".screen-kotonoha-entry");
    expect(entry).toContain("--entry-gap: 0.625rem;");
    expect(entry).toContain("--entry-depth: 3px;");
    expect(entry).toContain("gap: var(--entry-gap);");
    expect(rule(".kotonoha-scope-list")).toContain("gap: calc(var(--entry-gap, 0.5rem) + var(--entry-depth, 0px));");
    expect(rule(".screen-kotonoha-entry .kotonoha-zukan-link")).toContain("margin-top: var(--entry-depth);");
    // 範囲のボタンの立体の縁は、本当に 3px
    expect(rule(".kotonoha-scope-list button")).toContain("box-shadow: 0 3px 0");
  });

  it("下は、音量ボタン(右上)のために空けなくてよい。画面の下の安全な余白(safe-area)だけ", () => {
    expect(rule(".screen-kotonoha-entry")).toContain("padding-bottom: calc(1rem + env(safe-area-inset-bottom));");
  });

  it("範囲のボタン3つは、同じ高さ(ふりがなのある「故事成語」の行に合わせる)。「ずかんを みる」は高さ44px以上で、下の余白に、安全な余白(safe-area)を足して広げない", () => {
    expect(rule(".kotonoha-scope-list button")).toMatch(/min-height: 4\.15rem;/);
    expect(Number(rule(".kotonoha-zukan-link").match(/min-height: ([\d.]+)rem/)?.[1])).toBeGreaterThanOrEqual(2.75);
    expect(rule(".kotonoha-zukan-link")).not.toContain("safe-area-inset-bottom");
  });
});
