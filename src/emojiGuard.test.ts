import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 画面の部品(app / components / features)のソースに、絵文字を書かない(アイコンは lucide-react を使う)。
 * 問題文・選択肢・ストーリーの台詞(src/data)は対象外。
 * 例外: マスコットの素材(画像)が置かれていないときの仮表示の絵文字(features/mascot/Mascot.tsx)。本番では画像が出るので見えない。
 */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B06}\u{2B05}\u{2B07}]/u;
const ALLOWED = new Set(["src/features/mascot/Mascot.tsx"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("絵文字を使わない(画面の部品)", () => {
  it("app / components / features のソースに、絵文字がない(マスコットの仮表示を除く)", () => {
    const offenders: string[] = [];
    for (const root of ["src/app", "src/components", "src/features"]) {
      for (const file of sourceFiles(root)) {
        const normalized = file.replace(/\\/g, "/");
        if (ALLOWED.has(normalized)) continue;
        readFileSync(file, "utf-8")
          .split(/\r?\n/)
          .forEach((line, i) => {
            if (EMOJI.test(line)) offenders.push(`${normalized}:${i + 1}`);
          });
      }
    }
    expect(offenders).toEqual([]);
  });
});
