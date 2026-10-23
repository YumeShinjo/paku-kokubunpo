# 素材ライセンスの棚卸し(2026-10-22 更新。下の A〜D は 2026-09-26 時点の記載で、この節が新しい)

## 0000. 2026-10-23 の更新(規約ページの追加反映と、ユーザーの判断。追加17)

- 新しく保存された規約ページ(Hareno「千年の内緒話」・zippy「The Forgotten Girl」・M+ FONTS・あかずきんポップの切り取り版)を読んで、台帳に反映した。Hareno「千年の内緒話」・zippy「The Forgotten Girl」は OK。zippy「The Forgotten Girl」は、題名の「【フリーBGM】」と、概要欄の規約への案内から、FANBOXの規約の対象に入る。
- **ユーザーの判断**(2026-10-23): OpenTracks のBGM(禁止事項8に当たるおそれを認識したうえで、授業課題の範囲でそのまま使う。課題の結果が出たあとに、差し替えるか、公開を止める)・あかずきんポップ(元の M+ FONTS のライセンスに準じる。そのまま使う)・LoRA(配布元は削除済みで、ライセンスの欄がない。そのまま使う)・Illustrious(表記の食い違いを記録するだけ。スナップショットは保存しない)。
- 「くわしい出典」の要点を2件、規約の記載に合わせて直した(Hareno「千年の内緒話」・ICOON MONO)。
- 読み取りの詳細: [ASSET_TERMS_REVIEW_2026-10-22.md](ASSET_TERMS_REVIEW_2026-10-22.md) の第5節。

## 000. 2026-10-22 の更新(保存した規約ページの読み取り。追加16)

- 保存した規約ページ(`docs/license-snapshots/`。9件)を読んだ。zippy・Hareno「禁忌の詠唱」・EigHt・くらげ工匠・ICOON MONO は、台帳と合った(確認済み)。Gemini も、原文で確認した。
- **要差し替え**: OpenTracks のBGM(`bgm/title.mp3`)。禁止事項8が、Webアプリの形態(音声ファイルをブラウザから取り出せる)に当たるおそれがある。
- **判断が必要**: あかずきんポップ(M+ FONTS 2018年版のライセンス本文)・LoRA(ページに、ライセンスの欄がない)。保存がなく、未確認のまま: Hareno「千年の内緒話」・Illustrious(Hugging Face・CivitAI)。
- 読み取った内容・引用・対応案: [ASSET_TERMS_REVIEW_2026-10-22.md](ASSET_TERMS_REVIEW_2026-10-22.md)。保存ファイルの一覧: [license-snapshots/README.md](license-snapshots/README.md)。

## 00. 2026-10-22 の更新(小ボス撃破の効果音の差し替え・コトの表情 combo/hungry の差し替え)

- **小ボスの撃破(浄化)の音と、称号の授与の音**を、Springin'「衝撃」から、**OtoLogic「オノマトペ キラキラ04」(`se/subBossPurify.mp3`)**に差し替えた。先生から、斬る音のようで、作風に合わないという指摘があったため。
- OtoLogic: **CC BY 4.0。クレジット表示が必須**(学校の授業でも必須)。ゲーム可・営利可・改変可・申請不要。入手元: https://otologic.jp/free/se/sparkle01.html ・規約: https://otologic.jp/free/license.html 。規約の保存: [docs/license-snapshots/otologic-2026-10-22.md](license-snapshots/otologic-2026-10-22.md)。
- 加工: 長さと音量を調整(2.8秒・44.1kHz・ステレオ・128kbpsのmp3。先頭0.1秒を切り、末尾をフェードアウト。アプリ内でさらに-3dB)。CC BY 4.0 は、改変したことを示すことも求めるので、クレジット画面の表記に「(長さと音量を調整)」を添えた。
- 「衝撃」の行は、台帳に「使用なし(2026-10-22 差し替え)」として残し、アプリ内の表示・出典の一覧からは外した。Springin'の素材は、ほかに3つ(正解4・jingle_23・ジングル21)使っているので、クレジットの「Springin' Sound Stock」の行は残る。
- **コトの表情差分 combo・hungry**(`mascot/combo.webp`・`mascot/hungry.webp`)を、切り抜きを直した版に差し替えた(2026-10-22)。画像は、生成AI(Gemini)のままで、ライセンス上の変更はない。

## 0. 2026-10-15 の確認結果(講義の評価項目「出典の特定」に合わせて、入手元URLと規約を特定した)

[docs/ASSET_CREDITS.md](ASSET_CREDITS.md) の表に、6列目「入手元URL」と、制作素材(タイトルロゴ)・画像生成の道具の行を足した(ゲーム内には出ず、「くわしい出典」に出る)。
全素材の一覧は [docs/SOURCES_FOR_REPORT.md](SOURCES_FOR_REPORT.md)(`scripts/export-sources.py` で作る)。URLと条件は、公式のページを開いて確認したものと、制作者が確認して提供したものだけを書き、推測では書いていない。

### 効果音(すべて、入手元と規約を特定済み)

| 素材 | 入手元 | 規約の要点 |
| --- | --- | --- |
| hit02・one23(くらげ工匠) | http://www.kurage-kosho.info/ (mp3への直リンクは禁止なので、サイトのトップとファイル名だけ) | 商用・非商用可、加工可、クレジット不要(任意)。再配布は禁止 |
| se_cancel15(効果音工房) | https://umipla.com/soundeffect/4388 | 個人・サークルは商用・非商用可、報告・クレジット不要。再配布・Content ID登録は禁止。法人は要連絡 |
| VSQ_JINGLE_0067_Otoboke_01(VSQ plus+) | https://vsq.co.jp/plus/wordpress/wp-content/uploads/2021/07/VSQ_JINGLE_0067_Otoboke_01.mp3 | 商用・非商用可、ゲーム可、クレジット任意。そのままの単体での頒布は禁止 |
| holy1(ポケットサウンド) | https://pocket-se.info/archives/412/ | **クレジット表記かリンクが必須**。書式「効果音：ポケットサウンド – https://pocket-se.info/」。素材への直リンクは禁止 |
| 正解4・jingle_23・ジングル21(Springin'。「衝撃」は、2026-10-22 に使用をやめた) | https://www.springin.org/sound-stock/ のカテゴリのページ | 適用されるのは、Sound Stockのガイドライン https://www.springin.org/sound-stock/guideline/ 。Springin'アプリ本体の規約は、効果音素材の規約ではないので含めない |
| ボタン音17(On-Jin) | https://on-jin.com/sound/muci.php | 学校・個人は無料。クレジット任意。企業の営利利用は連絡が必要 |

### BGM

| 素材 | 入手元 | 規約の要点 |
| --- | --- | --- |
| 禁忌の詠唱・千年の内緒話(Hareno) | https://youtu.be/AdWxKyHYQM0 / https://youtu.be/CGjkJKXqgHY | 無料・商用可・ゲーム可。二次配布・販売と、権利を主張する行為は禁止(制作者が確認) |
| 始まりの村・星降る丘・The Forgotten Girl(zippy) | https://booth.pm/ja/items/6114595 / https://booth.pm/ja/items/6114577 / https://www.youtube.com/watch?v=ZBIg90S5vaI | FANBOXの「フリーBGM 利用規約」(2024-09-18公開)。【フリーBGM】の表記がある曲のみ二次利用可(3曲とも表記ありと、制作者が確認)。ゲーム可。フェード・カット・音量調整・エフェクトは可、キー・ピッチ変更は禁止。クレジット任意。教育機関は著作権法第35条に準ずる |
| 凍てつく世界の果て(EigHt) | https://www.youtube.com/watch?v=FZ2dtOAPe5U ・チャンネル https://www.youtube.com/@eightchann ・規約 https://eight-novel.fanbox.cc/posts/7647818 | 「利用規約」(2024-03-22公開)。ゲーム可。著作表記は任意。配信サービス・Content ID登録は禁止。完全なオリジナルとしての公開・販売は不可。教育機関は第35条に準ずる |
| Prairie4(PeriTune) | https://peritune.com/blog/2019/03/01/prairie4/ | **CC BY 4.0(表示が必要)**。商用可 |
| 爽やかなアイリッシュ的なBGM_2(2021年リミックス版。OpenTracks) | https://opentracks.com/bgm/play1840.html | OpenTracksのライセンス。クレジット不要 |
| ゆっくりしよ(にゃるぱかBGM工房) | https://booth.pm/ja/items/7674668 ・規約 https://nyalpacabgm.com/terms-of-use/ | 個人・法人、商用・非商用可。ゲーム・販売する創作物への利用も許諾。通常はクレジット不要。禁止: 楽曲をDLできる状態にすること、Content ID・配信サービスへの登録、再許諾・転売。教育・授業は明示の記載なし(ゲームへの組み込みは許諾された用途) |

### 画像の生成と制作のツール・素材

| 素材 | 入手元 | 規約の要点 |
| --- | --- | --- |
| LoRA「Chibi Lerasigma 228 style」(Ticovca) | https://civitai.com/models/966828/chibi-lerasigma-228-style (削除されたという調査結果あり)・アーカイブ https://civarchive.com/models/966828 | Fair AI Public License 1.0-SD(CivitAIの表記)。生成画像には権利を主張しない。ベースモデルの表示は Pony |
| Illustrious-XL v2.0 | https://huggingface.co/OnomaAIResearch/Illustrious-XL-v2.0 | Hugging Faceのlicense欄は creativeml-openrail-m。CivitAI側の表記は Fair AI Public License 1.0-SD(別のページの記載として分けて書いた) |
| sd-webui-forge-classic | https://github.com/Haoming02/sd-webui-forge-classic | AGPL-3.0(ソフトのライセンス。生成画像のライセンスではない) |
| Gemini | https://policies.google.com/terms (規約) | 生成したコンテンツの所有権をGoogleは主張しない(Your content remains yours)。商用利用の可否・表示義務の明記はない。生成AIのコンテンツを人間が作ったと誤認させることは禁止なので、AI生成であることを開示する |
| Vサムネ(ロゴの制作) | https://vsamune.com/ | 報告・クレジット不要。生成物は商用・非商用可。素材そのものの再配布は禁止 |
| Photopea(ロゴの制作) | https://www.photopea.com/ | 制作物は制作者のもの。表記不要 |
| ICOON MONO(肉球のアイコン3・葉っぱアイコン。TopeconHeroes) | https://icooon-mono.com/ ほか(くわしくは台帳) | 連絡不要・無料・アプリへの組み込み可・加工可。再配布・ジェネレーターの素材・販売サイトでの販売は禁止。商標登録は控える |
| あかずきんポップ(ロゴのフォント。FLOPDESIGN) | https://flopdesign.booth.pm/items/1748058 (2026-10-15にオーナー以外には非公開と表示) | 商用・非商用可、埋め込み可。M+ FONTS派生。クレジットは**作者の希望**(必須ではない)。条件は、ダウンロードしたときの規約の文面に基づく(保存した文面は docs/license-snapshots/ に、制作者が追加) |
| Monomaniac One(ロゴのフォント) | https://fonts.google.com/specimen/Monomaniac+One | SIL Open Font License 1.1(Copyright 2020 The Monomaniac Project Authors) |

### クレジットの表記が必要・希望されている素材

- **ポケットサウンド(holy1)**: 規約で必要。ゲーム内のクレジット画面に「効果音:ポケットサウンド – https://pocket-se.info/」の1行(リンク)を載せた。「くわしい出典」にも載せている。
- **Prairie4(PeriTune)**: CC BY 4.0。ゲーム内のクレジットには「PeriTune」がある。「くわしい出典」に、曲名・作者・ライセンス・入手元を載せた。
- **OtoLogic(オノマトペ キラキラ04)**: CC BY 4.0。ゲーム内のクレジット画面に「音素材：OtoLogic(https://otologic.jp) / CC BY 4.0(長さと音量を調整)」の1行(リンク)を載せた。「くわしい出典」(効果音)にも、「表記必須」の印つきで載せている。
- **あかずきんポップ**: 作者の希望(必須ではない)。「フォント：あかずきんポップ フリーダウンロード：https://flopdesign.booth.pm/items/1748058」を、「くわしい出典」に載せた。

### 要確認(残っているもの)

- **あかずきんポップ**: 作者のBOOTHのページが、2026-10-15 に開くと、オーナー以外には非公開と表示された。条件は、ダウンロードしたときの規約の文面に基づく(保存した文面は、`docs/license-snapshots/` に、制作者が追加する)。ページが再び公開されたときの、条件の再確認
- **M+ FONTS**: 公式リポジトリ(https://github.com/coz-m/MPLUS_FONTS)の現在の OFL.txt は SIL Open Font License 1.1(2026-10-15に確認)。あかずきんポップの元になった2018年の版そのもののバージョンは、確認していない
- 音源を取り出しにくい配置にする条件(OpenTracks・Springin'・PeriTune): 音声ファイルは Git に置かず(`.gitignore` で除外。履歴にもない)、本番では、ビルド後のファイル名にハッシュが付く形で配信している
- タイトルロゴの画像ファイルは、素材として単体で配布しない(ソースコードの提出でも、アプリの一部としてのみ)

---

# 素材ライセンスの棚卸し(2026-09-26時点)

[docs/ASSET_CREDITS.md](ASSET_CREDITS.md)(ゲーム内のクレジットの元)を確認し、**ライセンスの記載が「要確認」のまま、または最終確認が必要な素材**を一覧にしたもの。
埋められる情報(ファイル名・使用箇所・想定される出典)は埋めてある。**実際の許諾状況(規約の中身)の確認は、こちらでは行っていない**ので、下の「確認してほしいこと」を、配布元の規約ページで見てほしい。

表の「ファイル」は、アプリの中(`src/assets/`)での名前。素材ファイルは git の管理外で、Firebase Hosting で配信している(GitHub には置いていない)。

## A. 「要確認」のままの素材(BGM 8曲・効果音 9種)

ゲーム内のクレジット画面には、この行が **「配布元の利用規約に従う(利用条件は要確認)」** のまま出ている。確認できたら、ASSET_CREDITS.md のライセンス欄を正式な文言に書き換える(ゲーム内にも反映される)。

### BGM(`src/assets/audio/bgm/`)

| ファイル | 元の素材名 | 作者・サイト(記載どおり) | 使用箇所 | 備考 |
| --- | --- | --- | --- | --- |
| `title.mp3` | 爽やかなアイリッシュ的なBGM_2 | OpenTracks / 鷹尾まさき | タイトル・設定・図鑑・ランキング・通常のクレジット | 軽量化(96kbps)済み |
| `explore-intro.mp3` / `explore.mp3` | 始まりの村 A / 始まりの村 B | zippy | エリア選択・ステージ選択(A→B→Bのループ) | |
| `stage.mp3` | Prairie4(PerituneMaterial_Prairie4_loop) | PeriTune | 出題中 | |
| `subBoss.mp3` | 禁忌の詠唱 - Phantom Resonance | Hareno | 小ボス戦 | 軽量化(96kbps)済み。入手元は、この台帳に記載がない(ゲーム内の表示は、言の葉の森の曲と同じ作曲者のため、「Hareno」の1行にまとめている) |
| `lastBoss.mp3` | 凍てつく世界の果て | EigHt | ラスボス戦 | 軽量化(96kbps)済み。サンプルレートを 48→44.1kHz に再エンコード(2026-09-26) |
| `truth-intro.mp3` / `truth.mp3` | 星降る丘 LoopA / LoopB | zippy | 真相究明(A→B→Bのループ) | |
| `ending.mp3` | The Forgotten Girl 1Loop | zippy | エンディング | 軽量化(96kbps)済み |
| `talk.mp3` | ゆっくりしよ～まったりかわいいチルポップリラックス～ | にゃるぱかBGM工房 | 会話シーン(王座の間以外) | サンプルレートを 48→44.1kHz に再エンコード(2026-09-26) |
| `kotonoha.mp3` | 千年の内緒話 / A secret whispered for a millennium | Hareno(入手元: YouTube https://youtu.be/CGjkJKXqgHY) | 言の葉の森(入口・出題・解説・結果) | 元の48kHzのWAVを、44.1kHz・ステレオ・128kbpsのmp3に変換(約2分48秒。最後の約3秒でフェードアウトして終わる曲)。利用条件は、入手元のページを、制作者が2026-10-02に確認(クレジット表記: 載せる方針。教育での配信: 可。ゲームへの利用: 可。改変: 可) |

### 効果音(`src/assets/audio/se/`)

| ファイル | 元の素材名 | 作者・サイト(記載どおり) | 使用箇所 |
| --- | --- | --- | --- |
| `correct.mp3` | 正解4 | Springin' Sound Stock | 正解音 |
| `incorrect.mp3` | se_cancel15 | 効果音工房 | 不正解音 |
| `tap.mp3` | ボタン音17 | On-Jin ～音人～ | ボタンのタップ音 |
| `clear.mp3` | jingle_23 | Springin' Sound Stock | ステージクリア音(48→44.1kHz に再エンコード済み) |
| `growth.mp3` | holy1 | ポケットサウンド | マスコット成長音 |
| `subBossClear.mp3`(2026-10-22 に使用をやめた。`subBossPurify.mp3` に差し替え) | 衝撃 | Springin' Sound Stock | 小ボス撃破音(使用なし) |
| `lastBossClear.mp3` | hit02 | くらげ工匠 | ラスボス撃破音 |
| `pageUnlock.mp3` | VSQ_JINGLE_0067_Otoboke_01 | VSQ plus+ | 図鑑ページ解放音(現在はページ解放の通知は出していないが、素材は同梱。48→44.1kHz に再エンコード済み) |
| `bonus.mp3` | one23 | くらげ工匠 | 克服ボーナス音 |
| `roundEnd.mp3` | ジングル21(元のファイル名 jingle_21.mp3) | Springin' Sound Stock(入手元: https://www.springin.org/sound-stock/subcategory/jingle/ 規約: https://www.springin.org/sound-stock/guideline/) | 自由練習・苦手練習・言の葉の森のラウンドの終わりの音(2026-10-02 に追加)。加工: 元の48kHz・192kbpsのmp3を、44.1kHz・128kbpsに変換し、後半の無音を切って、0.4秒のフェードを足した(4.5秒)。利用条件は、入手元のページを、制作者が2026-10-02に確認(クレジット表記: 載せる方針(規約上は任意。書式は規約の例に合わせて「効果音: Springin' Sound Stock」)。教育での配信: 可。ゲームへの利用: 可。改変: 可)。規約の注意: 素材ファイルは目立たない配置で使う(ビルド後のファイル名は、ハッシュ付きの `roundEnd-<ハッシュ>.mp3`)。加工した音声そのものを素材として配布・販売しない(該当しない) |

### 確認してほしいこと(BGM・効果音 共通)

各配布元の**利用規約**で、次を確認してほしい(サイトごとに条件が違う)。

1. **利用範囲**: 学校の課題・発表・(将来の)一般公開のうち、どこまで使えるか。**商用利用**の可否(アプリが無料でも、公開・配布する場合の扱い)。
2. **クレジット表記**: 表記が必須か。必須なら、指定の書き方(作品名・作者名・URL)があるか。現状のゲーム内表記は「作曲者名 - サイト名」の形。
3. **改変**: ループ加工・軽量化(再エンコード)・音量調整をしてよいか。
4. **再配布**: 素材ファイルがアプリに同梱され、ユーザーが取り出せる形で配信されることを許しているか(「素材としての再配布」を禁止している規約がある)。
5. **利用報告・許可**: 事前の連絡や、利用報告が必要か。
6. **例外**: 「特定の用途(YouTube・ゲーム・アプリなど)は不可」といった制限がないか。

## B. 画像(すべて「生成AI・自作」のため、ライセンス欄は埋まっているが、最終確認が必要)

**ベース立ち絵(Stable Diffusion)と、そこからの差分(表情・浄化後など。Gemini の画像編集)を分けて記載している(2026-09-29 に区別を明確化)。**

| 素材 | ファイル(`src/assets/images/`) | 記載されている出典 | 確認してほしいこと |
| --- | --- | --- | --- |
| マスコット コト(通常。ベース立ち絵) | `mascot/base.webp` | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」) | 下の「生成AIの規約」 |
| マスコット コト 表情差分(喜び・しょんぼり・もぐもぐ・びっくり・眠そう) | `mascot/happy.webp`, `sad`, `eating`, `surprised`, `sleepy` | 生成AI(Geminiによる画像編集。元絵は上記) | 同上 |
| マスコット 本来の姿(コレット。ベース立ち絵) | `mascot/true.webp` | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」) | 同上 |
| 王様ヴェルバルト(取り憑かれた姿。ベース立ち絵) | `boss/lastboss-possessed.webp` | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」) | 同上 |
| 王様ヴェルバルト(浄化後の姿。差分) | `boss/lastboss-purified.webp` | 生成AI(Geminiによる画像編集。元絵は上記) | 同上 |
| 小ボス7人(浄化前。ベース立ち絵) | `boss/subboss-<エリアid>.webp`(7枚) | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」) | 同上 |
| 小ボス7人(浄化後の姿。差分) | `boss/subboss-<エリアid>-purified.webp`(7枚) | 生成AI(Geminiによる画像編集。元絵は上記) | 同上 |
| マスコット コト 成長アクセサリー7段階(差分) | `mascot/accessory-1.webp` 〜 `accessory-7.webp` | 生成AI(Geminiによる画像編集。元絵は上記) | 同上 |
| エリア背景8種(通常・荒れた姿) | `bg/<エリアid>.webp`(8枚。序章含む)、`bg/<エリアid>-corrupted.webp`(7枚。序章を除く) | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」、画像編集に Gemini) | 同上 |
| タイトルロゴ | `ui/title-logo.svg` | 「制作者による制作(SVG)」「オリジナル制作(制作者提供)」(2026-09-26 に、こちらで仮に記入した) | **実際の制作者・制作方法(手描き・ツール・AI か)に合っているか。合っていなければ書き換える** |
| エリア選択のカード背景(エリア背景を縮めたもの) | `bg-card/<エリアid>.webp`(8枚。`bg/<エリアid>.webp` を 512×286 に縮小) | 上の「エリア背景8種」の縮小版(新しい素材ではない) | 同上 |
| 旅人ユライ(言の葉の森の案内役。立ち絵) | `kotonoha/yurai.webp` | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)。背景除去・サイズ調整(512×512、高さ438px、上余白37px)は制作者が実施 | **要確認**(2026-10-01 に追加。ベースモデル・LoRA の利用条件の確認が済むまで。上の「生成AIの規約」) |
| 「言の葉の森」の背景(入口・出題・結果の画面の背景) | `bg/kotonoha_forest.webp` | 生成AI(Geminiによる画像生成) | **要確認**(2026-10-01 に追加。上の「生成AIの規約」のうち、Gemini の項) |
| 最初の画面(タッチして はじめる)の背景 | `title/title_bg.webp` | 生成AI(Geminiによる画像生成) | 上の「生成AIの規約」のうち、Gemini の項(2026-09-30 に、制作方法を記入) |
| 最初の画面(タッチして はじめる)の手を振るコト | `title/title_koto.webp` | 生成AI(Geminiによる画像生成)で作った画像に、制作者が透過処理と輪郭の手直しを加えたもの | 同上 |
| アプリアイコン(仮) | `public/icons/*`, `public/favicon.svg` | 自作(`scripts/generate-icons.py` で生成) | 仮素材。本番のアイコンに差し替えるときに、行も書き換える |

**生成AIの規約(判断が必要)**

- **Illustrious-XL v2.0**: 配布元のライセンス(利用条件・商用利用・生成物の扱い)を確認する。
- **LoRA「Chibi Lerasigma 228 style」**: 配布ページ(CivitAI などのモデルページ)の、ライセンスと**商用利用・生成物の公開の可否**、クレジット表記の要否を確認する。
- **Gemini(画像生成・画像編集)**: 利用規約上、生成物をアプリに使ってよいか(商用・公開)を確認する。
- **学習元データへの配慮**: 特定の作者・作品の画風に寄せた LoRA を使っている場合、学校の課題・公開で問題にならないか(学校・コンテストのガイドラインがあれば、それに従う)。
- ゲーム内のクレジット表記は、いまは「生成AI(…)によるオリジナル制作」。**記載どおりで足りるか**も、規約に合わせて確認する。

## C. フォント・コード(記載済み。参考)

| 素材 | 状況 |
| --- | --- |
| M PLUS Rounded 1c | SIL Open Font License 1.1。自由に使用・再配布可。**2026-09-26 に、使う文字だけを取り出した軽量版(`src/assets/fonts/`。`scripts/subset-fonts.py`)に変更した。OFL は部分的な取り出し(サブセット化)を許可している。** ゲーム内クレジットには、これまでどおりの記載のまま |
| QRコードのライブラリ | qrcode-generator(MIT License)、jsQR(Apache-2.0)。引き継ぎコードの QR 表示・読み取りに使用。ゲーム内クレジットには載せていない |
| ソースコード | MIT License(GitHub 公開済み)。React・Firebase SDK などの依存ライブラリは、それぞれのライセンス(MIT / Apache-2.0)。ゲーム内クレジットには載せていない(必要なら追加できる) |

## D. こちらで判断してほしい項目のまとめ

1. BGM 8曲・効果音 9種すべての、**配布元の規約の確認**(上の A の 1〜6)。特に、**再配布(アプリへの同梱)**と**商用利用**。
2. 規約で「クレジット表記が必須」の素材があれば、**指定の書き方**を教えてほしい(ASSET_CREDITS.md を、その書き方に合わせる)。
3. 規約で使えない素材があれば、**差し替え**(別の素材に置き換える)が必要。差し替えるときは、`src/assets/audio/` に同じファイル名で置き、ASSET_CREDITS.md の行を書き換える。
4. **生成AI画像**の規約(B)と、ゲーム内の表記が足りているか。
5. **タイトルロゴ**の制作者・制作方法(B の行が事実に合っているか)。
6. アプリアイコン(仮)を、本番のものに差し替える時期。
