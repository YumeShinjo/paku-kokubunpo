# 15. テストと品質

自動テスト(単体・画面・E2E)、静的解析、データの品質確認の記録、発表前の運用確認を定める。実行の結果は、この作業(2026-10-25)で実際に動かした値。動かしていないものは「未確認」と書く。

## 15.1 実行の結果(この作業で確かめた値)

| 項目 | コマンド | 結果 | 備考 |
|---|---|---|---|
| 単体・画面テスト | `npm run test`(`vitest run`) | **117ファイル・1176テストすべて成功**(約54秒) | 作業用のフォルダで実行(画像・音声の素材が置かれている状態)。別の作業(引き継ぎの修正)がテストを足す前の値 |
| 静的解析 | `npm run lint`(`eslint .`) | エラーなし(出力なし) | — |
| 型の検査 | `npm run typecheck`(`tsc -b --noEmit`) | エラーなし(出力なし) | — |
| E2E | `npm run test:e2e` | **実行していない(未確認)**。`playwright test --list` で、**13ファイル・84テスト**を数えた | ブラウザの起動と時間が必要なため |

- ビルド(`npm run build`)は、この作業では実行していない(未確認)。
- 素材(画像・音声)が置かれていない環境(素材は `.gitignore` で除外。1章)で、全テストが成功するかは**未確認**。素材の有無に左右されるテストは、置かれていないとき何も確かめない作りになっているものがある(音声のサンプルレートのテスト `audioFormat.test.ts` など)。

## 15.2 単体・画面テスト(Vitest)

| 項目 | 内容 | 根拠 |
|---|---|---|
| 構成 | Vitest 2.1 + jsdom。`globals: true`。E2E(`e2e/`)は対象外 | `vite.config.ts` |
| 数 | テストファイル117(`src` の下)。置き場所で多い順: 画面(`src/app/screens`)26、データ(`src/data`)18、`src/lib` 11、部品(`src/components`)11、出題(`src/features/quiz`)8、ストア5、ストーリー4、仕分けエンジン4、ほか | ファイルを数えた |
| 実行 | `npm run test`(1回)、`npm run test:watch` | `package.json` |

### 何を確かめているか(分野)

| 分野 | 例 |
|---|---|
| 出題データの品質 | 全問題の id が一意。選択式の正解が選択肢に実在する。文中タップは基準の文節がちょうど1つ。穴埋めの文に空欄がある。仕分けの正解のカゴが実在する。**すべての問題に解説がある**。解説に内部メモが残っていない。正解の位置が偏らない(選択式・穴埋め)。文法用語にふりがなが付いている。単元ごとの問題数。個別の誤り(音便の濁り、「来る」の表記など)の再発防止(`questionLoader.test.ts`、`questionQuality.test.ts`) |
| ステージ・ボス | ステージの分割(`splitEvenly`、通常は10問以下・5問以上)。エリアごとのステージ数。小ボスの名前が STORY.md と一致。HPとライフ、連敗の救済(`stages.test.ts`、`bosses.test.ts`、`bossRules.test.ts`) |
| 出題の選び方 | 層化抽出、直近の除外、連続の回避、復習枠(`selectQuestions.test.ts`、`buildSession.test.ts`) |
| エンジン | 判定(`judge`)、仕分けの操作・やり直し・順序 |
| ストア | 進捗、統計、復習、累計正解数、チュートリアル、ランキング、ストーリー、設定など |
| ストーリー | 場面の流れ(`storyFlow.test.ts`)、見返し、立ち絵の配置、場面データ(`events.test.ts`) |
| 図鑑・マスコット | なかまの ずかん(`NakamaTab.test.tsx`)、ラベル、単元の正答率、表情、ホームの一言 |
| 言の葉の森 | 問題データの検証(`kotowaza.test.ts`)、ラウンドの選び方、ユライの場面台詞 |
| 引き継ぎ | コードの発行と復元、版1・版2、壊れたコード、画面のフロー(`transferCode.test.ts`、`transferV2.test.ts`、`Transfer.test.tsx`)。**成長段階8の往復は、テストにない**(10章の 10-1) |
| ランキング | 入力の検証、NGワード、得点の上限、同期(`scoreSync`) |
| 音 | 再生の方針、復帰、音量の補正、素材のサンプルレート(`audio*.test.ts`、`bgmPolicy.test.ts`、`audioLevels.test.ts`) |
| 表示・アクセシビリティ | 文字の大きさ、コントラスト(11章)、ボタンの押下の表現、ふりがな、フォントの文字の網羅(`fontCoverage.test.ts`) |
| コードの規約 | 画面の部品のソースに**絵文字を書かない**(アイコンは lucide-react。例外はマスコットの仮表示)(`emojiGuard.test.ts`) |
| 公開・更新 | 版の表記、更新の反映、プライバシーポリシーの読み込み、お知らせ |

## 15.3 E2E・見た目のテスト(Playwright)

| 項目 | 内容 | 根拠 |
|---|---|---|
| 構成 | Playwright 1.63。Chromium(Desktop Chrome の設定)で、幅375×高さ667px(iPhone SEクラス)を基準に確認する。プロジェクトは1つ(`mobile-small`) | `playwright.config.ts` |
| サーバー | テスト専用のポート5183で開発サーバーを起動する。**Firebase の設定値を空にして、本番の Firestore に接続しない** | 同上 |
| スクリーンショット | `*-snapshots` に基準画像を保存し、比較する(許容: ピクセルの差2%まで、アニメーション停止)。**基準画像のファイル名が `-win32.png`**(Windowsで撮ったもの)。他のOSでは、基準画像を作り直す必要がある(未確認) | 同上、`e2e/*-snapshots/` |
| 実行 | `npm run test:e2e`、基準の作り直しは `npm run test:e2e:update` | `package.json` |
| 数 | 13ファイル・84テスト(`playwright test --list`) | 実行して数えた値 |

| ファイル | 確かめていること |
|---|---|
| `main-screens.spec.ts` | ホーム、出題、判定のポップアップ、ボス戦の画面、ランキング(未設定)、設定のレイアウトとスクリーンショット |
| `settings.spec.ts` | 設定の並び・大きさ・余白(複数の画面サイズ×文字サイズ小・標準・大)、全体のスクリーンショット |
| `boss-loss.spec.ts` | 小ボスに負けた画面(1回目、2回目で「先へすすむ」が出る) |
| `drag-sorting.spec.ts` | 仕分けのドラッグを連続しても引っかからない(マウス・タッチ、画面の外で離すなど) |
| `sorting-recovered.spec.ts` | 仕分けで1回外して2回目で合ったときの表示 |
| `sorting-sentences.spec.ts` | 仕分けで、カゴに入れたあとも問題文が①②つきで見える |
| `howto.spec.ts` | あそびかた(カード7枚)、文字サイズ「大」でも横にはみ出さず、押せるものは44px以上 |
| `kotonoha-entry.spec.ts` | 言の葉の森の入口(範囲は選ぶだけ、「すすむ」で始まる) |
| `ruby-spacing.spec.ts` | ふりがなの間隔と行間(Chromium。WebKit が入っていれば同じ寸法) |
| `credits-sources.spec.ts` | 講義の自作証明の表示、くわしい出典 |
| `subboss-purify-se.spec.ts` | 小ボスを浄化したときの効果音(1回鳴る。ゲイン。ミュート時は鳴らない) |
| `version-check.spec.ts` | 設定のバージョン表示と「最新の版をたしかめる」 |
| `debug-unlock.spec.ts` | 隠しデバッグ機能(全解放)の動作(存在のみ) |

## 15.4 静的解析・型

- ESLint 9(`eslint.config.js`): `@eslint/js` と typescript-eslint の推奨、`react-hooks` の推奨、`react-refresh/only-export-components`(警告)。`no-undef` は TypeScript に任せるため無効。`dist` と `dev-dist` は対象外。
- TypeScript 5.6: `strict`、`noUnusedLocals`、`noUnusedParameters`(`tsconfig.app.json`)。
- ビルドは `tsc -b && vite build`(型のエラーがあるとビルドも失敗する)。

## 15.5 CI

- CI の設定(`.github/` など)は**ない**。テストは手元で実行する運用。`playwright.config.ts` は `CI` 環境変数を見て動作を変える(`forbidOnly`、リトライ1回)が、CI 自体はリポジトリにない。

## 15.6 データの品質確認(人手)の記録

| 記録 | 内容 | 結果の要約 |
|---|---|---|
| `docs/grammar-factcheck.md`(2026-10-22) | 文法問題392画面すべての、正解・解説・選択肢の確認(学校文法の標準的な扱いとの照合) | 直した4件、要判断9件(のち処理済み) |
| `docs/kotowaza-factcheck.md`(2026-10-22) | ことわざ・故事成語80件の、読み・意味・由来・選択肢の確認 | 直した件数と要判断の処理は、記録を参照 |
| `docs/typo-review.md`(2026-10-22) | 画面の文言の誤字脱字・表記ゆれ | 直した件と要判断(4件)は、記録を参照 |
| `docs/ALL_QUESTIONS.md` | 全問題の書き出し(確認用。`scripts/export-questions.ts` で自動生成) | 392画面 |
| `docs/kotowaza-export.md`、`docs/kotowaza-ruby-export.md` | ことわざ・故事成語のデータとふりがなの書き出し(チェック用) | — |
| `docs/DEMO_RUNBOOK.md` | 発表前の運用確認(15.7) | — |

- これらは、**文書として残っている記録**であり、今回の作業では、内容を再確認していない(未確認)。

## 15.7 発表前の運用確認(`docs/DEMO_RUNBOOK.md`)

事前チェックリスト(前日まで)の要点: 最新版を公開しておく(前日以降はデプロイしない)。発表に使う端末で一通り遊ぶ(出題→小ボス→ストーリー→エンディング→ランキング)。PWAとして入れておき、機内モードで起動と1ステージを確認する。会場のWi-Fiでランキングに参加できるか(予備にテザリング)。音の音量とマナーモード。発表用の端末の保存データの状態。当日のクラスコード(共有URLに `?class=合言葉` を付けると、入力欄に最初から入る)。リハーサル用と本番用でクラスコードを分け、リハーサル用のクラスは Firebase CLI で削除できる。

通しプレイの自動確認の記録(同ファイル): 最初の状態から、全8エリアを全問正解で通しプレイ(通常ステージ、小ボス7、ラスボス、エンディング、クレジット)し、詰まりなく最後まで到達した、とある(実機・実行の日時は、記録を参照)。

## 15.8 食い違い

| # | 既存の記録 | コード・実態 | 判断材料 |
|---|---|---|---|
| 15-1 | `docs/SPEC_STATUS.md`・`docs/DEMO_RUNBOOK.md` に、実機(iPhone)での確認項目がある | 実機の確認は、この作業では行えない | **未確認**(記録の内容のみ) |
| 15-2 | `playwright.config.ts` のコメントは「画面のスクリーンショットは…リポジトリに含める」 | 基準画像は `-win32.png`(Windows用)。Mac・Linuxでは名前が違うため、そのままでは比較できない | **要判断**: 他のOSで使う予定があるか |
| 15-3 | テストの一部の説明(「プロローグ-stage1は12問」「通常ステージは10問以下」など) | 現行の値と一致して成功している | 一致 |
| 15-4 | 成長段階8の引き継ぎ(10章の不具合) | テストが、成長段階の上限(7)の側だけを確かめている(`transferV2.test.ts` は growth 7、`transferCode.test.ts` は 7 と 99) | 不具合を見逃した原因。直すときは、8の往復のテストを足す |

## 15.9 根拠にしたファイル

`package.json`、`vite.config.ts`(`test`)、`playwright.config.ts`、`eslint.config.js`、`tsconfig.app.json`、`src/**/*.test.ts(x)`(117ファイル)、`e2e/*.spec.ts`(13ファイル)、`e2e/*-snapshots/`、`src/data/questionLoader.test.ts`、`src/data/questionQuality.test.ts`、`src/data/stages.test.ts`、`src/styles/accessibility.test.ts`、`src/emojiGuard.test.ts`、`src/assets/audioFormat.test.ts`、`docs/grammar-factcheck.md`、`docs/kotowaza-factcheck.md`、`docs/typo-review.md`、`docs/DEMO_RUNBOOK.md`、`docs/SPEC_STATUS.md`、`.github/`(存在しないことの確認)
