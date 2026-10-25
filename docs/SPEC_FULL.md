# パクっと国文法 仕様書(完全版)

ストーリー・ゲームの仕組み・機能を、**コードを一次情報**として網羅した仕様書。章ごとにファイルを分けている(`docs/spec/`)。

## 書き方のきまり

- コードで確かめられたことだけを書き、確かめられなかったことは「**未確認**」と書く。
- 数字(問題数・HP・ライフ・閾値・保存キーなど)は、コードの値をそのまま写している。
- 各章の末尾に、「**食い違い**」(コードと既存の記録の違い。どちらが正しいかの判断材料つき)と、「**根拠にしたファイル**」を置く。
- 隠しデバッグ機能(音のログ・全解放)は、存在だけを書き、操作の手順は書かない(公開リポジトリのため)。
- 台詞の全文は載せない(場面ごとの要約と、データの場所だけ)。

## 目次

| 章 | タイトル | ファイル |
|---|---|---|
| 1 | 概要 | [spec/01-overview.md](spec/01-overview.md) |
| 2 | 画面一覧と画面遷移 | [spec/02-screens.md](spec/02-screens.md) |
| 3 | ゲームの進行 | [spec/03-progression.md](spec/03-progression.md) |
| 4 | 出題の仕組み | [spec/04-quiz.md](spec/04-quiz.md) |
| 5 | ボス戦のルール | [spec/05-boss.md](spec/05-boss.md) |
| 6 | ストーリー | [spec/06-story.md](spec/06-story.md) |
| 7 | キャラクターと図鑑 | [spec/07-characters.md](spec/07-characters.md) |
| 8 | 言の葉の森 | [spec/08-kotonoha.md](spec/08-kotonoha.md) |
| 9 | 称号・成績・ランキング | [spec/09-titles-ranking.md](spec/09-titles-ranking.md) |
| 10 | 設定・引き継ぎ・データ | [spec/10-settings-data.md](spec/10-settings-data.md) |
| 11 | 表示とアクセシビリティ | [spec/11-display-accessibility.md](spec/11-display-accessibility.md) |
| 12 | 音 | [spec/12-sound.md](spec/12-sound.md) |
| 13 | 画像素材 | [spec/13-images.md](spec/13-images.md) |
| 14 | 出典・ライセンス・プライバシー | [spec/14-credits-privacy.md](spec/14-credits-privacy.md) |
| 15 | テストと品質 | [spec/15-testing-quality.md](spec/15-testing-quality.md) |
| 16 | 既知の課題と今後の候補 | [spec/16-issues-future.md](spec/16-issues-future.md) |
