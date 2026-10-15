"""
素材管理表(docs/ASSET_CREDITS.md)から、解説書用の出典一覧(docs/SOURCES_FOR_REPORT.md)を作る。
台帳を直したら、これを実行して、一覧を作り直す(src/data/credits.test.ts が、台帳と一覧が合っているかを確かめる)。
  実行: PYTHONIOENCODING=utf-8 python scripts/export-sources.py
"""

ledger = open("docs/ASSET_CREDITS.md", encoding="utf-8").read().replace("\r\n", "\n")
rows = []
for line in ledger.split("\n"):
    s = line.strip()
    if not s.startswith("|"):
        continue
    cells = [c.strip() for c in s.strip("|").split("|")]
    if len(cells) < 6 or cells[0] == "素材名" or set(cells[0]) <= set("-: ") or cells[0].startswith("(例)"):
        continue
    rows.append(dict(zip(["name", "kind", "source", "license", "usage", "url"], cells[:6])))

GROUPS = [
    ("BGM(音楽)", ["BGM"]),
    ("効果音", ["SE"]),
    ("画像", ["画像"]),
    ("画像をつくったAI・ツール", ["生成AIモデル"]),
    ("制作素材(タイトルロゴの制作に使ったサービス・イラスト・フォント)", ["制作素材"]),
    ("フォント", ["フォント"]),
    ("ライブラリ・アイコン", ["ライブラリ"]),
]


def esc(t):
    return t.replace("|", "｜")


out = []
out.append("# 出典一覧(解説書への転記用)\n")
out.append("パクっと国文法で使った、すべての素材・ツール・ライブラリの出典の一覧。`docs/ASSET_CREDITS.md`(素材管理表)から、`scripts/export-sources.py` で作った。")
out.append("アプリの中では、クレジット画面の「くわしい出典」でも、同じ内容を見られる。\n")
out.append("- 確認日: 2026-10-15(小ボス戦の曲と言の葉の森の曲は、制作者が 2026-10-14 に確認)")
out.append("- 「要確認」は、配布ページ・規約が見つからなかった、または規約の本文を取得できなかったもの。URLや条件は、推測では書いていない")
out.append("- 音声・画像のファイルそのものは、GitHub のリポジトリに入れていない(曲の二次配布の禁止のため。`.gitignore` で除外)")
out.append("- タイトルロゴの画像ファイルは、素材として単体で配布しない(ソースコードの提出でも、アプリの一部としてのみ)\n")
out.append("**自作証明**: 情報通信技術活用論 2026\n")

for title, kinds in GROUPS:
    items = [r for r in rows if r["kind"] in kinds]
    if not items:
        continue
    out.append(f"## {title}\n")
    out.append("| 名称 | 作者・提供元 | 入手元URL | ライセンス・条件 | 使った場所 |")
    out.append("| --- | --- | --- | --- | --- |")
    for r in items:
        out.append("| " + " | ".join(esc(r[k]) for k in ["name", "source", "url", "license", "usage"]) + " |")
    out.append("")

out.append("## クレジットの表記が必要・希望されている素材\n")
out.append("- 効果音「holy1」(ポケットサウンド): **規約で必要**。「効果音：ポケットサウンド – https://pocket-se.info/」(教育機関でリンクが困難な場合は免除だが、書ける場合は書く。規約 https://pocket-se.info/rules/)")
out.append("- BGM「Prairie4」(PeriTune): **規約(CC BY 4.0)で必要**。曲名・作者・ライセンス名・入手元を示す(https://peritune.com/blog/2019/03/01/prairie4/)")
out.append("- ロゴのフォント「あかずきんポップ」: **作者の希望**(必須ではない)。「フォント：あかずきんポップ フリーダウンロード：https://flopdesign.booth.pm/items/1748058」")
out.append("- 上の3つは、アプリの「くわしい出典」に載せている。ゲーム内のクレジット画面には、ポケットサウンドの1行だけを載せている\n")

out.append("## 要確認の一覧\n")
pending = [r for r in rows if "要確認" in r["license"] or "要確認" in r["url"] or "要確認" in r["source"]]
out.append("| 名称 | 要確認の内容 |")
out.append("| --- | --- |")
for r in pending:
    notes = []
    if "要確認" in r["url"]:
        notes.append("入手元URL")
    if "要確認" in r["license"]:
        notes.append("ライセンス・条件")
    if "要確認" in r["source"]:
        notes.append("出典")
    out.append(f"| {esc(r['name'])} | {'・'.join(notes)} |")
out.append("")
open("docs/SOURCES_FOR_REPORT.md", "w", encoding="utf-8", newline="\n").write("\n".join(out))
print(len(rows), "rows;", len(pending), "pending")
