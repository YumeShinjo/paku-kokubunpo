# 12. 音

BGM(場面ごとの曲)、効果音、音量と補正、音の解禁(iOS対策)、ミュート、バックグラウンドの扱い、オフライン時の扱いを定める。設定画面の音の項目は10章、素材の出典は14章、素材の置き場所は13章。

## 12.1 全体の方針

- **BGMと効果音の両方**を使う。初回起動時から、音は出る(ミュートは既定でオフ。`SPEC.md.md` 7章)。
- BGMと効果音は、別々の音量スライダーで調整できる。ミュートは、画面の端の固定アイコン(11章)。
- すべての効果音には、視覚的な表示を用意する(無音でも意味が伝わるように)。セリフの音声読み上げはしない。
- **素材は置くだけで使われる**。`src/assets/audio/bgm/<場面>.mp3`、`src/assets/audio/se/<種類>.mp3`。**置かれていない効果音は、合成音(Web Audio のビープ音)で鳴る**。置かれていないBGMは鳴らない(無音)。
- 音声ファイルそのものは、二次配布の禁止のため、公開リポジトリに入れていない(`.gitignore`。1・13章)。
- 音のログ(調査用)という隠しデバッグ機能が存在する(存在のみを記す)。

## 12.2 BGM

### 場面と曲

| 場面 | どの画面で | 曲のファイル | 導入曲 |
|---|---|---|---|
| `title` | ホーム、設定、ことだまの書、ランキング、プライバシー、あそびかた、クレジット(通常)、くわしい出典、引き継ぎの画面 | `bgm/title` | なし |
| `explore` | エリア選択、ステージ選択。王座の間の前半の会話(導入・宰相戦の前・宰相の撃破後・ラスボス戦の前) | `bgm/explore` | `bgm/explore-intro` |
| `talk` | 王座の間以外の7エリアの会話(導入・小ボス撃破後・エリアクリア) | `bgm/talk` | なし |
| `stage` | 通常ステージ、自由練習、苦手問題の練習 | `bgm/stage` | なし |
| `subBoss` | 小ボス戦 | `bgm/subBoss` | なし |
| `lastBoss` | ラスボス戦 | `bgm/lastBoss` | なし |
| `truth` | 真相究明(`ohzaNoMa-truth`)の会話 | `bgm/truth` | `bgm/truth-intro` |
| `ending` | ラスボス撃破後の会話(撃破後〜エンディング分岐〜後日談〜共通の締め)、称号の授与画面、エンディングのクレジット | `bgm/ending` | なし |
| `kotonoha` | 言の葉の森(入口・出題・解説・結果)。図鑑(ことだまの書)は `title` のまま | `bgm/kotonoha` | なし |

- 場面から曲を決める関数は `sceneForScreen`(`src/features/audio/bgmScene.ts`)。
- 画面が変わっても曲が同じなら、途切れない(同じ曲を再生中なら、何もしない)。
- 導入曲があれば、導入曲を**1回**鳴らしてから、本体の曲をくり返す(導入→ループの2曲構成)。
- 曲が置かれていなければ、**代わりの曲**を順に探す。全部なければ無音。

| 場面 | 専用曲がないとき、代わりに探す曲(順) |
|---|---|
| `title` | なし(無音) |
| `explore`、`truth`、`ending`、`kotonoha` | title |
| `talk`、`stage` | explore → title |
| `subBoss` | stage → explore → title |
| `lastBoss` | subBoss → stage → explore → title |

(`BGM_FALLBACK`。`talk`・`stage` は explore を先に探す。)

### 曲の一覧(コードが引く素材名)

BGMのファイルは**11**(場面9つ+導入曲2つ)。長さ(秒)は、MP3のヘッダーから測ってコードに書いてある値(`AUDIO_DURATION_SEC`)。

| 素材名 | 長さ(秒) | 再生方式 |
|---|---|---|
| `bgm/title` | 85.94 | AudioBuffer |
| `bgm/explore-intro` / `bgm/explore` | 81.97 / 87.72 | AudioBuffer |
| `bgm/stage` | 71.34 | AudioBuffer |
| `bgm/subBoss` | 182.67 | `<audio>` |
| `bgm/lastBoss` | 173.11 | `<audio>` |
| `bgm/truth-intro` / `bgm/truth` | 78.05 / 75.08 | AudioBuffer |
| `bgm/ending` | 205.48 | `<audio>` |
| `bgm/talk` | 104.33 | AudioBuffer |
| `bgm/kotonoha` | 168.28 | `<audio>` |

- 再生方式は、曲ごとに決める(`bgmPolicy.ts`)。デコード後のメモリ(長さ×44100×2チャンネル×4バイト)が **36MiB 以下**(約107秒以下)なら AudioBuffer(`fetch`→デコード→ループ再生)、それより大きい曲と、長さが分からない曲は `<audio>` 要素。導入曲つきの2曲は、2曲とも AudioBuffer のときだけ AudioBuffer。理由(コメント): AudioBuffer のほうが、アプリの切り替えからの復帰・長い連続再生でも、ピッチと時計が正常だった(実機のログ)。
- BGMのオフライン: 音声ファイルは通信できるときだけ読み込む。**オフラインではBGMは鳴らない**(効果音だけ、使ったあとに保存される。1章)。
- 曲の出典は14章。

## 12.3 効果音

効果音の種類(`SeKind`)は**11**。置かれている効果音ファイルは10(`subBossClear` は専用のファイルを持たず、`subBossPurify` と同じファイルを使う)。ファイルがなければ、合成音(波形・高さ・長さを種類ごとに持つ)で鳴る。

| 種類 | いつ鳴るか | 長い音 |
|---|---|---|
| `tap` | ボタンを押したとき(全ボタン共通。`data-no-tap` のボタンを除く)。仕分けでカードをカゴに置いたとき | — |
| `correct` | 正解のとき(本編の出題、言の葉の森)。設定の「ためす」 | — |
| `incorrect` | 不正解のとき(同上) | — |
| `clear` | 通常ステージのクリア | ○ |
| `subBossPurify` | 小ボスの浄化(撃破)。「先へすすむ」の場面で、ボスが浄化されるところ | ○ |
| `subBossClear` | 称号の授与(エンディングの結果画面。言の葉の森の80枚目)。ファイルは `subBossPurify` と同じ | ○ |
| `lastBossClear` | ラスボスの撃破 | ○ |
| `roundEnd` | 自由練習・苦手問題の練習・言の葉の森のラウンドの終わり | ○ |
| `growth` | エリアクリアでコトが成長した通知 | ○ |
| `bonus` | 星(苦手問題)を克服したとき(正解音の約0.25秒後) | ○ |
| `pageUnlock` | (**コードで鳴らす箇所がない**。通知の定義にだけ残っている。2章) | ○ |

- 長い音(演出の音)が鳴っている間は、次の演出の音を重ねず待たせる(通知の表示など)。
- タップ音は、`App.tsx` が文書全体の `click` を1か所で受けて鳴らす。解答後に正誤音が鳴るボタン(選択肢、「こたえる」)は、タップ音を鳴らさない(`data-no-tap`)。

## 12.4 音量と補正

| 項目 | 内容 | 根拠 |
|---|---|---|
| BGMの音量 | `設定のBGM音量(既定0.7) × 0.4(BGMの基準) × 曲ごとの補正 × ダッキングの倍率` | `audio.ts`(`bgmLevel`、`BGM_BASE_GAIN = 0.4`) |
| 効果音の音量 | `設定の効果音音量(既定0.8) × 種類ごとの補正` | `audio.ts`(`playSe`) |
| ダッキング | 長い効果音の間、BGMを `DUCK_FACTOR = 0.08` 倍に下げる(下げる0.05秒、戻す0.4秒)。クリアの音、ラウンド終了の音、通知(成長)で使う | `audio.ts` |
| 補正の決め方 | BGM: 統合ラウドネスを **約-16 LUFS** にそろえる(測定値から自動計算)。効果音: ピークが **-1 dBFS 以下**になるようにする(音は大きくしない)。キラキラ系の音などは、聴感でさらに小さくする補正を足す | `src/assets/audioLevels.ts` |
| 測定値 | 素材を差し替えたら、同じ名前で測定値(LUFS、ピーク、長さ)を書き換える。測定の記録は `docs/AUDIO_INVENTORY.md`(2026-10-15) | 同上 |
| サンプルレート | BGM素材は44100Hzにそろえ、`AudioContext` もこれに合わせて作る(iOSの復帰時のピッチ変化の一因を減らす試み。全機種で直る保証はない、とコメントにある) | `audio.ts` |

## 12.5 音の解禁(iOS対策)

- iOS Safari などは、ユーザーが一度画面をタップするまで、音を自動再生できない。そこで、起動直後は「タッチして はじめる」の1枚だけを出し(2章)、そのタップの**中で**音を解禁する。
- 解禁は3つの意味を持つ: ①`AudioContext` を resume する、②`audioUnlocked` を true にする(以降、BGM・効果音の再生を許可する、アプリ側の門)、③BGM用の `<audio>` 要素を、タップの中で一度、無音で再生しておく(以降、画面遷移のタイミングで曲を差し替えられる)。
- 解禁のタップの中で、いまの場面のBGMを始め、効果音のファイルを読み込んでデコードしておく。
- `audioUnlocked` は端末に保存しない。アプリを起動するたびに、この画面が出る(10章)。
- 解禁のあとに止まってしまった音(iOS の interrupted、読み込み直しのあとなど)は、画面をタップするたびに動かし直す。

## 12.6 ミュートとバックグラウンド

- **ミュート**は、音量0ではなく、実際に再生を止める(BGMを一時停止し、`AudioContext` も休ませる)。理由(コメント): 音量0のまま鳴らし続けると、端末が「音声を再生中のアプリ」と扱い、他の音楽アプリの再生を止めてしまうため。ミュートを解除すると、再開する(解除のタップの中なので、iOSでも再開できる)。
- BGM音量を0にしたときは、BGMだけ止める(効果音はそのまま鳴る)。0から戻すと再開する。
- **バックグラウンド**(ホーム画面に戻る、画面ロック)に回ったら、BGMを止める。戻ってきたら、1回だけ再開する。ミュート中は止めたまま。
- 再開の音量: 完全に無音にしておく時間 `RESUME_SETTLE_MS = 500`ms、そのあと元の音量まで戻す時間 `RESUME_FADE_SEC = 3.0` 秒。iPhone の実機で、復帰直後の約3秒、ピッチが変わって聞こえたため(コメント)。
- データの初期化のあとは、音を止め、`AudioContext` を閉じてから、画面を読み込み直す(10章)。

## 12.7 食い違い

| # | 既存の記録 | コード | 判断材料 |
|---|---|---|---|
| 12-1 | `docs/SPEC_STATUS.md` は「BGM8曲・効果音9種」 | BGMの場面は9つ(ファイルは導入曲を含め11)、効果音の種類は11(ファイルは10) | 後から増えた。コードが現行 |
| 12-2 | `src/assets/README.md` の効果音の表は「`subBossClear`(小ボス撃破)」 | 小ボスの撃破は `subBossPurify`。`subBossClear` は称号の授与(ファイルは同じ) | コードが現行。README が古い |
| 12-3 | `src/assets/README.md` の `stage` は「出題中(通常ステージ・自由練習)」、`title` は「タイトル・設定・図鑑・クレジット」 | 苦手問題の練習も `stage`。ランキング・プライバシー・あそびかた・くわしい出典・引き継ぎも `title`(`bgmScene.ts`) | コードが現行。README の一覧が不完全 |
| 12-4 | `docs/AUDIO_INVENTORY.md` の `talk` の「場面(どこで鳴るか)」 | コードと一致 | 一致 |
| 12-5 | `src/assets/README.md` は「1曲 1〜2MB 以内(m4a / mp3)を目安に」 | 作業用のフォルダ(`C:\dev` の `src/assets/audio/bgm/`。git の管理外)のファイルサイズ: 2MBを超える曲が4つ(`kotonoha` 約2.69MB、`ending` 約2.47MB、`subBoss` 約2.20MB、`lastBoss` 約2.08MB)。ほかの7つは2MB以下(約1.0〜1.7MB) | 目安なので動作には影響しない。コードの再生方式は、長い曲を `<audio>` 方式にして対応している(12.2) |
| 12-6 | `src/lib/audio.ts` の「TONE_PARAMS」のコメントは「本物の素材(10章)が置かれていない種類の仮の音」 | 現在、10種の効果音の素材はそろっている(作業用のフォルダ)。合成音が実際に鳴るのは、素材のない `pageUnlock` と、素材の読み込みに失敗したとき | 動作は一致。コメントの章番号が古い |
| 12-7 | 実機の動作(iPhone/Android での音の再生、復帰時のピッチ) | **未確認**(コードのコメントと、`docs/DEVELOPMENT_HISTORY.md` の記録にとどまる。BGMのピッチ調査のために、AudioBuffer 方式を導入した、とある) | — |

## 12.8 根拠にしたファイル

`src/lib/audio.ts`、`src/lib/bgmPolicy.ts`、`src/lib/bgmBuffer.ts`、`src/features/audio/bgmScene.ts`、`src/features/audio/useBgm.ts`、`src/assets/registry.ts`、`src/assets/audioLevels.ts`、`src/assets/README.md`、`src/App.tsx`、`src/components/{TapToStart,Toaster,MuteButton}.tsx`、`src/app/store/{settingsStore,toastStore}.ts`、`src/app/screens/{StageScreen,FreePracticeScreen,ReviewPracticeScreen,KotonohaPlayScreen,EndingResultScreen,StoryScreen}.tsx`、`src/features/quiz/QuizPlayer.tsx`、`src/engines/sorting/SortingEngine.tsx`、`docs/AUDIO_INVENTORY.md`、`docs/SPEC_STATUS.md`、`docs/DEVELOPMENT_HISTORY.md`、`SPEC.md.md`(7章)
