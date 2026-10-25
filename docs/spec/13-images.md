# 13. 画像素材

画像の名前と置き場所、使われる場所、仮表示(素材がないとき)、大きさと読み込みの方針を定める。出典・ライセンスは14章、音声素材は12章、キャラクターの設定は7章。

> **この章の「置かれている」は、作業用のフォルダ(`C:\dev\paku-kokubunpo\src\assets\images\`)を調べた結果**。画像と音声の実ファイルは、二次配布の禁止などのため、`.gitignore` で除外していて、**公開リポジトリには入っていない**(1章)。リポジトリだけを取得すると、画像がない状態で動き、仮表示になる。

## 13.1 置き方のしくみ

| 項目 | 内容 | 根拠 |
|---|---|---|
| 置き場所 | `src/assets/images/<名前>.<拡張子>` | `src/assets/registry.ts` |
| 名前 | フォルダからの相対パス(拡張子なし)。例: `mascot/base` | 同上 |
| 拡張子 | `webp`・`png`・`jpg`・`jpeg`・`gif`・`svg`。同じ名前で拡張子が複数あれば、この並びで先のものを使う | 同上 |
| 反映 | 決まった名前で置いて `npm run build`(開発中は保存)するだけ。コードの変更は不要。ビルド時にまとめて見つけ、URLにする(`import.meta.glob`) | 同上 |
| 素材がないとき | 「なし」として扱い、**仮表示**(絵文字、単色、CSSで描いた形)のままになる。画面は壊れない | 同上、各画面 |
| 管理表 | 素材を置いたら `docs/ASSET_CREDITS.md`(素材管理表)に1行足す。ゲーム内のクレジットに自動で出る(14章) | `src/assets/README.md` |
| オフライン | 画像は、ビルド時に一緒に保存される(PWAのプリキャッシュ対象: webp・svg・png・jpg など。1章)。オフラインでも出る | `vite.config.ts` |

## 13.2 画像の一覧(コードが引く名前)

「作業用に置かれている」の数は、実ファイルを数えた値。

| 区分 | 名前 | 内容 | 使われる場所 | 必要数 | 置かれている |
|---|---|---|---|---|---|
| マスコット | `mascot/base` | コトのベース(512×512、透過) | ホーム、ストーリー、結果などのコト全般 | 1 | 1 |
| | `mascot/accessory-1`〜`-7` | 成長アクセサリー(ベースと同じ大きさ。重ねる)。1=布のポーチ、2=腕輪、3=スカーフ、4=ブローチ、5=リボン、6=片眼鏡風の飾り、7=王冠のかけら(`src/assets/README.md`) | 成長段階−1個を重ねる(7章) | 7 | 7 |
| | `mascot/true` | 本来の姿(王女コレット) | ラスボス撃破後のストーリー、結果画面、図鑑 | 1 | 1 |
| | `mascot/<表情>` | 表情の差分: `happy`・`sad`・`eating`・`surprised`・`sleepy`・`combo`・`hungry` | 正解/不正解、克服、成長の通知、ホームの一言など(7章) | 7 | 7 |
| 小ボス | `boss/subboss-<エリアid>` | 小ボス7人の立ち絵。浄化前(取り憑かれた姿。512×512、透過) | 小ボス戦のパネル、戦う前の会話、ステージ選択の未クリアのノード、図鑑(浄化前) | 7 | 7 |
| | `boss/subboss-<エリアid>-purified` | 浄化後の姿 | 撃破後の会話、思い出の再生、図鑑、ステージ選択のクリア済みノード | 7 | 7 |
| ラスボス | `boss/lastboss-possessed` | 王様(取り憑かれた姿) | ラスボス戦のパネル、ステージ選択、「王(乱れに飲まれた姿)」の台詞、図鑑 | 1 | 1 |
| | `boss/lastboss-purified` | 王様ヴェルバルト(浄化後) | 浄化後の台詞、ステージ選択のクリア済み、図鑑 | 1 | 1 |
| 背景 | `bg/<エリアid>` | エリア背景(通常の姿。横長1024×572) | ストーリー、ステージ選択、出題画面の上の帯、ボス戦の上半分 | 8 | 8 |
| | `bg/<エリアid>-corrupted` | 荒れた姿(序章にはない)。関門を撃破するまで | 同上 | 7 | 7 |
| | `bg/title` | ホーム(タイトル)の背景 | ホーム | 1 | **0** |
| | `bg/kotonoha_forest` | 言の葉の森の背景(縦長572×1024) | 言の葉の森の入口・出題 | 1 | 1 |
| | `bg-card/<エリアid>` | エリア選択のカードに薄く敷く小さな背景(512×286)。なければ `bg/<エリアid>` を使う | エリア選択 | 8 | 8 |
| 言の葉の森 | `kotonoha/yurai` | ユライの立ち絵(512×512、右向き、縦約438px) | 言の葉の森、図鑑 | 1 | 1 |
| 最初の画面 | `title/title_bg` | 最初の画面(タッチして はじめる)の背景(縦長572×1024) | 最初の画面。ホームでも、ぼかして薄く敷く | 1 | 1 |
| | `title/title_koto` | 手を振るコト(透過、697×860) | 最初の画面(星が0のとき) | 1 | 1 |
| ロゴ | `title/title_logo` → `title/title-logo` → `ui/title-logo` | タイトルロゴ。この順で、最初に見つかったものを使う。どれもなければ、文字の見出し | 最初の画面、ホーム | 1 | `title/title-logo.svg` と `ui/title-logo.svg` の2つ(`title/title_logo` はない) |
| 称号 | `ui/badge-castle`・`ui/badge-journey` | 称号バッジ | 称号の表示(9章) | 2 | **0**(なければ王冠のアイコン) |

- 合計: 置かれているのは61ファイル(約4.4MB)。内訳(区分ごとの件数・サイズ): `bg` 16件・約2.5MB、`bg-card` 8件・約0.2MB、`boss` 16件・約1.1MB、`mascot` 16件・約0.5MB、`title` 3件・約0.15MB、`kotonoha` 1件、`ui` 1件。
- エリアid: `prologue`、`kotobaNoIchiba`、`sugatakaeNoKajiba`、`namerakaNoTaki`、`tsunagiNoHashi`、`kizunaNoMa`、`mikakeNoMa`、`ohzaNoMa`。
- コードが引く名前のうち、**置かれていないもの**: `bg/title`、`ui/badge-castle`、`ui/badge-journey`、`title/title_logo`(代わりの名前がある)。

## 13.3 画像が使われる場面のしくみ

| 場面 | 規則 | 根拠 |
|---|---|---|
| ストーリー・ステージ選択・出題の背景 | その時点で、エリアの関門を撃破済みなら通常、未撃破なら荒れた姿。戦う前の会話は、いつも荒れた姿(6章) | `src/data/bosses.ts`(`areaBackgroundName`) |
| 出題画面の背景の帯 | 通常ステージは小さな装飾の帯(高さ約4.5rem)。ボス戦は上半分に大きく、ボスの立ち絵を中に置く。背景画像の縦の見せ位置は、エリアごとに決める(序章38%、滝58%、橋42%、王座の間56%、ほかは50%) | `ScreenBackground.tsx`、`src/data/stageVisualFocus.ts`、`global.css` |
| 素材がないときの背景 | 帯は、エリアの色の仮の帯 | `StageVisual` |
| 文字の読みやすさ | 背景の上に半透明のクリーム色を重ねる(ホームのみ重ねない) | `ScreenBackground.tsx` |
| ボスの立ち絵(ステージ選択のノード) | 倒すまでは浄化前、倒したあとは浄化後。ラスボスは取り憑かれた姿→浄化後の姿 | `src/features/stageSelect/stageNodePortrait.ts` |
| ボスの立ち絵(戦闘パネル) | 小ボスは浄化前の姿、ラスボスは取り憑かれた姿(倒したあとでも変わらない。5章) | `BossPortrait.tsx` |
| 図鑑のなかま | 版ごとに画像を持つ。小ボスは「浄化後/浄化前」を切り替えて見られる。画像は遅延読み込み | `zukanCharacters.ts`、`NakamaTab.tsx` |
| コトの表情 | 素材(`mascot/<表情>`)があればベースの代わりに出す。なければ通常の絵のまま。通知やクリア画面では、素材がなければ何も出さない | `Mascot.tsx` |
| 立ち絵の配置 | 話者に合わせて出す。左右は顔の向きから自動で決める(6章) | `StoryScreen.tsx` |
| 画像の準備待ち | 最初の画面などで、画像がすべて読み込まれるまで待つ部品がある。読み込みに失敗した画像も「終わった」として数え、10秒(`IMAGES_READY_TIMEOUT_MS`)で打ち切る | `src/lib/useImagesReady.ts` |

## 13.4 大きさと軽量化の方針

- 画像は**1枚 500KB 以内**を目安にする(初回の読み込みとオフライン保存の量が増えるため)。置かれている61ファイルは、すべて500KB以下(最大でも約210KB)。
- キャラクター画像は、元の1024×1024の透過PNG(1枚500KB〜1MB)を、**512×512のWebP**(1枚約30〜55KB)に変換して置いている(表示は最大でも約12rem=192px。合計11.3MB→約0.6MB。`src/assets/README.md`)。元のPNGは別の素材置き場に残してある。差し替えるときも、同じ変換をしてから置く。
- 背景は横長1024×572のWebP。エリア選択のカードには、512×286の小さい版(`bg-card/`)を使う(8枚の大きな背景を一度に読み込まないため)。
- 日本語フォントは別(11章)。

## 13.5 アプリアイコン・ファビコン

| ファイル | 大きさ | 用途 |
|---|---|---|
| `public/icons/icon-192.png` | 192×192 | PWAの標準アイコン(小) |
| `public/icons/icon-512.png` | 512×512 | PWAの標準アイコン(大) |
| `public/icons/icon-512-maskable.png` | 512×512 | Androidのマスク可能アイコン(中央80%の安全領域に絵を収める) |
| `public/icons/apple-touch-icon.png` | 180×180 | iOSのホーム画面 |
| `public/favicon.svg` | 可変 | ブラウザのタブ |

- 現在のアイコンは、`scripts/generate-icons.py` で生成した**仮素材**(口を開けた丸いキャラ)。ファビコンは、円と文字「言」だけの単純なSVG。git の履歴上、`public/icons/` は初回コミット以降、変わっていない。差し替え手順は `docs/APP_ICON_REPLACEMENT.md`。
- `public/` の下のファイルは、リポジトリに入っている(`.gitignore` の対象外)。
- テーマ色 `#A8E0C8`、背景色 `#FBF4E4`(1章)。

## 13.6 食い違い

| # | 既存の記録 | コード | 判断材料 |
|---|---|---|---|
| 13-1 | `src/assets/README.md` は、`bg/kotonoha_forest` を「登録だけで、使う画面はまだない」(8章の 8-1と同じ件) | 使っている(`KotonohaBackground.tsx`) | コードが現行。README と `registry.ts` のコメントが古い |
| 13-2 | `src/assets/README.md` の表情は5種(`happy` `sad` `eating` `surprised` `sleepy`) | 7種(`combo`・`hungry` を追加。`registry.ts`、`docs/ASSET_CREDITS.md`) | コードが現行。README が古い |
| 13-3 | `src/assets/README.md` は `bg/title`(タイトル背景)を置く素材として挙げる | `ScreenBackground name="title"` が引くが、作業用のフォルダに**ない**。最初の画面の背景(`title/title_bg`)は、ホームでも、ぼかして薄く敷いて使う(`TitleScreen.tsx`) | 素材が未調達か、`title/title_bg` に代えたのかは**未確認**。画面は壊れない |
| 13-4 | `src/assets/README.md`・`docs/SPEC_STATUS.md` は、称号バッジ(`ui/badge-*`)を、未調達の素材として挙げる | 置かれていない(王冠のアイコンで代用) | 一致(未調達のまま) |
| 13-5 | `docs/SPEC_STATUS.md` は「キャラクター画像16枚(マスコット7・王様2・小ボス7)」、背景は「エリア背景15枚(序章+①〜⑦の通常/荒れた姿)」 | 作業用のフォルダには、マスコット16(ベース、本来の姿、表情7、アクセサリー7)、小ボス14(浄化前後)、王様2、背景は通常8+荒れた7=15、ほか言の葉の森の背景1、カード8 | 数え方が違う(古い記録は、当時の枚数)。コードが引く名前と実ファイルは、13.2のとおり一致する |
| 13-6 | `src/data/stageVisualFocus.ts` のコメントは「玉座(奥の中央)から…」 | 画面の表記は「王座」(友だちの指摘で直した) | コメントの表記が古い。動作には影響しない |
| 13-7 | `docs/ASSET_CREDITS.md` の行数・内容と、ここの一覧 | 14章で突き合わせる | — |

## 13.7 根拠にしたファイル

`src/assets/registry.ts`、`src/assets/README.md`、`src/components/ScreenBackground.tsx`、`src/features/quiz/BossPortrait.tsx`、`src/features/stageSelect/stageNodePortrait.ts`、`src/data/stageVisualFocus.ts`、`src/data/bosses.ts`、`src/features/mascot/Mascot.tsx`、`src/features/zukan/NakamaTab.tsx`、`src/data/zukanCharacters.ts`、`src/lib/useImagesReady.ts`、`src/app/screens/{TitleScreen,StageSelectScreen,AreaSelectScreen,StoryScreen}.tsx`、`src/components/{TapToStart,TitleBadge}.tsx`、`src/features/kotonoha/{KotonohaBackground,Yurai}.tsx`、`public/`、`scripts/generate-icons.py`、`docs/APP_ICON_REPLACEMENT.md`、`docs/ASSET_CREDITS.md`、`docs/SPEC_STATUS.md`、`vite.config.ts`、実ファイルの数え上げ(作業用のフォルダ)
