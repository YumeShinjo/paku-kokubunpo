# 17. 付録

用語、数字の索引(定数・件数)、画面ID、フォルダ構成、コマンド、記録(文書)の一覧をまとめる。数字は、各章で確かめた値の再掲。変わりやすい値の元はコード。

## 17.1 用語集

| 用語 | 意味 |
|---|---|
| コト | 主人公の相棒のマスコット。正体は王女コレット(7章) |
| ことだま使い | 言葉の乱れを整える人。主人公 |
| 乱れ | 国に広がる「言葉の乱れ」。取り憑かれた者が、小ボス・ラスボスになる(6章) |
| 浄化 | ボスを倒すこと。倒すのではなく浄化する(5・6章) |
| ことだまの書 | 図鑑。5つのタブ(せいとうりつ・ぶんぽう・なかま・ことのは・おもいで)(7章) |
| ぶんぽうの ずかん | 文法のことばのまとめ(7章) |
| なかまの ずかん | 出会った仲間の紹介(7章) |
| 言の葉の森 | ことわざ・故事成語のミニゲーム(8章) |
| 葉 | 言の葉の森で、初めて正解した問題。80枚で称号(8・9章) |
| ユライ | 言の葉の森の案内役(8章) |
| 星 | 苦手問題の印。間違えると付き、正解し直すと外れる(4章) |
| にがて | 単元の直近10問のうち3問以上で正答率60%未満(4章) |
| 画面(出題の単位) | 392。仕分けは1画面に複数の語を並べる(4章) |
| 小ボス・ラスボス | 各エリアの中間・最終のボス戦(5章) |
| 関門 | 次のエリアを開く条件(小ボスの撃破。序章は全ステージ)(3章) |
| 助けてもらった(先へすすむ) | 小ボスに2回以上負けたあとの救済(5章) |
| エンディング分岐 | 王座の間の選択。称号が決まる(6・9章) |
| 称号(二つ名) | 分岐の選択、または葉80枚でもらう(9章) |
| クラスコード | ランキングの合言葉。同じコードの人だけが順位を見られる(9章) |
| 引き継ぎコード | 機種変更のとき、進み具合を移す文字列(10章) |
| 解禁 | 最初のタップで音を使えるようにすること(12章) |
| ダッキング | 効果音の間、BGMを一時的に下げること(12章) |
| 全解放 | 隠しデバッグ機能(存在のみ。操作は書かない) |
| 音のログ | 隠しデバッグ機能(存在のみ) |

## 17.2 数字の索引

### 規模

| 項目 | 値 | 章 |
|---|---|---|
| エリア | 8(序章+7) | 1・3 |
| 単元 | 29 | 4 |
| 出題(画面) | 392(選択式247・文中タップ35・穴埋め99・仕分け11) | 4 |
| 小ボス / ラスボス | 7 / 1 | 5 |
| ストーリーの場面 | 37(114行)+助太刀7(各4行)。見返せるのは27 | 6 |
| 登場人物の図鑑 | 10枠・12版(王様の枠が出るまでは9) | 7 |
| ぶんぽうの ずかん | 8ページ・52項目 | 7 |
| 言の葉の森の問題 | 80(ことわざ50・故事成語30)。1ラウンド10問 | 8 |
| 画面(`Screen`)の種類 | 19(+最初の画面) | 2 |
| 保存キー | 13 | 10 |
| BGM / 効果音 | 場面9(ファイル11)/ 種類11(ファイル10) | 12 |
| 画像(作業用のフォルダ) | 61ファイル | 13 |
| 素材管理表の表示行 | 54 | 14 |
| テスト | 単体117ファイル・1176テスト、E2E 13ファイル・84テスト | 15 |

### 出題・進行の定数

| 定数 | 値 | 章 |
|---|---|---|
| `NORMAL_STAGE_MAX`(通常ステージの上限) | 10 | 3 |
| `SUB_BOSS_PICKS` / `LAST_BOSS_PICKS` | 20 / 24 | 3・4 |
| `RECENT_LIMIT`(直近の除外) | 20 | 4 |
| `MAX_SAME_UNIT_RUN`(同じ単元の連続) | 2 | 4 |
| `REVIEW_RATIO`(復習枠) | 0.2 | 4 |
| `FREE_PRACTICE_SIZE` / `REVIEW_PRACTICE_SIZE` | 10 / 10 | 4 |
| `UNIT_ACCURACY_WINDOW` | 10 | 4 |
| `WEAK_MIN_ATTEMPTS` / `WEAK_RATE` | 3 / 0.6 | 4 |
| `COMBO_EXCITED_THRESHOLD` | 5 | 4 |
| `SLEEPY_STAR_THRESHOLD` / `MANY_STARS` | 5 / 5 | 7 |
| 得点 | 10点 × 正解数 | 3・9 |

### ボス戦の定数

| 定数 | 値 |
|---|---|
| `BOSS_CLEAR_RATIO` | 0.6(HP = `max(1, min(ceil(N×0.6), N−1))`。20問→12、24問→15) |
| `BOSS_LIVES` | 5 |
| `BOSS_LIFE_BONUS_MAX` | 4(最大ライフ 9) |
| `ASSIST_AFTER_LOSSES` | 2(小ボスのみ) |

### ランキング・通信の定数

| 定数 | 値 |
|---|---|
| クラスコード | 2〜20文字 |
| ニックネーム | 1〜12文字 |
| 順位表 | 上位30人 |
| `JOIN_MAX_SCORE` / `BURST_SCORE` / `SLACK_SCORE` / `RATE_SCORE_PER_SEC` / `MAX_DELTA_SCORE` / `MAX_SCORE` | 5000 / 500 / 10 / 8 / 20000 / 200000 |
| `MIN_SEND_STEP` | 50 |
| `NETWORK_TIMEOUT_MS` | 10000 |
| 累計正解数の上限(ルール) | 2000 |

### 音の定数

| 定数 | 値 |
|---|---|
| 既定の音量 | BGM 0.7、効果音 0.8 |
| `BGM_BASE_GAIN` | 0.4 |
| `DUCK_FACTOR` / `DUCK_DOWN_SEC` / `DUCK_UP_SEC` | 0.08 / 0.05 / 0.4 |
| `RESUME_SETTLE_MS` / `RESUME_FADE_SEC` | 500 / 3.0 |
| `BUFFER_MAX_BYTES`(AudioBuffer方式の上限) | 36MiB(約107秒) |

### 表示の定数

| 項目 | 値 |
|---|---|
| 画面の幅の上限 | 480px |
| 文字の大きさ | 小87.5% / 標準100% / 大118.75% |
| ふりがなの辞書 / 方針で残す難読語 | 100語 / 56語 |
| `IMAGES_READY_TIMEOUT_MS` | 10000 |

## 17.3 画面ID(`Screen` の `name`)

`title`、`areaSelect`、`stageSelect`、`stage`、`story`、`zukan`、`kotonoha`、`kotonohaPlay`、`freePractice`、`reviewPractice`、`settings`、`transferIssue`、`transferRestore`、`ranking`、`howto`、`endingResult`、`credits`、`sources`、`privacy`(19)。ほかに、起動直後の「タッチして はじめる」(`TapToStart`)。遷移は2章。

## 17.4 エリアID・単元ID

エリア: `prologue`、`kotobaNoIchiba`、`sugatakaeNoKajiba`、`namerakaNoTaki`、`tsunagiNoHashi`、`kizunaNoMa`、`mikakeNoMa`、`ohzaNoMa`。単元IDは4章の表。ステージID: `<エリアid>-stage<番号>`、`<エリアid>-subboss`、`ohzaNoMa-lastboss`。

## 17.5 フォルダ構成

| 場所 | 内容 |
|---|---|
| `src/App.tsx`、`main.tsx` | アプリの入口。画面の切り替え(`navigationStore`)、最初の画面、全体のタップ音、同期 |
| `src/app/screens` | 画面(19+) |
| `src/app/store` | 端末に保存する状態(Zustand。保存キー13個)と画面遷移 |
| `src/features` | `audio`(場面とBGM)、`debug`(隠し機能)、`kotonoha`(言の葉の森)、`mascot`、`mastery`(累計正解数の同期)、`quiz`(出題の進行・ボス)、`ranking`、`selection`(出題の選び方)、`settings`(初期化)、`stageSelect`、`story`、`transfer`(引き継ぎ)、`zukan` |
| `src/data` | 出題・ストーリー・図鑑・称号・ことわざなどのデータ、ふりがなの辞書 |
| `src/engines` | 出題エンジン3つと共通の判定 |
| `src/lib` | 音、Firebase、ランキングAPI、保存、版の確認など |
| `src/components` | 共通の部品 |
| `src/styles` | CSS(`global.css`、`fonts.css`) |
| `src/assets` | 画像・音声(実ファイルは git の管理外)、素材の受け皿(`registry.ts`)、音量の補正(`audioLevels.ts`) |
| `public` | PWAのアイコン、ファビコン |
| `e2e` | Playwright のテストと基準画像 |
| `scripts` | `export-questions.ts`(全問題の書き出し)、`export-sources.py`(出典の一覧)、`generate-icons.py`、`subset-fonts.py` |
| `docs` | 記録(17.7)と、この仕様書(`SPEC_FULL.md`、`spec/`) |
| 直下 | `SPEC.md.md`(元の仕様)、`STORY.md.md`(物語の資料)、`README.md`、`LICENSE`、設定ファイル |

## 17.6 コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run build` | 型の検査+ビルド(`dist/`)。コミットのあとに行う(版の表記にコミットIDが入るため) |
| `npm run preview` | ビルド結果の確認 |
| `npm run test` / `test:watch` | 単体・画面テスト |
| `npm run test:e2e` / `test:e2e:update` | E2E / 基準画像の作り直し |
| `npm run lint` / `typecheck` | 静的解析 / 型の検査 |
| `npx vite-node scripts/export-questions.ts` | `docs/ALL_QUESTIONS.md` の作り直し |
| `python scripts/export-sources.py` | `docs/SOURCES_FOR_REPORT.md` の作り直し |
| `python scripts/subset-fonts.py` | 日本語フォントのサブセットの作り直し(データに新しい漢字を足したとき) |

公開(デプロイ)は Firebase Hosting(1章)。手順と確認は `docs/VERSIONING.md`、`docs/DEMO_RUNBOOK.md`。

## 17.7 記録(`docs/`)の一覧

| ファイル | 内容 | 状態 |
|---|---|---|
| `SPEC_FULL.md`、`spec/` | この仕様書 | コードを一次情報として作成(2026-10-25) |
| `SPEC_STATUS.md` | 実装状況(2026-09-24) | 一部が古い(各章の食い違い) |
| `DEVELOPMENT_HISTORY.md` | 開発の遍歴(git の履歴から) | 2026-10-23まで |
| `VERSIONING.md` | 版の付け方、デプロイでの確認 | 現行 |
| `DEMO_RUNBOOK.md` | 発表前の運用確認 | 15章 |
| `ALL_QUESTIONS.md` | 全問題の書き出し | 自動生成 |
| `QUESTION_TEMPLATE.md`、`追加出題データ_薄い単元の増量分.md` | 問題を追加するときの受け渡しの書式、過去の増量分 | 数字は古い |
| `grammar-factcheck.md`、`kotowaza-factcheck.md`、`typo-review.md` | 事実確認・誤字脱字の確認 | 2026-10-22 |
| `kotowaza-export.md`、`kotowaza-ruby-export.md` | ことわざのデータ・ふりがなの書き出し | チェック用 |
| `2026-10-02_*.md` | 図鑑のキャラ、ユライの一言・場面台詞の実装用データ | 正本はコード |
| `ASSET_CREDITS.md` ほか `ASSET_*.md`、`AUDIO_INVENTORY.md`、`license-snapshots/`、`SOURCES_FOR_REPORT.md` | 素材の出典・ライセンスの台帳と調査 | 14章 |
| `APP_ICON_REPLACEMENT.md` | アプリアイコンの差し替え手順 | 13章 |
| `PRIVACY_POLICY.md` | プライバシーポリシー(アプリ内に表示) | 14章 |
| `PRIVACY_POLICY_DRAFT.md`、`TERMS_OF_SERVICE_DRAFT.md` | たたき台 | 個人のメールアドレスを含む(16章) |

## 17.8 この仕様書の書き方

- コードが一次情報。確かめられないことは「未確認」。数字はコードの値。
- 各章の末尾に、「食い違い」(既存の記録との違いと判断材料)と「根拠にしたファイル」。
- 台詞の全文、個人名・アカウント名・メールアドレス・秘密情報、隠し機能の操作は書かない。
- 数値の「実行して確かめた値」は、`vite-node` でコードのデータを読み込んで数えた(スクリプトは作業用の場所に置き、リポジトリには入れていない)。
- 目次と各章の字数は `SPEC_FULL.md`。
