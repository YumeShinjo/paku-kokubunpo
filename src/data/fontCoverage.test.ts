import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 日本語フォントは、使う文字だけに絞ってある(scripts/subset-fonts.py)。問題・セリフなどのデータ(src/data)に
 * 新しい文字を足したときは、スクリプトを実行し直さないと、その文字だけ標準のフォントで表示され、見た目がそろわない。
 * ここで、足りない文字を見つけて教える。
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.ts$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });
}

describe("日本語フォントの文字の網羅", () => {
  it("問題・セリフなどのデータ(src/data)で使っている文字は、すべて、絞ったフォントに含まれている", () => {
    const charsetPath = "src/assets/fonts/charset.txt";
    expect(existsSync(charsetPath), "scripts/subset-fonts.py で作る charset.txt がない").toBe(true);
    const included = new Set(readFileSync(charsetPath, "utf-8"));
    const missing = new Set<string>();
    for (const file of files("src/data")) {
      for (const ch of readFileSync(file, "utf-8")) {
        if (ch.codePointAt(0)! > 0x1f && !included.has(ch)) missing.add(ch);
      }
    }
    expect([...missing].join(""), "足りない文字。`python scripts/subset-fonts.py` を実行し直してください").toBe("");
  });
});
