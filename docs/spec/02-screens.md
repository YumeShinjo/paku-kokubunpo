# 2. 画面一覧と画面遷移

画面は、`navigationStore` の `screen`(`Screen` 型。19種類)で切り替える。URLは使わない。さらに、起動直後に出す「タッチして はじめる」画面(以下「スプラッシュ」)がある。これは `Screen` ではなく、`audioUnlocked`(音声を解禁したか)と `splashOpen` の状態で決まる(`src/App.tsx`)。

## 2.1 画面一覧

| # | 画面(`screen.name`) | 画面の名前 | 入口 | 出口 | 表示される条件・補足 |
|---|---|---|---|---|---|
| 0 | (スプラッシュ) | タッチして はじめる | アプリの起動直後(音声を解禁していないとき)。ホームの左上「タイトルへもどる」 | 画面のどこかをタップ → ホーム(音声を解禁する)。下の「クレジット」「プライバシーポリシー」→ それぞれの画面(`next` はホーム)。右上の「お知らせ」→ お知らせの窓 | `audioUnlocked` は端末に保存しないので、起動のたびに出る。このあいだ、ミュートボタン・通知・保存失敗の案内は出ない |
| 1 | `title` | ホーム | スプラッシュのタップ。ほとんどの画面の「もどる」 | はじめる → `areaSelect`。ことだまの書 → `zukan`。ランキング → `ranking`。言の葉の森 → `kotonoha`(序章クリア後)。苦手問題の帯 → `reviewPractice`(星があるとき)。せってい → `settings`。あそびかた → `howto`。クレジット → `credits`。プライバシーポリシー → `privacy`。左上 → スプラッシュ | コトをタップすると吹き出しの一言が替わる。全解放が「オン」のときだけ、隅に目印が出る |
| 2 | `areaSelect` | エリアをえらぼう | ホームの「はじめる」 | エリアのカード → `story`(導入が未視聴のとき)または `stageSelect`。ことだまの書 → `zukan`。苦手問題の帯 → `reviewPractice`。もどる → `title` | 1つ前のエリアの関門を越えるまで、カードは押せない(鍵つき)。3章 |
| 3 | `stageSelect` | (エリア名) | エリアのカード、出題・ストーリーの終わり | ステージ → `stage`(小ボス・ラスボスは、未視聴の戦闘前の `story` を挟む)。もどる → `areaSelect` | エリアが未開放のときは「このエリアは、まだ入れないよ」だけを出す。途中のステージには「つづきから あそべるよ」と「はじめから やりなおす」が出る |
| 4 | `stage` | 出題(通常・小ボス・ラスボス) | `stageSelect` のステージ | クリア → 結果画面 →「つぎへ」→ `story`(撃破後)など → `stageSelect`。ボスに負ける → 「もう少し!」/「ライフが なくなっちゃった…」→ もういちど / 先へすすむ(小ボスのみ) / もどる。「やめる」→ `stageSelect` | 解放されていないステージは「このステージはまだ挑戦できません」だけが出る(入口の守り)。途中の解答は保存され、再開できる |
| 5 | `story` | 会話 | エリアの導入、小ボス戦の前、撃破後、真相、エンディングなど。ことだまの書の「おもいで」 | 台詞をタップで進む。最後で `next` へ。スキップ → `next`(選択肢のあるイベントは、選択肢の手前まで) | 画面のどこをタップしても次へ(ボタンは除く)。5・6章 |
| 6 | `zukan` | ことだまの書 | ホーム、エリア選択、言の葉の森の「ことのは」 | もどる → `title`(言の葉の森から来たときは `kotonoha`)。せいとうの行 → `freePractice`。おもいで → `story`(戻り先は同じタブ)、エンディングの見返し → `story` … → `endingResult` | タブ5つ。「ことのは」タブは、言の葉の森が遊べるあいだだけ出る(7・8章) |
| 7 | `kotonoha` | 言の葉の森(入口) | ホームの「言の葉の森」 | 出題を始める → `kotonohaPlay`。ずかん → `zukan`(「ことのは」タブ、戻り先は `kotonoha`)。もどる → `title` | 序章をクリアするまでは入れない(8章) |
| 8 | `kotonohaPlay` | 言の葉の森(出題) | `kotonoha` | もどる → `kotonoha`。結果から → `kotonoha` | 1ラウンド10問。本編の進み具合・ランキングには影響しない(8章) |
| 9 | `freePractice` | じゆうれんしゅう | ことだまの書「せいとう」の行 | 終わり・やめる → `zukan` | 単元の問題だけ。ストーリー・HP・ライフなし(4章) |
| 10 | `reviewPractice` | にがて もんだいの れんしゅう | ホーム・エリア選択の「苦手問題」の帯 | 終わり → `title` | 星(苦手問題)だけを最大10問。星がなければ「にがて もんだいは ないよ!」と出る(4章) |
| 11 | `settings` | せってい | ホームの歯車 | もどる → `title`。あそびかた → `howto`。ひきつぎコード「つくる」→ `transferIssue`、「いれる」→ `transferRestore`。プライバシーポリシー → `privacy`。くわしい出典 → `sources`。クレジット → `credits`(いずれも `next` は `settings`) | 10章。バージョン表記と、デバッグ用の項目(10・12章に存在だけを書く) |
| 12 | `transferIssue` | ひきつぎコードを つくる | `settings`。保存失敗の案内 | もどる → `settings` | 10章 |
| 13 | `transferRestore` | ひきつぎコードを いれる | `settings` | もどる → `settings`。復元が終わったら「ホームへ」→ `title` | 中身の概要を見せ、「復元する」を押したときだけ上書きする(10章) |
| 14 | `ranking` | ランキング | ホームの「ランキング」 | もどる → `title` | 未設定のときは「まだ つかえないよ」。参加前はフォーム、参加後は順位表(9章) |
| 15 | `howto` | あそびかた | ホームの「?」、`settings` | もどる → `title`。最後のカード「くわしい出典」→ `sources`(`next` は `howto`) | カード7枚(`src/data/howTo.ts`) |
| 16 | `endingResult` | エンディング おつかれさま! | ラスボス撃破後の会話の最後。ことだまの書の「エンディングの見返し」 | つぎへ → `next`(初回は `credits`) | 称号の授与(9章)。見終わると視聴済みになる |
| 17 | `credits` | クレジット | ホーム、スプラッシュ、`settings`、エンディング | もどる → `next`。くわしい出典 → `sources`。エンディングのときは「おわる」→ `stageSelect` | エンディング後(`ending`)は「もどる」を出さない。14章 |
| 18 | `sources` | くわしい出典 | `credits`、`howto`、`settings` | もどる → `next` | 最初は警告だけで、「ひらく」を押すまで一覧を出さない(ネタバレ防止。14章) |
| 19 | `privacy` | プライバシーポリシー | スプラッシュ、ホーム、`settings` | もどる → `next` | 14章 |

## 2.2 すべての画面に重なる部品

| 部品 | 内容 | 出る画面 |
|---|---|---|
| ミュートボタン | 音のオン・オフ。位置は、基本は右下、ホーム・言の葉の森(入口・出題)は右上、会話は左上 | スプラッシュ以外のすべて(`src/components/MuteButton.tsx`) |
| 通知(トースト) | エリアクリアの「コトが せいちょうしたよ!」。待ち行列に積み、マップ(`areaSelect`・`stageSelect`)にいるあいだに、1つずつ出す(表示2.5秒)。上へスワイプかタップで消す | スプラッシュ以外(`src/components/Toaster.tsx`) |
| 保存失敗の案内 | 端末に保存できないとき、画面の上に出る。「ひきつぎコードを つくる」→ `transferIssue`、「とじる」 | スプラッシュ以外(`src/components/StorageWarning.tsx`) |
| お知らせの窓 | 最新から並べる。見ていないお知らせがあるとき、スプラッシュの「お知らせ」に NEW が出る | スプラッシュ |
| 出題中の窓 | ステージ冒頭の説明、判定のポップアップ、「ぶんぽう」の図鑑、「やめる」の確認 | `stage`・`freePractice`・`reviewPractice`(4・5章) |

画面が変わるたびに、ページの先頭までスクロールする(`src/App.tsx`)。文字の大きさ(3段階)は `<html>` の `data-text-size` に入る。

## 2.3 画面遷移図

```mermaid
flowchart TD
  SPL["スプラッシュ<br/>タッチして はじめる"] -->|タップ(音声を解禁)| T[title ホーム]
  SPL -->|クレジット| CR[credits]
  SPL -->|プライバシー| PV[privacy]
  T -->|左上の家| SPL
  T -->|はじめる| AS[areaSelect]
  T -->|言の葉の森<br/>序章クリア後| K[kotonoha]
  T -->|ことだまの書| Z[zukan]
  T -->|ランキング| RK[ranking]
  T -->|せってい| ST[settings]
  T -->|あそびかた| HW[howto]
  T -->|苦手問題の帯<br/>星があるとき| RP[reviewPractice]
  T --> CR
  T --> PV
  AS -->|未視聴の導入| SY1[story]
  SY1 --> SS[stageSelect]
  AS --> SS
  AS --> Z
  AS --> RP
  SS -->|通常ステージ| SG[stage]
  SS -->|小ボス・ラスボス<br/>未視聴の戦闘前| SY2[story]
  SY2 --> SG
  SG -->|クリア| RES[結果画面]
  RES -->|つぎへ| SY3[story 撃破後など]
  SY3 --> SS
  RES -->|ラスボス撃破| SY4["story 連鎖<br/>(分岐・後日談・締め)"]
  SY4 --> ER[endingResult]
  ER --> CR
  CR -->|おわる(エンディング後)| SS
  SG -->|負け| LOSS["もう少し! / ライフがなくなった"]
  LOSS -->|もういちど| SG
  LOSS -->|先へすすむ 小ボスのみ| SY5[story 助太刀]
  SY5 --> SY3
  SG -->|やめる| SS
  Z -->|せいとうの行| FP[freePractice]
  FP --> Z
  Z -->|おもいで| SY6[story 見返し]
  SY6 --> Z
  Z -->|エンディングを見る| SY4
  ER -->|見返しのとき| Z
  K -->|出題を始める| KP[kotonohaPlay]
  KP --> K
  K -->|ずかん| Z
  ST --> TI[transferIssue]
  ST --> TR[transferRestore]
  ST --> SRC[sources]
  ST --> CR
  ST --> PV
  ST --> HW
  CR --> SRC
  HW --> SRC
  TR -->|復元完了| T
  RP --> T
```

「もどる」ボタンは、画面ごとに戻り先が決まっていて、`T`(ホーム)・`AS`・`SS`・`Z`・`K`・`ST` などへ戻る(2.1の「出口」)。図では、見やすさのため、一部の戻りを省略している。

## 2.4 食い違い

| # | 内容 | 判断材料 |
|---|---|---|
| 2-1 | `src/data/howTo.ts` の説明コメントは「短いカード6枚」と書くが、`HowToScreen.tsx` のコメントも「6枚」とする | カードは `howToCards` に7枚(はじめる・問題をとく・「パクっと」ってなに?・言の葉をあつめる・ぶんぽう図鑑・苦手問題の練習・言の葉の森)。**コードのデータが正しい** |
| 2-2 | `SPEC.md.md` 6章は、図鑑のページを「エリアをクリアすると1ページずつ開く(未クリアはロック表示)」と書く | 実装(`src/features/zukan/ZukanPages.tsx`)は、すべてのページを、クリアしなくてもいつでも読める(出題中の「ぶんぽう」ボタンからも開く)。**コードが現在の動作**。SPEC.md の記述は、以前の実装のまま残っている可能性がある(7章でも触れる) |
| 2-3 | `src/app/store/toastStore.ts` に「ずかんが ふえたよ!」の通知(`pageUnlock`)と、効果音 `pageUnlock` が定義されている | `toastStore.push` に渡されているのは `growth` だけで、`pageUnlock` を積む呼び出しは、`src/` 全体の検索では見つからない(テストを除く)。**いまは使われていない定義**。効果音 `pageUnlock` も、他からは `LONG_SE` と音量の表にしか現れない(12章) |

## 2.5 根拠にしたファイル

`src/App.tsx`、`src/main.tsx`、`src/app/store/navigationStore.ts`、`src/components/TapToStart.tsx`、`src/components/MuteButton.tsx`、`src/components/Toaster.tsx`、`src/components/StorageWarning.tsx`、`src/app/store/toastStore.ts`、`src/app/screens/*.tsx`(TitleScreen・AreaSelectScreen・StageSelectScreen・StageScreen・StoryScreen・ZukanScreen・KotonohaScreen・KotonohaPlayScreen・FreePracticeScreen・ReviewPracticeScreen・SettingsScreen・TransferIssueScreen・TransferRestoreScreen・RankingScreen・HowToScreen・EndingResultScreen・CreditsScreen・SourcesScreen・PrivacyPolicyScreen)、`src/components/HungryBadge.tsx`、`src/features/kotonoha/ForestEntry.tsx`、`src/features/kotonoha/unlock.ts`、`src/features/zukan/zukanTabs.ts`、`src/features/story/storyFlow.ts`、`src/data/howTo.ts`
