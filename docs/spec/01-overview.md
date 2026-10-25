# 1. 概要

「パクっと国文法」の目的・対象・動作環境・技術構成・バージョン管理をまとめる。
この仕様書全体は、**コードを一次情報**として書いている。コードで確かめられなかったことは「未確認」と書き、既存の記録(`docs/`、`STORY.md.md`、`SPEC.md.md`)と食い違うところは、各章の末尾の「食い違い」に書いた。

## 1.1 目的と対象

| 項目 | 内容 | 根拠 |
|---|---|---|
| 名称 | パクっと国文法 | `index.html`(`<title>`)、`vite.config.ts`(manifest の `name`) |
| 種類 | 中学生向けの日本語文法学習アプリ(Webアプリ。PWA) | `index.html` の description、manifest の `description` |
| 目的 | 高校入試に出る文法問題に答えられる力をつける。使うだけで自然と定着する設計 | `SPEC.md.md` 1章(コードでは確認できない記述) |
| 主な対象 | 文法が苦手な中学3年生 | `SPEC.md.md` 1章(同上) |
| 文法の範囲 | 文節・単語、品詞、活用、自動詞・他動詞・可能動詞・音便、助詞、文節の関係、助動詞と紛らわしい語の識別、敬語(尊敬語・謙譲語・丁寧語) | `src/data/units.ts`(29単元) |
| 付加機能 | ことわざ・故事成語のミニゲーム「言の葉の森」(80問) | `src/data/kotowaza/` |
| 言語 | 日本語のみ。画面の文字は、ふりがな付き(方針は11章) | `index.html`(`lang="ja"`) |

アプリの規模(コードから数えた値):

| 項目 | 値 |
|---|---|
| エリア | 8(序章+7エリア) |
| 単元 | 29 |
| 出題(画面単位) | 392(選択式247・文中タップ35・穴埋め99・仕分け11) |
| ことわざ・故事成語の問題 | 80 |
| 画面 | `Screen` の種類が19+起動直後の「タッチして はじめる」画面1(2章) |

出題の数え方は「画面」単位で、仕分けは1画面に複数の語を並べるため、1画面を1問と数えている(4章)。

## 1.2 動作環境

| 項目 | 内容 | 根拠 |
|---|---|---|
| 形態 | Webアプリ。PWA(ホーム画面に追加でき、オフラインでも遊べる) | `vite.config.ts`(`VitePWA`) |
| 画面の向き | 縦向き固定(ホーム画面から開いたとき) | manifest の `orientation: "portrait-primary"` |
| 基準の画面サイズ | 幅375×高さ667px(iPhone SEクラス)。幅360px以下・高さ660px以下・700px以下などの小さい画面には、別の調整がある | `playwright.config.ts`(`viewport`)、`src/styles/global.css` の `@media` |
| 対象のスマホ | iPhone(Safari・ホーム画面から開いたとき)、Android(Chrome系) | `index.html` の iOS/Android 用のメタタグ、`src/lib/audio.ts` の iOS 対策 |
| パソコン | 画面の幅は最大480pxで、中央に置く(スマホと同じ縦長のまま)。大きい画面向けの別のレイアウトはない | `src/styles/global.css` の `.screen`(`max-width: 480px`)。詳細は11章 |
| ビルドの目標 | ES2022 | `tsconfig.app.json`(`target`) |
| 通信 | 遊ぶだけなら不要(初回の読み込み後は、オフラインで遊べる)。ランキング・累計正解数の送信・BGMの読み込み・最新の版の確認には通信が要る | `vite.config.ts`(`globIgnores`・`runtimeCaching`)、`src/lib/rankingApi.ts` |
| 音 | 最初のタップで解禁(iOS対策)。BGMはオフラインでは鳴らない | `src/components/TapToStart.tsx`、`vite.config.ts` |

実機の確認の記録(コードでは確認できない): iPhoneでの動作確認が、会話の記録とドキュメントに残っている(`docs/DEMO_RUNBOOK.md` の確認項目)。Androidの実機確認は、リポジトリ内の記録に見つからなかったため、**未確認**。

## 1.3 技術構成

| 区分 | 使っているもの(`package.json` の値) |
|---|---|
| 言語 | TypeScript ^5.6.3(`strict`、`noUnusedLocals`、`noUnusedParameters`) |
| UI | React ^18.3.1、react-dom ^18.3.1 |
| ビルド | Vite ^5.4.11、@vitejs/plugin-react ^4.3.3 |
| PWA | vite-plugin-pwa ^0.21.1(Workbox。`registerType: "autoUpdate"`) |
| 状態管理 | Zustand ^5.0.0(`persist` で、端末の localStorage に保存) |
| アイコン | lucide-react ^1.48.0 |
| ランキング・累計正解数 | Firebase ^11.0.0(匿名認証・Firestore。使うときに初めて読み込む) |
| 引き継ぎ | qrcode-generator ^2.0.4(QRコードの作成)、jsqr ^1.4.0(QRコードの読み取り。読み取るときだけ読み込む) |
| フォント | @fontsource/m-plus-rounded-1c ^5.3.0(日本語は、使う文字だけに絞った自前のサブセット `src/assets/fonts/`。英数字は fontsource) |
| 単体テスト | Vitest ^2.1.5、jsdom ^25.0.1 |
| E2E・見た目のテスト | @playwright/test ^1.63.0 |
| 静的解析 | ESLint ^9.15.0(typescript-eslint ^8.15.0、react-hooks、react-refresh) |
| ホスティング | Firebase Hosting(`firebase.json`) |

**設計の方針**(コードに現れているもの):

- **データ駆動**: 出題・ストーリー・図鑑・ことわざなどの内容は `src/data/` のデータで、画面のコードと分けてある。単元を足すときは、データのファイルと `units.ts` に足す。
- **出題エンジンは3つ**: 選択式(`choice`。文中タップはその表示モード)、穴埋め(`assembly`)、仕分け(`sorting`)。判定は共通(`src/engines/core/judge.ts`)。
- **URLのルーティングは使わない**: 画面遷移は `navigationStore` の `screen` で持つ(`src/app/store/navigationStore.ts`)。ブラウザの戻る操作とは干渉しない。
- **端末に保存するのが基本**: アカウント不要。サーバーに送るのは、ランキング(参加時のみ)と累計正解数だけ(9・10章)。
- **素材は、置くだけで反映**: 画像・音声は `src/assets/` の決まった名前で置くと、ビルド時に見つかる(`src/assets/registry.ts`。13章)。

## 1.4 ビルド・公開・設定

| 項目 | 内容 | 根拠 |
|---|---|---|
| 開発 | `npm run dev`(Vite の開発サーバー) | `package.json` |
| ビルド | `npm run build`(`tsc -b && vite build`)。結果は `dist/` | 同上 |
| テスト | `npm run test`(Vitest)、`npm run test:e2e`(Playwright) | 同上 |
| 静的解析 | `npm run lint`、`npm run typecheck` | 同上 |
| 公開先 | Firebase Hosting(公開フォルダは `dist`。SPA なので、すべてのパスを `/index.html` へ) | `firebase.json` |
| キャッシュ | `/`・`/index.html`・`/sw.js`・`/registerSW.js`・`/manifest.webmanifest`・`/version.json` は `no-cache`。`/assets/**` は `public, max-age=31536000, immutable` | `firebase.json`(`headers`) |
| Firebase の設定値 | 環境変数 `VITE_FIREBASE_*`(6つ)。未設定なら、ランキングは「まだ つかえないよ」になる | `.env.example`、`src/lib/firebase.ts` |
| Firestore | `firestore.rules`、`firestore.indexes.json`(中身は空) | `firebase.json`(`firestore`) |
| テーマ色 | `theme_color: #A8E0C8`、`background_color: #FBF4E4` | `vite.config.ts` |
| PWAの保存 | プリキャッシュ対象は js・css・html・svg・png・jpg・jpeg・webp・gif・json・woff2。1ファイルの上限4MB。Firebase・jsQR・`version.json` はプリキャッシュしない。効果音(`/assets/audio/se/`)だけ、使ったあとに保存(CacheFirst・60件まで) | `vite.config.ts`(`workbox`) |

**プライバシーポリシーの扱い**: `docs/PRIVACY_POLICY.md` は、末尾に「運営者向けメモ」の節を持つ。公開する JS にその節が入らないよう、`?public` を付けて読み込むと、ビルド時に取り除く(`vite.config.ts` の `policyPublicOnly`)。

## 1.5 バージョン管理

バージョン番号は `package.json` の `version` だけが元(いまは **0.9.1**)。設定の表示・最初の画面の表示・`version.json` は、すべてビルド時にそこから作る。

| 項目 | 内容 | 根拠 |
|---|---|---|
| 版の表記 | 「v0.9.1(コミットID・ビルド日時(日本時間))」。開発・テストでは「v0.9.1(dev)」 | `src/lib/versionInfo.ts`、`src/lib/appVersion.ts` |
| 最新の版の確認 | `/version.json`(`{version, commit, buildTime}`)。設定の「最新の版をたしかめる」が、毎回これを取りに行き、いまの版と比べる。違えば「新しい版があります。再読み込みします」 | `src/lib/versionCheck.ts`、`src/components/VersionCheck.tsx` |
| 更新の反映 | 新しい版に入れ替わったら、途中経過のない画面(`title`・`areaSelect`・`stageSelect`)で、1度だけ読み込み直す。アプリに戻るたびの確認は、5分以上あけて行う | `src/lib/appUpdate.ts` |
| 上げ方 | 機能の追加は minor、不具合の修正は patch。デプロイのたびに上げる。提出する版は 1.0.0 の予定 | `docs/VERSIONING.md` |
| お知らせ | ユーザーに見える変更があれば、`src/data/announcements.ts` に足す | `docs/VERSIONING.md` |

**リポジトリ**: GitHub(公開)。ソースコードのライセンスは MIT(`LICENSE`)。画像・音声の素材ファイルは、二次配布が禁止されているものがあるため、リポジトリに入れていない(`.gitignore` の `src/assets/audio/*/*`・`src/assets/images/*/*`。`.gitkeep` だけ残す)。そのため、**リポジトリだけでは、画像・音声のないアプリになる**(仮表示になる)。
`.env.local`(Firebase の設定値)も、`*.local` で除外している。

## 1.6 食い違い

| # | 内容 | 判断材料 |
|---|---|---|
| 1-1 | `README.md` は「Firebase(…現時点では接続用の雛形のみ)」と書く。`src/lib/firebase.ts` の冒頭コメントも「現時点は未接続」 | 実装は、ランキング・累計正解数で接続済み(`rankingApi.ts`、`masteryApi.ts`、`firestore.rules`)。**コードが正しい。** README とコメントが古い |
| 1-2 | `README.md` の「フォルダ構成」は、`features/` を、`mascot`・`selection`・`quiz`・`zukan`・`story`・`audio`・`ranking` の7つだけ挙げる | 実際は、`debug`・`kotonoha`・`mastery`・`settings`・`stageSelect`・`transfer` もある(`src/features/`)。**コードが正しい** |
| 1-3 | `firestore.rules` のコメントは、累計正解数について「全224問のうち…」と書く | 全問題は392画面(1.1)。ルールの上限は `correctCount <= 2000` で、数字としては問題ない。コメントだけが古い |
| 1-4 | `vite.config.ts` のコメントに「配色・アイコンは未決事項(12章)のため仮値」とあるが、配色は確定している(`SPEC.md.md` 10章) | 実際の値は確定した配色(`#A8E0C8`・`#FBF4E4`)になっている。コメントだけが古い |

## 1.7 根拠にしたファイル

`package.json`、`vite.config.ts`、`firebase.json`、`firestore.rules`、`.env.example`、`.gitignore`、`index.html`、`playwright.config.ts`、`tsconfig.app.json`、`LICENSE`、`src/main.tsx`、`src/App.tsx`、`src/app/store/navigationStore.ts`、`src/lib/firebase.ts`、`src/lib/versionInfo.ts`、`src/lib/appVersion.ts`、`src/lib/versionCheck.ts`、`src/lib/appUpdate.ts`、`src/lib/safeStorage.ts`、`src/data/areas.ts`、`src/data/units.ts`、`docs/VERSIONING.md`、`docs/DEMO_RUNBOOK.md`、`docs/SPEC_STATUS.md`、`README.md`、`SPEC.md.md`
