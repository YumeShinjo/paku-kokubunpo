# パクっと国文法

中学生向け日本語文法学習PWA。仕様の詳細は [SPEC.md.md](SPEC.md.md) を参照。
全8エリア(序章〜王座の間)の出題データを組み込み済み。11章のMVP範囲(序章・ことばの市場・姿変えの鍛冶場)から
段階的に拡張してきた。9章の技術要件(PWA化・データ駆動設計など)を反映した構成。

## 技術スタック

- React + TypeScript + Vite
- vite-plugin-pwa(Service Workerによるオフラインキャッシュ)
- Zustand(画面遷移・進捗・復習・マスコット成長・設定の状態管理、localStorageへ永続化)
- Firebase(Firestore/匿名認証, 8章のランキング機能用。現時点では接続用の雛形のみ)
- Vitest(正誤判定ロジックなどのユニットテスト)

## セットアップ

```bash
npm install
npm run dev
```

Firebase関連の環境変数は `.env.example` を `.env` にコピーして設定する(ランキング機能着手時)。

## フォルダ構成

```
src/
  data/            出題データとスキーマ定義。単元追加はここにファイルを足すだけでよい
    schema.ts       Question/Stage/AreaMeta等の型定義
    areas.ts        全8エリアのメタ情報(すべて implemented: true。王座の間のみラスボス finalBoss を持つ)
    ruby.ts          "漢字[ふりがな]" 記法をRubyTextに変換するヘルパー(空欄___の分割も担う)
    furigana.ts      文法用語の辞書でふりがな記法を自動付与(builderの autoRuby: true で使う。促音便のように別の漢字が続く語は付けない)
    questionBuilders.ts choiceQ/tapQ/fillBlankQ/sortingQ など問題オブジェクトの組み立てヘルパー(tapQは選択式の文中タップ表示)
    questions/<area>/<stage>.ts  エリア・ステージごとの出題データ本体
    questionLoader.ts エリアid/ステージid/単元idから出題データを取得する
    stages.ts        エリアの問題群を「1ステージ8〜10問+小ボス」に分割する(3章)
    units.ts         単元idの表示名とエリアの対応(図鑑の正答率グラフ・自由練習用。新単元を足したらここにも足す)
    engineFlavor.ts  エンジン×エリアの呼び名・演出テキスト(5章。表示テキストだけを差し替える)
    feedbackMessages.ts 正誤フィードバックの文言バリエーション(3章)
    story/schema.ts   StoryLine/StoryEvent の型定義
    story/events.ts   ストーリー演出データ(STORY.md の台詞を反映。全8エリア+王座の間の複数フェーズ)
    engineGuide.ts    初回プレイの操作ガイドの文面(出題形式ごと)
    titles.ts         称号(二つ名)。エンディング分岐の選択から導く
    credits.ts        ゲーム内クレジット(素材管理表 docs/ASSET_CREDITS.md をビルド時に読み込む)
  engines/         出題エンジン(仕分け/組み立て/選択式)と共通正誤判定ロジック
    core/judge.ts    エンジン共通の正誤判定(ユニットテスト付き)
    sorting/         仕分けゲーム(項目ごとの正誤・解説を解答後に表示)
    assembly/        組み立てパズル
    choice/          選択式(通常・場面説明付き)
    EngineRouter.tsx 問題データのengine指定に応じてコンポーネントを切り替える
  features/        単元横断の機能
    mascot/          マスコット成長表示(現状は仮表示、実素材待ち)
    selection/       出題選定ロジック(層化抽出・直近除外・同一単元の連続回避・復習枠。純粋関数、テスト付き)
    quiz/            出題の進行(QuizPlayer)、ボスのHP規則、正誤フィードバックの選択、出題セッションの組み立て
    zukan/           ことだまの書の単元別正答率の集計
    story/           ストーリー演出の発火ロジック(storyIds.ts/storyFlow.ts、テスト付き)。エンディング後の称号授与・クレジットの挟み込みも担う
    audio/           画面→BGM場面の対応(bgmScene.ts)と、場面が変わったときのBGM切り替え(useBgm.ts)
    ranking/         ランキング(8章)。NGワード判定・入力検証・得点の同期(scoreSync.ts)。テスト付き
  app/
    store/           Zustandストア(navigation/progress/review/mascot/settings/story/stats/tutorial)
    screens/         画面コンポーネント(Title/AreaSelect/StageSelect/Stage/Story/Zukan/FreePractice/Settings/EndingResult/Credits)
  components/        Rubyなど共通UIコンポーネント
  lib/
    firebase.ts      Firebase設定の読み込み(VITE_FIREBASE_*。SDKは使うときに動的import)
    rankingApi.ts    ランキングのFirestoreアクセス(匿名認証・参加・得点送信・順位取得・退出)
    audio.ts         BGM/SE再生とモバイル音声解禁(9章)。unlockPlayback/playSe/playBgm
  assets/          素材(画像・BGM・SE)の置き場所と受け皿(10章)。置き方は assets/README.md、探す仕組みは registry.ts
    images/{mascot,boss,bg,ui}  画像素材(置くだけで反映)
    audio/{bgm,se}              音源(置くだけで反映)
public/
  icons/            PWAアイコン(仮。同名で上書きして差し替える)
docs/
  ASSET_CREDITS.md    素材管理表(10章、出典を一元管理。ゲーム内クレジットに自動で反映される)
```

## 出題データ・ステージ構成の状態(2026-09-20時点)

全8エリアの出題データを組み込み済み。画面遷移は エリア選択 → ステージ選択 → ステージ(1画面8〜10問+ボス) の3段階。

| エリア | 画面数 | 通常ステージ | ボス | 備考 |
| --- | --- | --- | --- | --- |
| 序章(ことばの分かれ道) | 16 | 2(各8問) | なし(3章の設計通り) | 文節の区切り/単語の区切り |
| ことばの市場 | 33 | 5(7,7,7,7,5問) | 小ボス 侍女見習い(10問) | 品詞分類15問は仕分けゲーム3バッチに再構成(下記参照) |
| 姿変えの鍛冶場 | 60 | 6(各10問) | 小ボス 従者(12問) | |
| なめらかの滝 | 11 | 2(6,5問) | 小ボス 文官(8問) | 自動詞・他動詞=仕分け(3語×2画面)、可能動詞・音便=組み立て |
| つなぎの橋 | 18 | 2(9,9問) | 小ボス メイド長(8問) | 格助詞=組み立て、接続/副/終助詞・がの識別=選択式 |
| 絆の間 | 23 | 3(8,8,7問) | 小ボス 騎士団長(8問) | 文中タップ10問+選択式13問 |
| 見分けの間 | 22 | 3(8,7,7問) | 小ボス 大臣(8問) | すべて選択式 |
| 王座の間 | 12 | 2(6,6問) | 小ボス 宰相(8問)+ラスボス 王様(16問) | 敬語(場面説明付き選択式) |

- 通常ステージは、8〜10問に収まる最小のステージ数へ均等に分割する(`splitEvenly` in [stages.ts](src/data/stages.ts))。問題数の少ない滝・橋・王座の間は5〜6問のステージになる。
  ことばの市場(7問区切り)・鍛冶場(10問区切り)は従来の分割のまま。
- 小ボスのプールは、対応エリアの全通常ステージの問題(`buildSubBossStage`)。実際の出題は挑戦のたびにこのプールから層化抽出するため、再挑戦すると別の問題の組み合わせになる。
  出題数は「通常ステージ数×2」を基本に、少ないエリアでも最低8問(プールが上限)。
- ラスボス(王座の間)のプールは全エリアの全問題(`buildLastBossStage`)。単元ごとに均等に16問を抽出するので、全エリアの内容が複合出題される。
- マスコット成長(6章)は「そのエリアの全ステージ(ボス含む)をクリア」した時点でトリガーする(`isAreaCleared` in [progressStore.ts](src/app/store/progressStore.ts))。
- 復習システムの弱点混入(6章)は通常ステージのみに適用し、ボスステージには追加混入しない(ボス自体が既に横断復習のため)。
- 文中タップは独立したエンジンではなく、**選択式(ChoiceEngine)の表示モード**(`ChoiceQuestion.display: "tapInSentence"`)。
  choices を文の語順どおりの文節として並べ、`given: true` の文節は問いの基準(強調・タップ不可)、他をタップして選ぶ。判定・解答の形は通常の選択式と同じ。エンジンは3つのまま。
- 元データからの調整: 単元が小さすぎて正答率を出せない見分けの間の「紛らわしい語」(4語×2〜3問)と、王座の間の識別系3単元は、それぞれ1単元にまとめた。
  元データに解説がなかった可能動詞・音便には、語尾の変化を説明する定型の解説を補っている。

**品詞分類は仕分けゲーム(SortingEngine)で実装**: 当初は選択式(choiceQ)で仮組み込みしていたが、
5章の設計方針(品詞分類・自立語/付属語は仕分けゲーム)に合わせて、15問を5項目×3バッチの
SortingQuestionに再構成した。1バッチ=1画面として複数語を同時に品詞10種のカゴへ分類し、
解答後は項目ごとに正誤(◎/×)と解説を表示する。この再構成により「ことばの市場」の画面数は
45→33になった(自立語/付属語・活用の有無の30問は引き続きchoiceQで、学習内容自体は変わらない)。

## 仕様更新(2026-09-20版SPEC)の反映状況

- **勝敗の扱い(3章)**: 「負け」状態はない。通常ステージは間違えても次へ進むだけ。小ボス/ラスボス([QuizPlayer](src/features/quiz/QuizPlayer.tsx)のboss指定)はHPゲージが演出のみで、
  正解でボスのHPが1減り、不正解は「攻撃が外れる」演出だけ(プレイヤー側にHPやダメージはない)。HPは出題数の約6割([bossRules.ts](src/features/quiz/bossRules.ts))で、
  出題を解ききってもHPが残れば「もう少し!」を出し、[StageScreen](src/app/screens/StageScreen.tsx)からペナルティなしで即再挑戦できる。ゲームオーバー・コンティニューはなし
- **単調さを減らす工夫(3章)**: 連続正解のコンボ表示、正解演出3パターン(pop/sparkle/shine)のランダム化(直前と同じ演出・文言は連続させない)、
  正誤フィードバック文言のバリエーション([feedbackMessages.ts](src/data/feedbackMessages.ts))。`prefers-reduced-motion`ではアニメーションを止める
- **エンジン×エリアの世界観演出(5章)**: [engineFlavor.ts](src/data/engineFlavor.ts) に5章の表どおりの呼び名・一言説明を持たせ、出題画面の上部に表示(コード構造は変更なし)
- **出題選定ロジック(5章)**: [selectQuestions.ts](src/features/selection/selectQuestions.ts) に層化抽出・直近20問の除外・同一単元の3連続回避・復習(星)の別枠混入(約20%)を実装。
  通常ステージ・小ボス・自由練習で共通に使う
- **苦手単元の可視化・自由練習(6章)**: タイトル/エリア選択の「ことだまの書」([ZukanScreen](src/app/screens/ZukanScreen.tsx))に単元別正答率の横棒グラフを表示し、
  行をタップするとその単元の自由練習([FreePracticeScreen](src/app/screens/FreePracticeScreen.tsx)、ストーリー・HPゲージなし)に入る。
  正答率は**単元ごとの直近10問**ベース([statsStore.ts](src/app/store/statsStore.ts) の `unitRecent`。全単元まとめの直近出題履歴 `recentQuestionIds` と同じ `recordAnswer` で更新)。
  3問以上解いて6割未満の単元には「にがて」の目印が付く

## ストーリー演出の状態(2026-09-20時点)

3章の「ステージ間のストーリーテキストは短く、必ずスキップ可能にする」を満たす仕組みで、STORY.md の台詞を全エリア分反映済み。

- **台詞データ**: [events.ts](src/data/story/events.ts)。発話者名は STORY.md のキャラクター名(コト・メイ・レル・オンヴィン・ジョゼット・ネジラルド・サイラス・ニジュヴェール・ヴェルバルト)に統一。
  差し替えは `lines` を書き換えるだけでよい。読みが難しい漢字にはふりがなを付けている。
  **序章のエリアクリア台詞だけは STORY.md に無い**ため、仮の2行のまま(台詞が用意できたら差し替える)
- **発火ポイントとイベントid**([storyIds.ts](src/features/story/storyIds.ts))
  - 全エリア共通: `{areaId}-intro`(エリア初回訪問)/ `-subboss-clear`(小ボス撃破直後)/ `-area-clear`(エリアクリア直後)
  - 王座の間だけ複数フェーズ: 宰相撃破 `subboss-clear` → `truth`(真相究明)→ ラスボス挑戦時 `lastboss-intro`(ラスボス前)
    → ラスボス撃破 `lastboss-clear` → `ending-choice`(エンディング分岐)→ `ending-castle` / `ending-journey`(選択肢A/B)→ `epilogue`(宰相の追加台詞)→ `area-clear`(共通の締め)
  - STORY.md の「真相究明〜ラスボス前」は1ブロックなので、最後の「最後の戦いが始まる。」の1行を `lastboss-intro` として分けている(ラスボスに挑む直前に流すため)
- **遷移チェーン**: [storyFlow.ts](src/features/story/storyFlow.ts)(Reactに依存しない純粋関数、テスト付き)。視聴済みのイベントは飛ばす。
  ラスボス撃破の連鎖には、エリアクリア(全ステージ完了)かどうかに関わらず共通の締め(`area-clear`)を必ず含める(エンディングの最後を通常ステージの消化状況に左右させないため)
- **選択肢つきイベント**: `StoryEvent.choice`。最後の行のあとに選択肢を出し、選択は `storyStore.choices` に保存(将来の称号・二つ名用)。
  選択肢の画面ではスキップ/つぎへは出ず、選択を飛ばせない(複数行のイベントではスキップは選択肢の手前まで進む)
- **マスコットの変身演出(2章)**: 宰相撃破で淡く光る(`mascotForm: "glow"`)、ラスボス撃破後に本来の姿(`"true"`、王女コレット)。素材が揃うまでは絵文字+発光エフェクトの仮表示
- 表示は [StoryScreen.tsx](src/app/screens/StoryScreen.tsx)。背景は単色グラデーション、キャラクターはマスコットの仮絵

## ステージの解放順(2026-09-20時点)

`Stage.requires`(先にクリアすべきステージid)で表現する。現状、条件を持つのはラスボス(王様)だけで、**宰相(小ボス)をクリアするまで挑戦できない**
(ステージ選択でロック表示・押せない。`progressStore.isStageUnlocked`。ステージ画面にも入口のガードあり)。
それ以外のステージは最初から自由に選べる。

## 音声(BGM/SE)の状態(2026-09-18時点)

9章の「iOS Safari等はユーザーが一度画面をタップするまで音声を自動再生できない」への対応を実装済み。

- [lib/audio.ts](src/lib/audio.ts) の `unlockPlayback()` が実際の解禁処理を担う:
  1. `settingsStore.audioUnlocked` を true にする(アプリ側のゲート。セッションごとに再解禁が必要なため永続化しない)
  2. Web Audio APIの `AudioContext` を resume する(ブラウザ側の自動再生制限の解除。これが実質的な本体)
- 解禁は、起動直後に挟む「タップしてはじめる」の1枚の導入画面([TapToStart](src/components/TapToStart.tsx))で行う。
  そのタップ(click。iOSは pointerdown を有効な操作と認めない)の中で `unlockPlayback()` を呼び、**BGMの開始まで済ませてから**タイトル画面を出す
  ([App.tsx](src/App.tsx) は `audioUnlocked` が false のあいだ、この画面だけを出す)。これで、タイトル画面のどのボタンを最初に押しても解禁済みになる。
  `audioUnlocked` は端末には保存しないので、アプリを起動するたびにこの画面が出る。タイトル・設定のボタンからの `unlockPlayback()` は念のための残し
- 未解禁の状態で `playSe`/`playBgm` を呼んでも何も鳴らさず安全に無視する(エラーにならない)
- 7章の音量スライダー・ミュートと整合: `playSe` は毎回 `seVolume`/`muted` を読んで音量を決め、
  再生中のBGMは音量変更時に `useSettingsStore.subscribe` で即座に追従する
- 効果音は、素材が置かれていない種類はWeb Audio APIで生成した短いビープ音(正解/不正解/ステージクリア/小ボス撃破/ボタンタップ)で代用中
- **ボタンタップ音**: [App.tsx](src/App.tsx) にクリックの委譲リスナーを1つだけ置き、`<button>` 要素へのクリックであれば
  画面を問わず `playSe("tap")` を鳴らす方式にした(disabledなボタンはブラウザがclickを発火しないので除外判定は不要)。
  押した直後に正誤結果音(correct/incorrect)が鳴るボタン([ChoiceEngine](src/engines/choice/ChoiceEngine.tsx)の選択肢、
  [SortingEngine](src/engines/sorting/SortingEngine.tsx)/[AssemblyEngine](src/engines/assembly/AssemblyEngine.tsx)の「こたえる」)
  には `data-no-tap` 属性を付け、タップ音と結果音が二重に鳴らないようにしている
- BGMは画面(場面)ごとに自動で切り替わる([useBgm.ts](src/features/audio/useBgm.ts) / [bgmScene.ts](src/features/audio/bgmScene.ts))。素材が置かれていなければ無音。素材の置き方は下の「素材の差し替え」を参照
- 効果音は `src/assets/audio/se/<種類>` に置いたものは本物の音、置いていない種類は合成ビープ音で鳴る
- 設定画面に「こうかおんをためす」ボタンを追加し、音量調整の効果をその場で確認できるようにした

## 実装済み/未実装の目安

- エリア選択→(導入ストーリー)→ステージ選択→出題→正誤判定(解説表示つき)→進捗保存→小ボス→(撃破/クリア演出)→エリアクリア→マスコット成長、までの一連の流れを実データで動作確認済み
- ランキング(8章)は実装済み。実際に使うには、Firestoreのセキュリティルールのデプロイが必要(下の「ランキング」参照)
- Service Worker経由の本番オフライン動作、PWAインストール導線の実機確認は未実施
- マスコット・小ボス・背景等の実素材(10章)は未搭載のため仮表示(置き方は「素材の差し替え」を参照)
- 仕分けゲームは、ドラッグ&ドロップとタップ選択の両方に対応(下の「仕分けゲームの操作」)
- エンディング後は、共通の締め → 称号の授与 → クレジット → ステージ選択の順(一度見たら、ラスボスに再挑戦しても繰り返さない)。ことだまの書の「エンディングを もういちど 見る」から見返せる(分岐で選びなおすと称号も変わる。クレジットは挟まない)
- BGMはiPhone実機での再生を未確認(素材が届いてから確認する。オフラインでは鳴らない)
- 効果音(正解/不正解/クリア/小ボス撃破/ボタンタップ)は、素材が置かれるまで生成ビープ音のプレースホルダー

## PWAアイコン(仮)
`public/icons/` のPNGは `python scripts/generate-icons.py` で生成した仮アイコン(依存ライブラリなし)。
本番デザインが決まったら同名のPNGで差し替える(192 / 512 / 512-maskable / apple-touch-icon 180)。

## デプロイ(Firebase Hosting)
`firebase.json` を用意済み(公開フォルダは `dist`。sw.js / index.html / manifest はキャッシュさせず、`assets/` は長期キャッシュ)。
手順: `npm run build` → 初回のみ `npx firebase-tools login` と `npx firebase-tools use --add`(プロジェクト選択)→ `npx firebase-tools deploy --only hosting`。

## 初回プレイの操作ガイド
出題画面([QuizPlayer](src/features/quiz/QuizPlayer.tsx))で、出題形式ごとに**初めて遊ぶときだけ**、問題の上に操作の説明カードを出す。
形式は4つ(仕分け / 穴埋め / 選択式 / 文中タップ)。エンジン数は3つのままで、文中タップは選択式の表示モード。
「わかった!」で閉じると既読になり(端末に保存)、以後は出ない。設定画面の「そうさの せつめいを もういちど 見る」で、もう一度出せる。
文面は [engineGuide.ts](src/data/engineGuide.ts) を書き換えるだけで変えられる。

## 称号(二つ名)・エンディング後・クレジット
- 称号は、王座の間のエンディング分岐の選択から導く([titles.ts](src/data/titles.ts))。選択A(城に戻る)=「言葉を結びし者」、選択B(旅を続ける)=「風のことだま使い」。
  称号そのものは保存せず、保存済みの選択(`storyStore.choices`)から表示のたびに導く。
- 表示場所: エンディング後の結果画面([EndingResultScreen](src/app/screens/EndingResultScreen.tsx))、ことだまの書、タイトル画面。
- エンディング後の順序: 共通の締め(`ohzaNoMa-area-clear`)→ 称号の授与(`ohzaNoMa-ending-result`)→ クレジット(`ohzaNoMa-credits`)→ ステージ選択。
  後ろ2つは専用画面で、視聴済みの記録に `seenStoryIds` を流用している(中断しても続きから再開でき、再挑戦では繰り返さない)。
- クレジット画面([CreditsScreen](src/app/screens/CreditsScreen.tsx))は、タイトル・設定・エンディング後から開ける。
  **使用素材の欄は [docs/ASSET_CREDITS.md](docs/ASSET_CREDITS.md)(素材管理表)をビルド時に読み込んで表示する**ため、表に1行足せばゲーム内にも出る。表が空のときは「準備中」の枠が出る。

## 素材の差し替え(10章)
画像・BGM・効果音は、`src/assets/` の決まった場所に決まった名前で置くだけで、コードを変えずに反映される
(置かれていない素材は仮表示のまま)。**置き場所とファイル名の一覧は [src/assets/README.md](src/assets/README.md)**。
仕組みは [registry.ts](src/assets/registry.ts)(ビルド時にフォルダを走査して素材を見つける)。

### いまの仮素材(プレースホルダー)の所在
| 種類 | いまの仮表示 | 場所 | 本番素材の置き場所 |
| --- | --- | --- | --- |
| マスコット | 絵文字(🥚→…→👑、本来の姿は👸) | [Mascot.tsx](src/features/mascot/Mascot.tsx) の `growthEmoji` / `TRUE_FORM_EMOJI` | `src/assets/images/mascot/` |
| 小ボス・ラスボス | 立ち絵なし(文字とHPゲージのみ) | [QuizPlayer.tsx](src/features/quiz/QuizPlayer.tsx) のボスパネル | `src/assets/images/boss/` |
| 背景 | 単色・グラデーション | [global.css](src/styles/global.css) の `--color-bg` と `.story-stage` | `src/assets/images/bg/` |
| タイトルロゴ・称号バッジ | 文字の見出し・🏅 | [TitleScreen.tsx](src/app/screens/TitleScreen.tsx) / [TitleBadge.tsx](src/components/TitleBadge.tsx) | `src/assets/images/ui/` |
| BGM | なし(無音) | (素材が置かれるまで鳴らさない) | `src/assets/audio/bgm/` |
| 効果音 | Web Audio APIの合成ビープ音 | [audio.ts](src/lib/audio.ts) の `TONE_PARAMS` | `src/assets/audio/se/` |
| アプリアイコン | 生成した仮アイコン(口を開けたキャラ) | `public/icons/` と `public/favicon.svg`(`python scripts/generate-icons.py` で生成) | 同じ場所に同名で上書き |

- PWAアイコンだけは、ホーム画面やブラウザが決まったURLで読むため `public/` に置く(`src/assets` ではない)。
- 素材を置いたら `docs/ASSET_CREDITS.md` に1行足す(ゲーム内クレジットに自動反映)。
- 音声ファイルは、オフラインでは読み込まれない(通信できるときだけBGMが鳴る)。効果音は一度読み込めばオフラインでも使える。

## ランキング(8章)
- **仕様**: 匿名認証+ニックネーム。クラスコード(先生が自由に決める合言葉。2〜20文字の文字・数字・`-`・`_`)を入れて参加し、
  **同じクラスコードのグループ内だけ**の累計得点の順位を見る。累計のみ(週間などはなし)。
  得点は累計得点(ステージクリアごとに 10点×正解数。`progressStore.totalScore`)。
- **画面**: タイトルの「ランキング」→ [RankingScreen](src/app/screens/RankingScreen.tsx)(参加フォーム / 順位一覧・こうしん・クラスを ぬける)。
  順位は上位30人まで。自分が圏外でも、自分の順位は表示される。同点は同順位。
- **データ**: `classes/{クラスコード}/members/{匿名認証のuid}` = `{ nickname, score, updatedAt }`。
  クラスコードをパスにしているため、クラスの一覧は取れない(合言葉を知っている人だけがそのクラスを読める)。
- **セキュリティルール**([firestore.rules](firestore.rules)): 読み取りは匿名認証済みのみ / 書き込み・削除は自分のドキュメントだけ /
  得点は減らせない・1回の更新で増やせるのは20000まで・上限200000 / 項目の形式を固定。
  得点はアプリが計算して送るので、悪意のある端末が自分の得点を盛ることまでは防げない(他人のデータの改ざん・削除と、桁外れの値は防ぐ)。
- **NGワード**([ngWords.ts](src/features/ranking/ngWords.ts)): 表記をそろえたうえで、含んでいたらNGの語と、全体が一致したらNGの短い語(「かすみ」を弾かないため)の2種類。簡易チェックで、
  すり抜けはありうる(クラスコードの同じ人にしか見えない設計で補う)。語は配列に足すだけで増やせる。
- **オフライン**([scoreSync.ts](src/features/ranking/scoreSync.ts)): 得点は端末に貯まり、参加中なら、ステージクリア時・起動時・通信が戻ったときに自動で送る。
  送れなかった得点は消えず、次の機会に送られる(送信済みの得点との差分で管理)。
- **読み取りの節約**: リアルタイム購読はせず、画面を開いたときと「こうしん」でだけ取得する(無料枠の読み取り上限を守るため)。
  Firebase SDKはランキングを使うときに初めて読み込む(出題だけ遊ぶ分には増えない)。
- **設定**: `.env.local` の `VITE_FIREBASE_*`(`.env.example` 参照)。**ビルドはこのファイルがある環境で行う**こと(値はビルド時にアプリへ埋め込まれる)。未設定のときは「ランキングは まだ つかえないよ」と出る。
- **デプロイ**: ルールは `npx firebase-tools deploy --only firestore:rules`、アプリは `npm run build` のあと `npx firebase-tools deploy --only hosting`。
- **端末の制約**: 匿名認証のIDはブラウザに保存される。サイトデータを消すと別人扱いになり、以前のデータは残る(退出してから消すときれい)。
  クラスに参加中に得点を送れるのは、その端末のIDだけ。

## 発表会(デモ)の運用
事前チェックリスト・当日の流れ・クラスコードの決め方(共有URL `?class=合言葉`)・順位表の片付け方・負荷の見積もりは [docs/DEMO_RUNBOOK.md](docs/DEMO_RUNBOOK.md) にまとめた。
通信が返ってこないときは10秒で打ち切る(`withTimeout`)。Firestoreは、会場のネットワークによっては通らない接続方式を、自動でロングポーリングへ切り替える。

## 復習(星)・克服ボーナス・ミュートアイコン(6・7章)
- **星**: 間違えた問題には自動で星がつく。出題中の「☆ ふくしゅうに いれる / ⭐ ふくしゅうちゅう」ボタンで、自分で星をつけたり外したりできる(お気に入り登録は、この「自分でつける星」に一本化)。
  星のついた問題は、通常ステージへ別枠(約20%)で混ざる。図鑑には、星の合計と、単元ごとの星の数が出る。
- **克服ボーナス**([review.ts](src/features/quiz/review.ts)): 星のついた問題を正解し直すと星が外れ、コトのアクセサリーがボーナスで1つ増える(解答の直後に「にがてを こくふくした!」と表示)。
  ボーナスは問題ごとに1つまで(同じ問題を何度間違えて克服しても稼げない)。ボーナスの数はマスコットの横(✨N)と図鑑に出る。
- **ミュートの固定アイコン**([MuteButton](src/components/MuteButton.tsx)): 全画面の右下に常に表示。設定画面のミュートと同じ設定。

## 図鑑のページ・品詞の色分け・ホーム画面のバッジ(6・5・7章)
- **図鑑のページ**([zukanPages.ts](src/data/zukanPages.ts) / [ZukanPages.tsx](src/features/zukan/ZukanPages.tsx)): エリアをクリアすると、そのエリアの用語まとめのページが、ことだまの書で開く(未クリアは 🔒)。
  クリア画面に「あたらしい ページが ふえたよ」と出て、効果音 `pageUnlock` が鳴る。文面・例文はデータなので書き換えやすい。
- **品詞の色分け**([partOfSpeech.ts](src/data/partOfSpeech.ts) / [PosChip](src/components/PosChip.tsx)): 品詞10種の色。**問題の中では出さない**(答えを教えてしまうため)。
  使うのは、(1) 品詞分類の仕分けゲームの**解答後の結果**、(2) ことだまの書のページの例文と品詞の凡例、だけ。色だけに頼らず、必ず品詞名の文字をそえる。
- **ホーム画面のバッジ**([HungryBadge](src/components/HungryBadge.tsx)): 星のついた問題が残っていると、タイトルとエリア選択に「コトが おなかを すかせているよ!(⭐N)」と出る。
- 問題を増やすときの受け渡しの書式: [docs/QUESTION_TEMPLATE.md](docs/QUESTION_TEMPLATE.md)

## ステージの途中からの再開(3章)
- 解答のたびに、そのステージの出題の並び(問題id)と進行状況(次に解く位置・正解数・コンボ・ボスのHP)を保存する([sessionStore](src/app/store/sessionStore.ts) / [session.ts](src/features/quiz/session.ts))。
  ブラウザの再読み込み・アプリの終了・「やめる」のあとでも、ステージ選択に「▶ つづきから あそべるよ(N もんめ〜)」と出て、続きから遊べる(同じ問題の続き)。「はじめから やりなおす」で最初からに戻せる。
- 保存するのは最後に遊んだ1ステージだけ。ステージをクリアしたとき・「もう少し」から再挑戦するときに消える。
- 問題データが変わって、保存した問題idが見つからないとき(アプリ更新後など)や、保存内容が壊れているときは、自動で最初から遊ぶ(エラーにならない)。
- ボスのHPも復元する。とどめの一撃のあとで中断した場合は、再開した時点でクリアになる。

## 効果音の種類(13章)
`tap` `correct` `incorrect` `clear` `subBossClear` `lastBossClear` `growth`(エリアクリアでマスコットが成長) `pageUnlock`(図鑑ページ解放) `bonus`(克服ボーナス)。
エリアクリア時は、クリア画面ではクリア音だけを鳴らし、成長音・ページ解放音は、マップ(エリア選択・ステージ選択)に戻ってから、通知(トースト)の表示と同時に1つずつ鳴る(下の「エリアクリアの通知」)。実素材は `src/assets/audio/se/<種類>` に置けば差し替わる。

## 配色・フォント(SPEC 10章で確定)
- フォント: **M PLUS Rounded 1c**(SIL Open Font License)。[@fontsource](https://fontsource.org/fonts/m-plus-rounded-1c) から日本語・英数字の通常/太字をアプリに同梱している(オフラインでも同じ字体で表示。日本語フォントは約0.9MBずつで、オフライン用に保存される)。
  絵文字など、フォントにない文字は端末の字体になる。クレジットにも出典(素材管理表)を記載済み。
- 色は `src/styles/global.css` の先頭の変数(`:root`)で一元管理: 背景=クリーム(生成り)`#fbf4e4` / メイン=パステルミント`#a8e0c8` / 特別(称号・ランキング上位)=淡いゴールド`#f2d98a` / 文字=焦げ茶`#4b3a2e`(純黒は使わない)。
  ミント地のボタンは、白ではなく焦げ茶の文字にして読みやすさを確保している。
- エリアごとのアクセントカラー([areaTheme.ts](src/data/areaTheme.ts)): エリア選択・ステージ選択・出題画面の左の帯や見出しの線に使う。**いまの色は暫定**(SPEC 10章の表の値に合わせて、このファイルだけを直せばよい)。
- PWAのアイコン・テーマ色もミントに合わせた(アイコンは `python scripts/generate-icons.py` で再生成)。

## ライセンス・公開
- ソースコードは [MIT License](LICENSE)(コピーライトの名義: Yume Shinjo)。
- 画像・音声などの素材、同梱フォント(M PLUS Rounded 1c: SIL Open Font License)、使用ライブラリは、それぞれのライセンスに従う。出典は [docs/ASSET_CREDITS.md](docs/ASSET_CREDITS.md) とゲーム内のクレジット画面にまとめている。
- `.env.local`(Firebaseの設定値)は Git の管理対象外。公開しても、Firestoreはセキュリティルール(firestore.rules)で守られている。

## 1問につき判定は1回だけ(重大な不具合の修正)
選択式(通常・文中タップ)・穴埋め・仕分けのすべてで、解答が確定したあとは選択肢・カード・「こたえる」を押せない(disabled)。
再描画を待たずに続けて押されても、最初の1回だけを解答にする(ref で同期的に記録)。さらに [QuizPlayer](src/features/quiz/QuizPlayer.tsx) 側でも、
同じ問題への2回目以降の解答は無視する(ボスのHP・正解数・統計・星が二重に更新されない)。選んだ選択肢は正誤の色で、不正解のときは正解の選択肢も色で示す。
再発防止のテストは [engines.test.tsx](src/engines/engines.test.tsx)。

## ストーリーの見返し(ことだまの書「おもいで」)
見終わったストーリー(導入・小ボス撃破後・真相・エリアクリアなど)を、エリアごとにいつでも見返せる([storyArchive.ts](src/features/story/storyArchive.ts) / [StoryArchive.tsx](src/features/zukan/StoryArchive.tsx))。
まだ見ていないものは出さない(ネタバレ防止)。選択肢のあるエンディング分岐は、従来どおり「エンディングを もういちど 見る」で見返す。

## エリアクリアの通知(トースト)
クリア画面は達成メッセージとスコアだけのシンプルな表示。エリアクリアの成長・図鑑ページ解放は、マップ(エリア選択・ステージ選択)に戻ったあと、
画面の左下に短い通知(「せいちょうした!」→「ずかんが ふえたよ!」)を1つずつ出して知らせる([Toaster](src/components/Toaster.tsx) / [toastStore](src/app/store/toastStore.ts))。
- 通知は約2.5秒で自動的に消え、操作はふさがない(すぐ次のステージへ進める)。出る瞬間に対応する効果音(成長音・ページ解放音)が1回ずつ鳴り、前の音が鳴り終わってから次を出すので重ならない。
- クリア音が鳴っているあいだに戻ったときは、クリア音が鳴り終わるのを待ってから出す。通知の順番待ちは端末に保存しない(アプリを閉じると消える)。
- 効果音を聞かせるため、演出の音が鳴っているあいだ BGM を一時的に下げる(ダッキング)。

## BGMの音量・バックグラウンド
- BGMは Web Audio のゲインで音量を決める(iOS Safari は `<audio>` の volume を無視するため)。基準音量はスライダーの値の0.4倍で、効果音より控えめ。
- アプリがバックグラウンドに回る(ホーム画面に戻る・画面ロック)とBGMを止め、戻ると続きから鳴らす。ミュート中は音量0のまま再生を続ける。

## 主人公のアイコン(2章)
色と図形だけの仮アイコン8種([playerIcons.ts](src/data/playerIcons.ts))から選ぶ。設定画面と、ランキングの参加画面・ランキング画面で変えられる([IconPicker](src/components/IconPicker.tsx) / [PlayerIcon](src/components/PlayerIcon.tsx))。
選んだアイコンは端末に保存し([profileStore](src/app/store/profileStore.ts))、ランキングに参加中なら、順位表の名前の横にも出る。
- アイコンは、得点と同じ仕組み([scoreSync](src/features/ranking/scoreSync.ts))でサーバーへ送る(送信済みのアイコンと違っていれば未送信)。オフラインで変えても、通信が戻ったら自動で送られる。
- サーバーのデータは `{ nickname, icon, score, updatedAt }`。**`icon` を書けるよう、`firestore.rules` を更新した(あってもなくてもよい項目)。アプリを公開する前に、ルールを先にデプロイすること**
  (`npx firebase-tools deploy --only firestore:rules`)。ルールが古いままだと、アイコンつきの書き込みが拒否され、得点も送れなくなる。
- アイコンが無い古いデータや、知らない id は、標準のアイコン(ミントのまる)で表示する。実際のイラストに差し替えるときは、id はそのままにして PlayerIcon の中身だけを変える。
- 名前の専用設定は持たない。呼び名はランキングのニックネームで、ナレーションが名前を参照する台詞はない(呼び名の使い回しは対象箇所なし)。

## ニックネームの変更(8章)
ランキング画面の「ニックネームを かえる」から、参加後にいつでも変えられる。入力の検証(1〜12文字・NGワード)は参加時と同じ。
サーバーの自分のデータを書き換えるので、通信できないときは変えずにエラーを出す(フォームは開いたままで、やり直せる)。得点は変わらない(大きいほうが残る)。

## 仕分けゲームの操作(5章)
単語を**ドラッグしてカゴに運ぶ**操作に対応した([SortingEngine](src/engines/sorting/SortingEngine.tsx)。Pointer Events なので、マウス・タッチ・ペンで同じように動く)。従来の**タップ選択**(単語をタップ → カゴのボタンをタップ)も残してあり、どちらでも同じ結果になる。
- 入れた単語はカゴの中に並ぶ。カゴの中の単語を別のカゴへドラッグして入れ直せる。ドラッグ中は、指の下のカゴが強調され、単語の複製が指についてくる。
- 8px 以上動かしたらドラッグ、それ未満はタップ扱い。ドラッグの終わりに続けて届く click は選択として扱わない。
- カゴが画面に収まらないとき(品詞分類は10個)に備え、ドラッグ中に画面の上下の端へ寄ると自動でスクロールする。単語のカードは `touch-action: none` で、触ったまま動かしてもページが動かない。
- 答え合わせのあとは、単語・カゴとも押せない(1問につき判定は1回だけ)。初回の操作ガイドも、この操作に合わせた。

