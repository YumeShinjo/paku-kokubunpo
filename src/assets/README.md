# 素材の置き場所(差し替えルール)

**ファイルを下の表のとおりの場所・名前で置いて `npm run build`(開発中は保存)するだけで、画面に反映される。**
コードの変更は不要。置いていない素材は、これまでの仮表示(絵文字・単色・合成音)のまま。
拡張子は 画像=`webp / png / jpg / jpeg / gif / svg`、音声=`mp3 / m4a / ogg / wav`(同名が複数あれば先に書いた拡張子を優先)。

素材を置いたら、**必ず `docs/ASSET_CREDITS.md`(素材管理表)に1行足す**こと。ゲーム内のクレジットに自動で出る。

**画像・音声の実ファイルは Git の管理対象外**(`.gitignore` で `src/assets/audio/` と `src/assets/images/` の中身を除外。フォルダの `.gitkeep` だけ残す)。GitHub にはソースコードだけを置き、素材はこの端末で `npm run build` して Firebase Hosting へ配信する。別の端末でビルドするときは、素材を同じ場所に置き直すこと(置かれていない素材は仮表示になる)。

## 画像 `src/assets/images/`

| ファイル(拡張子は省略) | 内容 | どこに出るか |
| --- | --- | --- |
| `mascot/base` | マスコットのベース | タイトル・ストーリー・結果画面のマスコット |
| `mascot/accessory-1` 〜 `accessory-7` | 成長アクセサリー(ベースと同じキャンバスサイズの透過PNG。下の対応表) | ことばの市場(1つ目)〜王座の間(7つ目)を、序章を除いてクリアした数 N のとき、1〜N を重ねて表示 |
| `mascot/true` | 本来の姿(真エンディング用) | ラスボス撃破後・エンディング結果 |
| `mascot/happy` `sad` `eating` `surprised` `sleepy` | 表情の差分(ベースと同じキャンバスサイズ) | 喜び=正解・クリア / しょんぼり=不正解・「もう少し」 / もぐもぐ=苦手を克服したとき / びっくり=エリアクリア・成長の通知 / 眠そう=星の問題が5問以上たまったときのタイトル(未満は通常) |
| `boss/subboss-<エリアid>` | 小ボスの立ち絵(役職ごとの1枚絵。透過・正方形) | 小ボス戦のパネル、ストーリーでその小ボスが話すとき |
| `boss/lastboss-possessed` | 王様(取り憑かれた姿) | ラスボス戦のパネル、乱れに飲まれた王の台詞 |
| `boss/lastboss-purified` | 王様(浄化後の姿) | 王様(ヴェルバルト)の台詞 |
| `bg/title` | タイトル背景 | タイトル画面 |
| `bg/<エリアid>` | エリア背景 | ストーリー、ステージ選択、出題画面 |
| `ui/title-logo` | タイトルロゴ | タイトル画面(文字の見出しの代わり) |
| `ui/badge-castle` / `ui/badge-journey` | 称号バッジ | 称号の表示(ことだまの書・結果・タイトル) |

成長アクセサリー7段階(SPEC 6章): 1=市場「小さな布のポーチ」/ 2=鍛冶場「小さな腕輪」/ 3=滝「首元のスカーフ」/ 4=橋「小さなブローチ」/ 5=絆の間「リボン」/ 6=見分けの間「片眼鏡風の飾り」/ 7=王座の間「王冠のかけら」。

エリアid: `prologue` `kotobaNoIchiba` `sugatakaeNoKajiba` `namerakaNoTaki` `tsunagiNoHashi` `kizunaNoMa` `mikakeNoMa` `ohzaNoMa`

- 画像は1枚 500KB 以内を目安に(初回読み込みとオフライン保存の量が増えるため)。**キャラクター画像は、元の1024×1024の透過PNG(1枚500KB〜1MB)を、512×512のWebP(1枚約30〜55KB)に変換して置いている**(表示は最大でも約12rem=192px。合計11.3MB→約0.6MB)。元のPNGは素材置き場(sozai-box)に残してある。差し替えるときも、同じ変換をしてから置く。
- 背景は上に半透明のクリーム色を重ねて文字を読みやすくしている(タイトル・ストーリー以外)。

## BGM `src/assets/audio/bgm/`

| ファイル | 場面 | 専用曲がないとき代わりに使う曲 |
| --- | --- | --- |
| `title` | タイトル・設定・図鑑・クレジット | (なし=無音) |
| `explore` | エリア選択・ステージ選択、王座の間の前半のストーリー | title |
| `talk` | 会話シーン(王座の間以外の7エリアの導入・小ボス撃破後・エリアクリアのストーリー) | explore → title |
| `stage` | 出題中(通常ステージ・自由練習) | explore → title |
| `subBoss` | 小ボス戦 | stage → explore → title |
| `lastBoss` | ラスボス戦 | subBoss → stage → explore → title |
| `truth` | 真相究明のストーリー | explore → title |
| `ending` | エンディング(ラスボス撃破後〜クレジット) | explore → title |

- **導入曲つきの場面**: `<場面>-intro`(例: `explore-intro`)も置くと、それを1回鳴らしてから `<場面>` をくり返す(導入→ループの2曲構成)。
  いまは `explore`(始まりの村 A→B)と `truth`(星降る丘 A→B)が導入つき。
- 曲はループ再生される。ループしても不自然でない曲・編集にしておくこと。
- 1曲 1〜2MB 以内(m4a / mp3)を目安に。
- **オフラインでは鳴らない**(音声ファイルは通信できるときだけ読み込む)。オフライン時はBGMなしで遊べる。

## 効果音 `src/assets/audio/se/`

`tap` `correct` `incorrect` `clear`(通常ステージ) `subBossClear`(小ボス撃破) `lastBossClear`(ラスボス撃破) `growth`(エリアクリアでマスコットが成長) `pageUnlock`(図鑑ページが開いたとき) `bonus`(克服ボーナスでアクセサリーが増えたとき)(ファイル名は `src/lib/audio.ts` の `SeKind` と同じ)。
置いた種類だけ本物の音になり、残りは仮のビープ音のまま。短い音(〜2秒)にすること。

## ここに置かないもの(別の場所)

- **PWAアイコン** `public/icons/`(`icon-192.png` `icon-512.png` `icon-512-maskable.png` `apple-touch-icon.png`)と `public/favicon.svg`:
  ホーム画面やブラウザが決まったURLで読むため、`src/assets` ではなく `public/` に同名で上書きする。
  サイズは 192 / 512 / 512(maskable は中央80%に絵を収める)/ 180。仮アイコンは `python scripts/generate-icons.py` で作ったもの。
