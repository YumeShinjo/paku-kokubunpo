# 出典一覧(解説書への転記用)

パクっと国文法で使った、すべての素材・ツール・ライブラリの出典の一覧。`docs/ASSET_CREDITS.md`(素材管理表)から、`scripts/export-sources.py` で作った。
アプリの中では、クレジット画面の「くわしい出典」でも、同じ内容を見られる。

- 確認日: 2026-10-15(小ボス戦の曲と言の葉の森の曲は、制作者が 2026-10-14 に確認)
- 「要確認」は、配布ページ・規約が見つからなかった、または規約の本文を取得できなかったもの。URLや条件は、推測では書いていない
- 音声・画像のファイルそのものは、GitHub のリポジトリに入れていない(曲の二次配布の禁止のため。`.gitignore` で除外)
- タイトルロゴの画像ファイルは、素材として単体で配布しない(ソースコードの提出でも、アプリの一部としてのみ)

**自作証明**: 情報通信技術活用論 2026

## BGM(音楽)

| 名称 | 作者・提供元 | 入手元URL | ライセンス・条件 | 使った場所 |
| --- | --- | --- | --- | --- |
| 爽やかなアイリッシュ的なBGM_2 | OpenTracks / 鷹尾まさき(タカオマサキ) | https://opentracks.com/bgm/play1840.html (旧サイト名 DOVA-SYNDROME) | OpenTracksの音源利用ライセンス(https://opentracks.com/help/articles/license/ 。作曲者の条件は「サイト準拠」)に従う(2026-10-15に確認)。クレジット表記は不要。学校の課題・ゲームのBGMとして使える。音源を取り出しやすい形での配布、BGM素材としての配信は禁止。使ったときに作曲者へ知らせると励みになる(義務ではない)。曲名の「_2」は、同じページの2つ目のバージョン(2021年のリミックス)を指すと思われる(要確認) | タイトル・設定・図鑑・ランキング・通常のクレジット(title) |
| 始まりの村 A / 始まりの村 B | zippy | https://booth.pm/ja/items/6114595 | zippyのFANBOX「フリーBGM 利用規約」(2024-09-18公開。https://zippysound.fanbox.cc/posts/8574304)に従う。【フリーBGM】の表記がある曲のみ二次利用可(この曲に表記があることを、制作者が2026-10-15に確認)。ゲームへの利用可。フェード・カット・音量調整・エフェクトは可、キー変更・ピッチ変更は禁止。クレジットは任意(書式例「音楽：zippy（https://www.youtube.com/@zippysound）」)。教育機関での利用は、著作権法第35条に準ずる | エリア選択・ステージ選択(explore。A→B→Bのループ) |
| Prairie4(PerituneMaterial_Prairie4_loop) | PeriTune | https://peritune.com/blog/2019/03/01/prairie4/ | CC BY 4.0(表示が必要。曲名・作者・ライセンス名・入手元を示す。曲のページに記載)。PeriTuneの利用ページ(https://peritune.com/about/ を制作者が2026-10-15に確認)でも、商用利用可。クレジット表記は任意(「PeriTune」)。ゲームへの同梱は、無償の作品ならよい。曲ファイルの単体の販売・再配布は禁止 | 出題中(stage) |
| 【フリーBGM】禁忌の詠唱 ｜ ケルト戦闘曲 - Phantom Resonance | Hareno | https://youtu.be/AdWxKyHYQM0 | 入手元のページの利用条件を、制作者が2026-10-14に確認。無料・商用可・ゲーム制作可。禁止は、曲自体の二次配布・販売と、コンテンツID登録など曲の権利を主張する行為。それ以外は良識の範囲で自由。動画かチャンネルのリンクを載せてもらえると嬉しい(義務ではない)。ゲーム内の表記は「Hareno」。動画の概要欄のGoogle Driveのリンクからダウンロード | 小ボス戦(subBoss) |
| 凍てつく世界の果て | EigHt | https://www.youtube.com/watch?v=FZ2dtOAPe5U | EigHtの「利用規約」(2024-03-22公開・制作者が2026-10-15に確認): ゲームへの利用可。著作表記は任意(「音楽：EigHt」とチャンネルURL)。配信サービスへの登録・Content ID登録は禁止。加工は自由だが、完全なオリジナルとして公開・販売することは不可。教育機関での利用は、著作権法第35条に準ずる。要確認: 規約ページのURLと、チャンネルのURL(提示がない) | ラスボス戦(lastBoss) |
| 星降る丘 LoopA / LoopB | zippy | https://booth.pm/ja/items/6114577 | zippyのFANBOX「フリーBGM 利用規約」(2024-09-18公開。https://zippysound.fanbox.cc/posts/8574304)に従う。【フリーBGM】の表記がある曲のみ二次利用可(この曲に表記があることを、制作者が2026-10-15に確認)。ゲームへの利用可。フェード・カット・音量調整・エフェクトは可、キー変更・ピッチ変更は禁止。クレジットは任意(書式例「音楽：zippy（https://www.youtube.com/@zippysound）」)。教育機関での利用は、著作権法第35条に準ずる | 真相究明(truth。A→B→Bのループ) |
| The Forgotten Girl 1Loop | zippy | https://www.youtube.com/watch?v=ZBIg90S5vaI | zippyのFANBOX「フリーBGM 利用規約」(2024-09-18公開。https://zippysound.fanbox.cc/posts/8574304)に従う。【フリーBGM】の表記がある曲のみ二次利用可(この曲に表記があることを、制作者が2026-10-15に確認)。ゲームへの利用可。フェード・カット・音量調整・エフェクトは可、キー変更・ピッチ変更は禁止。クレジットは任意(書式例「音楽：zippy（https://www.youtube.com/@zippysound）」)。教育機関での利用は、著作権法第35条に準ずる。入手元は、YouTubeの公開ページ(BOOTHの配布ページは見つかっていない) | エンディング(ending) |
| ゆっくりしよ～まったりかわいいチルポップリラックス～ | にゃるぱかBGM工房 | https://booth.pm/ja/items/7674668 | 販売ページ(BOOTH。制作者が2026-10-15に確認)に、クレジット表記は不要、商用利用を含めて無料で使える、とある。禁止事項は公式サイトに書かれているとのことで、要確認。BOOTHでの題名は「ゆっくりしよ」(副題が台帳の名前と違う。同じ曲かどうかも要確認) | 会話シーン(王座の間以外の導入・小ボス撃破後・エリアクリア)(talk) |
| 千年の内緒話 / A secret whispered for a millennium | Hareno | https://youtu.be/CGjkJKXqgHY | 入手元のページの利用条件を、制作者が2026-10-02に確認(クレジット表記: 載せる方針。教育での配信: 可。ゲームへの利用: 可。改変: 可) | 言の葉の森の入口・出題・解説・結果(kotonoha)。加工: 元の48kHzのWAVを、44.1kHz・ステレオ・128kbpsのmp3に変換(約2分48秒。最後の約3秒でフェードアウトして終わる曲。ループは再生側で曲全体をくり返す) |

## 効果音

| 名称 | 作者・提供元 | 入手元URL | ライセンス・条件 | 使った場所 |
| --- | --- | --- | --- | --- |
| 正解4 | Springin' Sound Stock | https://www.springin.org/sound-stock/category/system/ | Springin'の利用規約(https://www.springin.org/sound-stock/guideline/ を制作者が2026-10-15に確認): 商用利用可。クレジット表記は任意(書式は「効果音: Springin' Sound Stock」)。加工してよい。加工した音も、素材として配布・販売しない。素材ファイルは目立たない配置で使う(ビルド後のファイル名はハッシュ付き)。個別の音声ファイルへの直リンクは禁止(そのため、入手元はカテゴリのページ) 。適用されるのは、Sound Stockのガイドライン(https://www.springin.org/sound-stock/guideline/)。Springin'アプリ本体の利用規約(授業などの教育目的の行為を許可制にしている条項を含む)は、効果音素材の規約ではないので、この台帳には含めない | 正解音(correct) |
| se_cancel15 | 効果音工房 | https://umipla.com/soundeffect/4388 | 効果音工房(umipla)の利用規約(https://umipla.com/利用規約/ ・制作者が2026-10-15に確認): 個人・サークルは、商用・非商用とも可。報告・クレジットは不要(トップページへのリンクは歓迎)。再配布は禁止。YouTubeなどのContent ID登録は禁止。法人の利用は、要連絡 | 不正解音(incorrect) |
| ボタン音17 | On-Jin ～音人～ | https://on-jin.com/sound/muci.php https://on-jin.com/ | On-Jinの利用規約(https://on-jin.com/kiyaku.php を制作者が2026-10-15に確認): 個人・サークル・学校での利用は、営利・非営利を問わず無料。クレジット表記は任意(サイト名「On-Jin ～音人～」とhttps://on-jin.com/ )。素材を取り出せる形での配布・販売、音声ファイルのURLへの直リンクは禁止。企業の営利利用は連絡が必要 | ボタンタップ音(tap) |
| jingle_23 | Springin' Sound Stock | https://www.springin.org/sound-stock/subcategory/jingle/ | Springin'の利用規約(https://www.springin.org/sound-stock/guideline/ を制作者が2026-10-15に確認): 商用利用可。クレジット表記は任意(書式は「効果音: Springin' Sound Stock」)。加工してよい。加工した音も、素材として配布・販売しない。素材ファイルは目立たない配置で使う(ビルド後のファイル名はハッシュ付き)。個別の音声ファイルへの直リンクは禁止(そのため、入手元はカテゴリのページ) 。適用されるのは、Sound Stockのガイドライン(https://www.springin.org/sound-stock/guideline/)。Springin'アプリ本体の利用規約(授業などの教育目的の行為を許可制にしている条項を含む)は、効果音素材の規約ではないので、この台帳には含めない | ステージクリア音(clear) |
| ジングル21(元のファイル名 jingle_21.mp3) | Springin' Sound Stock | https://www.springin.org/sound-stock/subcategory/jingle/ https://www.springin.org/sound-stock/guideline/ (規約) | 入手元のページの利用条件を、制作者が2026-10-02に確認(クレジット表記: 載せる方針。教育での配信: 可。ゲームへの利用: 可。改変: 可)。Springin'の規約: 素材ファイルは目立たない配置で使う(ビルド後のファイル名はハッシュ付き)。加工した音声そのものを素材として配布・販売しない(該当しない)。クレジット表記の書式は、規約の例に合わせて「効果音: Springin' Sound Stock」 。適用されるのは、Sound Stockのガイドライン(https://www.springin.org/sound-stock/guideline/)。Springin'アプリ本体の利用規約(授業などの教育目的の行為を許可制にしている条項を含む)は、効果音素材の規約ではないので、この台帳には含めない | 自由練習・苦手練習・言の葉の森のラウンドの終わりの音(roundEnd)。加工: 元の48kHz・192kbpsのmp3を、44.1kHz・128kbpsに変換し、後半の無音を切って、0.4秒のフェードを足した(4.5秒) |
| holy1 | ポケットサウンド | https://pocket-se.info/archives/412/ (https://pocket-se.info/) | ポケットサウンドの規約(https://pocket-se.info/rules/ ・制作者が2026-10-15に確認): クレジット表記か、サイトへのリンクが必須(教育機関でリンクが困難な場合は免除だが、書ける場合は書く)。書式は「効果音：ポケットサウンド – https://pocket-se.info/」。素材ファイルへの直リンクは禁止(素材のページへのリンクは問題なし)。素材の再配布・販売、素材単体のアップロードは禁止。商用利用可 | マスコット成長音(growth) |
| 衝撃 | Springin' Sound Stock | https://www.springin.org/sound-stock/category/battle/ | Springin'の利用規約(https://www.springin.org/sound-stock/guideline/ を制作者が2026-10-15に確認): 商用利用可。クレジット表記は任意(書式は「効果音: Springin' Sound Stock」)。加工してよい。加工した音も、素材として配布・販売しない。素材ファイルは目立たない配置で使う(ビルド後のファイル名はハッシュ付き)。個別の音声ファイルへの直リンクは禁止(そのため、入手元はカテゴリのページ)。「衝撃」は、戦闘カテゴリの「ダメージ」「破壊」の中にあると検索で確認したが、個別のページは未確認 。適用されるのは、Sound Stockのガイドライン(https://www.springin.org/sound-stock/guideline/)。Springin'アプリ本体の利用規約(授業などの教育目的の行為を許可制にしている条項を含む)は、効果音素材の規約ではないので、この台帳には含めない | 小ボス撃破音(subBossClear) |
| hit02 | くらげ工匠 | http://www.kurage-kosho.info/ (ファイル名: hit02.mp3。直リンクは禁止のため、サイトのトップのみ) | くらげ工匠の規約(制作者が2026-10-15に確認): 商用・非商用可、加工可、クレジットは不要(任意で「フリー効果音素材 くらげ工匠」)。再配布は禁止。素材ファイルへの直リンクが禁止されているので、mp3の直接URLは載せず、サイトのトップとファイル名だけを書く | ラスボス撃破音(lastBossClear) |
| VSQ_JINGLE_0067_Otoboke_01 | VSQ plus+ | https://vsq.co.jp/plus/wordpress/wp-content/uploads/2021/07/VSQ_JINGLE_0067_Otoboke_01.mp3 | VSQ plus+の規約(制作者が2026-10-15に確認): 商用・非商用可、ゲームへの利用可、クレジットは任意。素材をそのままの状態で、単体で頒布することは禁止 | 図鑑ページ解放音(pageUnlock) |
| one23 | くらげ工匠 | http://www.kurage-kosho.info/ (ファイル名: one23.mp3。直リンクは禁止のため、サイトのトップのみ) | くらげ工匠の規約(制作者が2026-10-15に確認): 商用・非商用可、加工可、クレジットは不要(任意で「フリー効果音素材 くらげ工匠」)。再配布は禁止。素材ファイルへの直リンクが禁止されているので、mp3の直接URLは載せず、サイトのトップとファイル名だけを書く | 克服ボーナス音(bonus) |

## 画像

| 名称 | 作者・提供元 | 入手元URL | ライセンス・条件 | 使った場所 |
| --- | --- | --- | --- | --- |
| マスコット コト(通常) | 生成AIによるオリジナル制作 | 生成AIモデルの行を参照 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | マスコットの表示全般(タイトル・ストーリー・正誤フィードバック・結果画面) |
| マスコット コト 表情差分(喜び・しょんぼり・もぐもぐ・びっくり・眠そう・combo・hungry) | 生成AIによる画像編集(ベース立ち絵から加工) | 生成AIモデルの行を参照 | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | マスコットの表示全般(正誤フィードバック・結果画面など。combo・hungry はホーム画面のコトの吹き出し) |
| マスコット 本来の姿(コレット) | 生成AIによるオリジナル制作 | 生成AIモデルの行を参照 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | ラスボス撃破後・エンディング結果 |
| 王様ヴェルバルト(取り憑かれた姿) | 生成AIによるオリジナル制作 | 生成AIモデルの行を参照 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | ラスボス戦のパネル、ストーリーの王様の台詞 |
| 王様ヴェルバルト(浄化後の姿) | 生成AIによる画像編集(ベース立ち絵から加工) | 生成AIモデルの行を参照 | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | ストーリーの王様(ヴェルバルト)の台詞 |
| 小ボス7人(メイ・レル・オンヴィン・ジョゼット・ネジラルド・サイラス・ニジュヴェール) | 生成AIによるオリジナル制作 | 生成AIモデルの行を参照 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | 小ボス戦のパネル、ストーリーの小ボスの台詞 |
| 小ボス7人 浄化後の姿 | 生成AIによる画像編集(ベース立ち絵から加工) | 生成AIモデルの行を参照 | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | 小ボス撃破後のストーリーの台詞、思い出の再生 |
| マスコット コト 成長アクセサリー7段階(ポーチ・腕輪・スカーフ・ブローチ・リボン・片眼鏡・王冠のかけら) | 生成AIによる画像編集(ベース立ち絵に加工) | 生成AIモデルの行を参照 | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | マスコットの成長演出(エリアクリアごとに1つずつ重ねて表示) |
| エリア背景8種(序章+エリア①〜⑦。通常の姿) | 生成AIによるオリジナル制作(制作者が加工) | 生成AIモデルの行を参照 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」、画像編集にGeminiを使用)によるオリジナル制作 | ストーリー・ステージ選択・出題画面の背景 |
| エリア背景7種 荒れた姿(エリア①〜⑦。関門(小ボス。王座の間だけラスボス)を撃破するまで) | 生成AIによるオリジナル制作(制作者が加工) | 生成AIモデルの行を参照 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」、画像編集にGeminiを使用)によるオリジナル制作 | ストーリー・ステージ選択・出題画面の背景 |
| 旅人ユライ(言の葉の森の案内役) | 生成AIによるオリジナル制作(背景除去・サイズ調整は制作者が実施) | 生成AIモデルの行を参照 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | 言の葉の森の立ち絵 |
| 「言の葉の森」の背景 | 生成AIによるオリジナル制作 | 生成AIモデルの行を参照 | 生成AI(Geminiによる画像生成)によるオリジナル制作 | 「言の葉の森」の背景(登録のみ。まだ使う画面はない) |
| 最初の画面(タッチして はじめる)の背景 | 生成AIによるオリジナル制作 | 生成AIモデルの行を参照 | 生成AI(Geminiによる画像生成)によるオリジナル制作 | 最初の画面の背景 |
| 最初の画面(タッチして はじめる)の手を振るコト | 生成AIによるオリジナル制作(制作者が透過処理・輪郭の手直しを加工) | 生成AIモデルの行を参照 | 生成AI(Geminiによる画像生成)によるオリジナル制作 | 最初の画面のコト(手を振る立ち絵) |
| タイトルロゴ「パクっと国文法 / NIBBLE GRAMMAR」 | 制作者による制作(SVG) | なし(制作者による制作。制作素材の行を参照) | オリジナル制作(制作者提供)。制作に使った素材・ツールの条件は、下の「制作素材」の行のとおり。ロゴの画像ファイルは、素材として単体で配布しない(ソースコードの提出でも、アプリの一部としてのみ) | タイトル画面(ファイルは src/assets/images/ui/title-logo.svg と src/assets/images/title/title-logo.svg の2つ。同名)。制作: Vサムネ・Photopeaで制作し、ICOON MONOのイラストを加工して使用。フォントは、あかずきんポップ・Monomaniac One |
| アプリアイコン(仮) | 自作(public/icons/* は scripts/generate-icons.py で生成。public/favicon.svg は、円と文字「言」だけの単純なSVGで、プロジェクトの初回コミットで作成) | なし(自作) | 自作のため制限なし | ホーム画面のアイコン |

## 画像をつくったAI・ツール

| 名称 | 作者・提供元 | 入手元URL | ライセンス・条件 | 使った場所 |
| --- | --- | --- | --- | --- |
| Illustrious-XL v2.0 | OnomaAI Research(画像のベース立ち絵・背景の生成に使用) | https://huggingface.co/OnomaAIResearch/Illustrious-XL-v2.0 | Hugging Faceのモデルページ(https://huggingface.co/OnomaAIResearch/Illustrious-XL-v2.0)のlicense欄は creativeml-openrail-m(2026-10-15に確認)。別のページの記載として、制作者が見たCivitAI側の表記は、Fair AI Public License 1.0-SD | 生成AIのイラストの元(コト・ボス・背景・ユライ) |
| Chibi Lerasigma 228 style(LoRA) | 作者 Ticovca(絵柄のLoRA。トリガーワード LeraDominator55) | https://civitai.com/models/966828/chibi-lerasigma-228-style (配布元のページ。削除されたという調査結果あり) https://civarchive.com/models/966828 (アーカイブ) | Fair AI Public License 1.0-SD(制作者が見たCivitAIのページの表記)。生成した画像(出力)には、権利を主張しない。禁止事項は、違法な利用、未成年者の搾取、人を害する虚偽情報の生成、医療アドバイスなどで、このゲームには該当しない。配布元のCivitAIのページは、2025-08-07に削除されたという調査結果がある。アーカイブ(civarchive)のページには、ライセンスの記載がなく、ベースモデルは Pony と表示されている | 生成AIのイラストの絵柄(コト・ボス・背景・ユライ) |
| sd-webui-forge-classic(Stable Diffusion WebUI) | Haoming02(Stable Diffusion WebUI Forge の派生。画像生成の画面ソフト) | https://github.com/Haoming02/sd-webui-forge-classic | AGPL-3.0(GitHubのリポジトリの表示・2026-10-15に確認)。これは、ソフトのライセンスで、生成した画像のライセンスではない | 生成AIのイラストの生成 |
| Gemini(画像生成・画像編集) | Google | https://support.google.com/gemini/answer/16625148?hl=ja (規約) https://gemini.google.com/ (サービス) | Geminiの「生成 AI の使用禁止に関するポリシー」(Gemini アプリ ヘルプ。台帳に記載する規約)。2026-10-15にページを開いたが、生成物の利用範囲・商用利用の可否・表示の義務は書かれておらず、禁止される利用(違法・危険な行為、プライバシーの侵害、不正・詐欺、児童への虐待や搾取など)だけが書かれている。生成物の扱いは、ページから案内されている「生成 AI の使用禁止に関するポリシー(https://policies.google.com/terms/generative-ai/use-policy)」と「サービス固有の追加規約(https://policies.google.com/terms/service-specific)」で決まる。要確認(ユーザー記入) | 表情差分・浄化後・アクセサリー・背景の編集、最初の画面・言の葉の森の背景の生成 |

## 制作素材(タイトルロゴの制作に使ったサービス・イラスト・フォント)

| 名称 | 作者・提供元 | 入手元URL | ライセンス・条件 | 使った場所 |
| --- | --- | --- | --- | --- |
| Vサムネ | Vサムネ(ロゴの制作に使ったサービス) | https://vsamune.com/ | Vサムネの規約(制作者が2026-10-15に確認): 報告・クレジットは不要。個人・法人を問わず無料。生成物は、商用・非商用を問わず利用可(ゲーム・アプリを含む)。テンプレート内の素材は、加工・改変が自由だが、素材そのものの配布・再配布は禁止。他のサイトの素材を使う場合は、そのサイトの規約に従う | タイトルロゴの制作(Photopeaと組み合わせて) |
| Photopea | Photopea(ロゴの制作に使ったサービス) | https://www.photopea.com/ | Photopeaの規約(制作者が2026-10-15に確認): 制作物は、すべて制作者のもの。販売可。Photopeaを使ったことの表記は不要 | タイトルロゴの制作(Vサムネと組み合わせて) |
| 肉球のアイコン3(ICOON MONO) | ICOON MONO(作者 TopeconHeroes) | https://icooon-mono.com/ https://icooon-mono.com/12783-%e8%82%89%e7%90%83%e3%81%ae%e3%82%a2%e3%82%a4%e3%82%b3%e3%83%b33/ | ICOON MONOの規約(制作者が2026-10-15に確認): 連絡不要、無料。WEBサイト・印刷物・アプリへの組み込みは可。加工も可。素材そのものの再配布は、無料・有料を問わず禁止。アイコンやフォントのジェネレーターの素材にすることも禁止。素材を販売するサイトでの販売も禁止。素材ファイルへの直リンクは控える。ロゴに使って商標登録することは控える | タイトルロゴのイラスト(加工して使用) |
| 葉っぱアイコン(ICOON MONO) | ICOON MONO(作者 TopeconHeroes) | https://icooon-mono.com/ https://icooon-mono.com/13591-%e8%91%89%e3%81%a3%e3%81%b1%e3%82%a2%e3%82%a4%e3%82%b3%e3%83%b3/ | ICOON MONOの規約(制作者が2026-10-15に確認): 連絡不要、無料。WEBサイト・印刷物・アプリへの組み込みは可。加工も可。素材そのものの再配布は、無料・有料を問わず禁止。アイコンやフォントのジェネレーターの素材にすることも禁止。素材を販売するサイトでの販売も禁止。素材ファイルへの直リンクは控える。ロゴに使って商標登録することは控える | タイトルロゴのイラスト(加工して使用) |
| あかずきんポップ | FLOPDESIGN(フロップデザイン)。M+ FONTSの派生フォント | https://flopdesign.booth.pm/items/1748058 | フリーフォント(商用・非商用可、プログラムへの埋め込み可。制作者が2026-10-15に確認。作者のBOOTHの記載)。Copyright(c) 2018 M+ FONTS PROJECT(元のM+ FONTSのライセンスに準ずる)。クレジットは必須ではないが、作者が希望する書式「フォント：あかずきんポップ フリーダウンロード：https://flopdesign.booth.pm/items/1748058」を、くわしい出典に載せる。要確認: このBOOTHのページは、2026-10-15に開くと、オーナー以外には非公開と表示される | タイトルロゴのフォント |
| M+ FONTS(あかずきんポップの元のフォント) | M+ FONTS PROJECT(デザイン: Coji Morishita) | https://mplusfonts.github.io/ | SIL Open Font License(https://mplusfonts.github.io/ に「released under the SIL Open Font License」とある。2026-10-15に確認。ページには、バージョンの表記がない。1.1と見られるが、要確認)。ライセンス全文: https://scripts.sil.org/OFL_web | あかずきんポップの元になったフォント |
| Monomaniac One | Maniackers Design(Google Fonts) | https://fonts.google.com/specimen/Monomaniac+One | SIL Open Font License, Version 1.1(Google Fontsの配布元のOFL.txt・2026-10-15に確認)。Copyright 2020 The Monomaniac Project Authors(https://github.com/ManiackersDesign/monomaniac) | タイトルロゴのフォント |

## フォント

| 名称 | 作者・提供元 | 入手元URL | ライセンス・条件 | 使った場所 |
| --- | --- | --- | --- | --- |
| M PLUS Rounded 1c | Google Fonts(npmパッケージ @fontsource/m-plus-rounded-1c から同梱) | https://fontsource.org/fonts/m-plus-rounded-1c (Google Fonts版を、npmパッケージ @fontsource/m-plus-rounded-1c 5.3.0 で同梱。著作権表記: Copyright 2016 The Rounded M+ Project Authors) | SIL Open Font License 1.1(自由に使用・再配布可) | アプリ全体の文字 |

## ライブラリ・アイコン

| 名称 | 作者・提供元 | 入手元URL | ライセンス・条件 | 使った場所 |
| --- | --- | --- | --- | --- |
| lucide-react 1.48.0 | Lucide Icons and Contributors(アイコン) | https://lucide.dev https://github.com/lucide-icons/lucide | ISC License(著作権表示と許諾文を残せば、使用・改変・再配布できる) | 画面のアイコン |
| qrcode-generator 2.0.4 | Kazuhiko Arase | https://github.com/kazuhikoarase/qrcode-generator | MIT License | 引き継ぎコードのQR表示 |
| jsQR 1.4.0 | cozmo(Cosmo Wolfe) | https://github.com/cozmo/jsQR | Apache License 2.0 | 引き継ぎコードのQR読み取り |
| React / React DOM 18.3.1 | Meta(Facebook) | https://react.dev https://github.com/facebook/react | MIT License | アプリ全体の画面 |
| Zustand 5.0.15 | Paul Henschel ほか(pmndrs) | https://github.com/pmndrs/zustand | MIT License | 進行状況などの状態の保存 |
| Firebase JS SDK 11.10.0 | Google | https://firebase.google.com/ https://github.com/firebase/firebase-js-sdk | Apache License 2.0 | ランキング・引き継ぎ(Firebase) |

## クレジットの表記が必要・希望されている素材

- 効果音「holy1」(ポケットサウンド): **規約で必要**。「効果音：ポケットサウンド – https://pocket-se.info/」(教育機関でリンクが困難な場合は免除だが、書ける場合は書く。規約 https://pocket-se.info/rules/)
- BGM「Prairie4」(PeriTune): **規約(CC BY 4.0)で必要**。曲名・作者・ライセンス名・入手元を示す(https://peritune.com/blog/2019/03/01/prairie4/)
- ロゴのフォント「あかずきんポップ」: **作者の希望**(必須ではない)。「フォント：あかずきんポップ フリーダウンロード：https://flopdesign.booth.pm/items/1748058」
- 上の3つは、アプリの「くわしい出典」に載せている。ゲーム内のクレジット画面には、ポケットサウンドの1行だけを載せている

## 要確認の一覧

| 名称 | 要確認の内容 |
| --- | --- |
| 爽やかなアイリッシュ的なBGM_2 | ライセンス・条件 |
| 凍てつく世界の果て | ライセンス・条件 |
| ゆっくりしよ～まったりかわいいチルポップリラックス～ | ライセンス・条件 |
| Gemini(画像生成・画像編集) | ライセンス・条件 |
| あかずきんポップ | ライセンス・条件 |
| M+ FONTS(あかずきんポップの元のフォント) | ライセンス・条件 |
