"""
日本語フォントを、アプリで使っている文字だけに絞る(読み込みを軽くするため)。

  pip install fonttools brotli
  python scripts/subset-fonts.py

元: @fontsource/m-plus-rounded-1c の japanese-400 / japanese-700(各約0.9MB → 各約0.2MB)。
出力: src/assets/fonts/m-plus-rounded-1c-subset-{400,700}.woff2 と、含めた文字の一覧 charset.txt。
残すのは、ソース(src/ のテスト以外の .ts .tsx .css と index.html)に出てくる文字すべて + ひらがな・カタカナ・記号・英数字。
含まれていない文字(ニックネームに入れた珍しい漢字など)は、端末の標準の日本語フォントで表示される(表示は崩れない)。
問題やセリフに新しい漢字を足したら、このスクリプトを実行し直す(src/data/fontCoverage.test.ts が、足りない文字を教えてくれる)。
M PLUS Rounded 1c は SIL Open Font License 1.1(部分的に取り出して再配布してよい)。
"""
import glob
import os

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT = os.path.join(ROOT, "src", "assets", "fonts")


def source_chars() -> set[str]:
    chars: set[str] = set()
    for pattern in ("src/**/*.ts", "src/**/*.tsx", "src/**/*.css", "index.html"):
        for path in glob.glob(os.path.join(ROOT, pattern), recursive=True):
            if path.endswith((".test.ts", ".test.tsx")):
                continue
            with open(path, encoding="utf-8", errors="ignore") as f:
                chars.update(f.read())
    return chars


def base_chars() -> set[str]:
    chars: set[str] = set()
    # ASCII / 約物 / ひらがな・カタカナ / 全角英数・記号 / 矢印・図形・記号
    for a, b in [(0x20, 0x7E), (0x3000, 0x30FF), (0xFF01, 0xFF9F), (0x2010, 0x2027), (0x2190, 0x21FF), (0x25A0, 0x25FF)]:
        chars.update(chr(c) for c in range(a, b + 1))
    return chars


def main() -> None:
    chars = {c for c in source_chars() | base_chars() if ord(c) > 0x1F and c not in "\x7f"}
    os.makedirs(OUT, exist_ok=True)
    text = "".join(sorted(chars))
    with open(os.path.join(OUT, "charset.txt"), "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    for weight in (400, 700):
        src = os.path.join(
            ROOT, "node_modules", "@fontsource", "m-plus-rounded-1c", "files", f"m-plus-rounded-1c-japanese-{weight}-normal.woff2"
        )
        font = TTFont(src)
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = ["*"]
        options.name_IDs = ["*"]
        subsetter = subset.Subsetter(options)
        subsetter.populate(text=text)
        subsetter.subset(font)
        out = os.path.join(OUT, f"m-plus-rounded-1c-subset-{weight}.woff2")
        font.flavor = "woff2"
        font.save(out)
        print(f"{weight}: {os.path.getsize(src):,} -> {os.path.getsize(out):,} bytes ({len(chars)} 文字)")


if __name__ == "__main__":
    main()
