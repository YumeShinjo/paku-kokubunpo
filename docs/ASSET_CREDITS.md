# 素材管理表

10章の方針に基づき、使用する画像・BGM・SEの出典を一元管理する。
提出物への同梱、および減点50(出典未記載)を避けるための必須ドキュメント。
実素材を追加するたびに1行ずつ追記していく。

**ゲーム内クレジットとの連動**: この表は、ビルド時にゲーム内の「クレジット」画面へそのまま読み込まれる。
表に1行足せば(`npm run build` のあと)ゲーム内にも出る。列は次の6つを、この順で `|` 区切りで書くこと(6つ目の「入手元URL」は、ゲーム内のクレジットには出ず、「くわしい出典」のページに出る)。名前などに `|` を含めたいときは、全角の `｜` を使う。
先頭が「(例)」の行と、見出し・区切りの行は表示されない。種別は「画像」「BGM」「SE」「フォント」のどれかにすると、ゲーム内のクレジットにまとまって表示される。「ライブラリ」「生成AIモデル」は、ゲーム内のクレジットには出さず、「くわしい出典」のページにだけ出る。URLが分からないものは、推測で書かず「要確認」と書く。

| 素材名 | 種別(画像/BGM/SE) | 出典・生成方法 | ライセンス | 使用箇所 | 入手元URL |
| --- | --- | --- | --- | --- | --- |
| (例)相棒_通常.png | 画像 | 生成AIツール名を記載 | 利用規約確認済み | マスコット全般 | 入手元のURL |
| マスコット コト(通常) | 画像 | 生成AIによるオリジナル制作 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | マスコットの表示全般(タイトル・ストーリー・正誤フィードバック・結果画面) | 生成AIモデルの行を参照 |
| マスコット コト 表情差分(喜び・しょんぼり・もぐもぐ・びっくり・眠そう・combo・hungry) | 画像 | 生成AIによる画像編集(ベース立ち絵から加工) | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | マスコットの表示全般(正誤フィードバック・結果画面など。combo・hungry はホーム画面のコトの吹き出し) | 生成AIモデルの行を参照 |
| マスコット 本来の姿(コレット) | 画像 | 生成AIによるオリジナル制作 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | ラスボス撃破後・エンディング結果 | 生成AIモデルの行を参照 |
| 王様ヴェルバルト(取り憑かれた姿) | 画像 | 生成AIによるオリジナル制作 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | ラスボス戦のパネル、ストーリーの王様の台詞 | 生成AIモデルの行を参照 |
| 王様ヴェルバルト(浄化後の姿) | 画像 | 生成AIによる画像編集(ベース立ち絵から加工) | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | ストーリーの王様(ヴェルバルト)の台詞 | 生成AIモデルの行を参照 |
| 小ボス7人(メイ・レル・オンヴィン・ジョゼット・ネジラルド・サイラス・ニジュヴェール) | 画像 | 生成AIによるオリジナル制作 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | 小ボス戦のパネル、ストーリーの小ボスの台詞 | 生成AIモデルの行を参照 |
| 小ボス7人 浄化後の姿 | 画像 | 生成AIによる画像編集(ベース立ち絵から加工) | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | 小ボス撃破後のストーリーの台詞、思い出の再生 | 生成AIモデルの行を参照 |
| マスコット コト 成長アクセサリー7段階(ポーチ・腕輪・スカーフ・ブローチ・リボン・片眼鏡・王冠のかけら) | 画像 | 生成AIによる画像編集(ベース立ち絵に加工) | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | マスコットの成長演出(エリアクリアごとに1つずつ重ねて表示) | 生成AIモデルの行を参照 |
| エリア背景8種(序章+エリア①〜⑦。通常の姿) | 画像 | 生成AIによるオリジナル制作(制作者が加工) | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」、画像編集にGeminiを使用)によるオリジナル制作 | ストーリー・ステージ選択・出題画面の背景 | 生成AIモデルの行を参照 |
| エリア背景7種 荒れた姿(エリア①〜⑦。関門(小ボス。王座の間だけラスボス)を撃破するまで) | 画像 | 生成AIによるオリジナル制作(制作者が加工) | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」、画像編集にGeminiを使用)によるオリジナル制作 | ストーリー・ステージ選択・出題画面の背景 | 生成AIモデルの行を参照 |
| 旅人ユライ(言の葉の森の案内役) | 画像 | 生成AIによるオリジナル制作(背景除去・サイズ調整は制作者が実施) | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | 言の葉の森の立ち絵 | 生成AIモデルの行を参照 |
| 「言の葉の森」の背景 | 画像 | 生成AIによるオリジナル制作 | 生成AI(Geminiによる画像生成)によるオリジナル制作 | 「言の葉の森」の背景(登録のみ。まだ使う画面はない) | 生成AIモデルの行を参照 |
| 最初の画面(タッチして はじめる)の背景 | 画像 | 生成AIによるオリジナル制作 | 生成AI(Geminiによる画像生成)によるオリジナル制作 | 最初の画面の背景 | 生成AIモデルの行を参照 |
| 最初の画面(タッチして はじめる)の手を振るコト | 画像 | 生成AIによるオリジナル制作(制作者が透過処理・輪郭の手直しを加工) | 生成AI(Geminiによる画像生成)によるオリジナル制作 | 最初の画面のコト(手を振る立ち絵) | 生成AIモデルの行を参照 |
| タイトルロゴ「パクっと国文法 / NIBBLE GRAMMAR」 | 画像 | 制作者による制作(SVG) | オリジナル制作(制作者提供) | タイトル画面(ファイルは src/assets/images/ui/title-logo.svg と src/assets/images/title/title-logo.svg の2つ。同名) | なし(制作者による制作。制作方法は要確認) |
| アプリアイコン(仮) | 画像 | 自作(public/icons/* は scripts/generate-icons.py で生成。public/favicon.svg は、円と文字「言」だけの単純なSVGで、プロジェクトの初回コミットで作成) | 自作のため制限なし | ホーム画面のアイコン | なし(自作) |
| M PLUS Rounded 1c | フォント | Google Fonts(npmパッケージ @fontsource/m-plus-rounded-1c から同梱) | SIL Open Font License 1.1(自由に使用・再配布可) | アプリ全体の文字 | https://fontsource.org/fonts/m-plus-rounded-1c(Google Fonts版を、npmパッケージ @fontsource/m-plus-rounded-1c 5.3.0 で同梱。著作権表記: Copyright 2016 The Rounded M+ Project Authors) |
| 爽やかなアイリッシュ的なBGM_2 | BGM | OpenTracks / 鷹尾まさき(タカオマサキ) | OpenTracksの音源利用ライセンス(https://opentracks.com/help/articles/license/ 。作曲者の条件は「サイト準拠」)に従う(2026-10-15に確認)。クレジット表記は不要。学校の課題・ゲームのBGMとして使える。音源を取り出しやすい形での配布、BGM素材としての配信は禁止。使ったときに作曲者へ知らせると励みになる(義務ではない)。曲名の「_2」は、同じページの2つ目のバージョン(2021年のリミックス)を指すと思われる(要確認) | タイトル・設定・図鑑・ランキング・通常のクレジット(title) | https://opentracks.com/bgm/play1840.html(旧サイト名 DOVA-SYNDROME。https://dova-s.jp/bgm/play1840.html は、ここに転送される) |
| 始まりの村 A / 始まりの村 B | BGM | zippy | BOOTHの【フリーBGM】(無料)。利用規約は、販売ページに書かれたFANBOXの投稿(https://zippysound.fanbox.cc/posts/8574304)にあるが、本文を取得できず、条件は要確認 | エリア選択・ステージ選択(explore。A→B→Bのループ) | https://booth.pm/ja/items/6114595 |
| Prairie4(PerituneMaterial_Prairie4_loop) | BGM | PeriTune | CC BY 4.0(表示が必要。曲名・作者・ライセンス名・入手元を示す。曲のページに記載)。PeriTuneの利用ページ(https://peritune.com/about/ を制作者が2026-10-15に確認)でも、商用利用可。クレジット表記は任意(「PeriTune」)。ゲームへの同梱は、無償の作品ならよい。曲ファイルの単体の販売・再配布は禁止 | 出題中(stage) | https://peritune.com/blog/2019/03/01/prairie4/ |
| 【フリーBGM】禁忌の詠唱 ｜ ケルト戦闘曲 - Phantom Resonance | BGM | Hareno | 入手元のページの利用条件を、制作者が2026-10-14に確認。無料・商用可・ゲーム制作可。禁止は、曲自体の二次配布・販売と、コンテンツID登録など曲の権利を主張する行為。それ以外は良識の範囲で自由。動画かチャンネルのリンクを載せてもらえると嬉しい(義務ではない)。ゲーム内の表記は「Hareno」。動画の概要欄のGoogle Driveのリンクからダウンロード | 小ボス戦(subBoss) | https://youtu.be/AdWxKyHYQM0 |
| 凍てつく世界の果て | BGM | EigHt | 要確認(曲の公開ページ=YouTubeの動画は、検索で見つけたが、概要欄の利用条件を取得できなかった。チャンネル名が「EigHt」であることも、あわせて確認が必要) | ラスボス戦(lastBoss) | https://www.youtube.com/watch?v=FZ2dtOAPe5U |
| 星降る丘 LoopA / LoopB | BGM | zippy | BOOTHの【フリーBGM】(無料)。利用規約は、販売ページに書かれたFANBOXの投稿(https://zippysound.fanbox.cc/posts/8574304)にあるが、本文を取得できず、条件は要確認 | 真相究明(truth。A→B→Bのループ) | https://booth.pm/ja/items/6114577 |
| The Forgotten Girl 1Loop | BGM | zippy | 要確認(YouTubeの公開ページは見つけたが、BOOTHの配布ページは見つかっていない。利用規約は、zippyのFANBOXの投稿に書かれていると思われるが、本文を取得できず、条件は要確認) | エンディング(ending) | https://www.youtube.com/watch?v=ZBIg90S5vaI |
| ゆっくりしよ～まったりかわいいチルポップリラックス～ | BGM | にゃるぱかBGM工房 | 販売ページ(BOOTH。制作者が2026-10-15に確認)に、クレジット表記は不要、商用利用を含めて無料で使える、とある。禁止事項は公式サイトに書かれているとのことで、要確認。BOOTHでの題名は「ゆっくりしよ」(副題が台帳の名前と違う。同じ曲かどうかも要確認) | 会話シーン(王座の間以外の導入・小ボス撃破後・エリアクリア)(talk) | https://booth.pm/ja/items/7674668 |
| 千年の内緒話 / A secret whispered for a millennium | BGM | Hareno | 入手元のページの利用条件を、制作者が2026-10-02に確認(クレジット表記: 載せる方針。教育での配信: 可。ゲームへの利用: 可。改変: 可) | 言の葉の森の入口・出題・解説・結果(kotonoha)。加工: 元の48kHzのWAVを、44.1kHz・ステレオ・128kbpsのmp3に変換(約2分48秒。最後の約3秒でフェードアウトして終わる曲。ループは再生側で曲全体をくり返す) | https://youtu.be/CGjkJKXqgHY |
| 正解4 | SE | Springin' Sound Stock | Springin'の利用規約(https://www.springin.org/sound-stock/guideline/ を制作者が2026-10-15に確認): 商用利用可。クレジット表記は任意(書式は「効果音: Springin' Sound Stock」)。加工してよい。加工した音も、素材として配布・販売しない。素材ファイルは目立たない配置で使う(ビルド後のファイル名はハッシュ付き)。個別の音声ファイルへの直リンクは禁止(そのため、入手元はカテゴリのページ) | 正解音(correct) | https://www.springin.org/sound-stock/category/system/ |
| se_cancel15 | SE | 効果音工房 | 要確認(「効果音工房」の配布ページ・利用規約が、検索で見つからなかった) | 不正解音(incorrect) | 要確認 |
| ボタン音17 | SE | On-Jin ～音人～ | On-Jinの利用規約(https://on-jin.com/kiyaku.php を制作者が2026-10-15に確認): 個人・サークル・学校での利用は、営利・非営利を問わず無料。クレジット表記は任意(サイト名「On-Jin ～音人～」とhttps://on-jin.com/ )。素材を取り出せる形での配布・販売、音声ファイルのURLへの直リンクは禁止。企業の営利利用は連絡が必要 | ボタンタップ音(tap) | https://on-jin.com/sound/muci.php(サイト: https://on-jin.com/) |
| jingle_23 | SE | Springin' Sound Stock | Springin'の利用規約(https://www.springin.org/sound-stock/guideline/ を制作者が2026-10-15に確認): 商用利用可。クレジット表記は任意(書式は「効果音: Springin' Sound Stock」)。加工してよい。加工した音も、素材として配布・販売しない。素材ファイルは目立たない配置で使う(ビルド後のファイル名はハッシュ付き)。個別の音声ファイルへの直リンクは禁止(そのため、入手元はカテゴリのページ) | ステージクリア音(clear) | https://www.springin.org/sound-stock/subcategory/jingle/ |
| ジングル21(元のファイル名 jingle_21.mp3) | SE | Springin' Sound Stock | 入手元のページの利用条件を、制作者が2026-10-02に確認(クレジット表記: 載せる方針。教育での配信: 可。ゲームへの利用: 可。改変: 可)。Springin'の規約: 素材ファイルは目立たない配置で使う(ビルド後のファイル名はハッシュ付き)。加工した音声そのものを素材として配布・販売しない(該当しない)。クレジット表記の書式は、規約の例に合わせて「効果音: Springin' Sound Stock」 | 自由練習・苦手練習・言の葉の森のラウンドの終わりの音(roundEnd)。加工: 元の48kHz・192kbpsのmp3を、44.1kHz・128kbpsに変換し、後半の無音を切って、0.4秒のフェードを足した(4.5秒) | https://www.springin.org/sound-stock/subcategory/jingle/ |
| holy1 | SE | ポケットサウンド | ポケットサウンドの規約(https://pocket-se.info/rules/ を制作者が2026-10-15に確認): クレジット表記が必須(「効果音：ポケットサウンド – https://pocket-se.info/」の形、またはサイトへのリンク)。表記できないときは有償。商用利用可。素材の再配布・販売、素材単体のアップロード、音声ファイルへの直リンクは禁止 | マスコット成長音(growth) | 要確認(この素材のページが、検索で見つからなかった。サイト: https://pocket-se.info/) |
| 衝撃 | SE | Springin' Sound Stock | Springin'の利用規約(https://www.springin.org/sound-stock/guideline/ を制作者が2026-10-15に確認): 商用利用可。クレジット表記は任意(書式は「効果音: Springin' Sound Stock」)。加工してよい。加工した音も、素材として配布・販売しない。素材ファイルは目立たない配置で使う(ビルド後のファイル名はハッシュ付き)。個別の音声ファイルへの直リンクは禁止(そのため、入手元はカテゴリのページ)。「衝撃」は、戦闘カテゴリの「ダメージ」「破壊」の中にあると検索で確認したが、個別のページは未確認 | 小ボス撃破音(subBossClear) | https://www.springin.org/sound-stock/category/battle/ |
| hit02 | SE | くらげ工匠 | 要確認(「くらげ工匠」のサイトに接続できず、素材のページも、検索で見つからなかった) | ラスボス撃破音(lastBossClear) | 要確認 |
| VSQ_JINGLE_0067_Otoboke_01 | SE | VSQ plus+ | 要確認(「VSQ plus+」の配布ページ・利用規約が、検索で見つからなかった) | 図鑑ページ解放音(pageUnlock) | 要確認 |
| one23 | SE | くらげ工匠 | 要確認(「くらげ工匠」のサイトに接続できず、素材のページも、検索で見つからなかった) | 克服ボーナス音(bonus) | 要確認 |
| Illustrious-XL v2.0 | 生成AIモデル | OnomaAI Research(画像のベース立ち絵・背景の生成に使用) | Hugging Faceのモデルページのlicense欄は creativeml-openrail-m(制作者が2026-10-15に確認)。生成物の扱いなど、利用条件の詳細は要確認 | 生成AIのイラストの元(コト・ボス・背景・ユライ) | https://huggingface.co/OnomaAIResearch/Illustrious-XL-v2.0 |
| Chibi Lerasigma 228 style(LoRA) | 生成AIモデル | 作者 Ticovca(絵柄のLoRA。トリガーワード LeraDominator55) | 要確認(配布元のCivitAIのページは、2025-08-07に削除されている。アーカイブのページには、ライセンス・商用利用の記載がなく、ベースモデルは Pony と表示されている。台帳の「Illustrious-XL上で使用」との関係も要確認) | 生成AIのイラストの絵柄(コト・ボス・背景・ユライ) | https://civarchive.com/models/966828(アーカイブ) |
| Stable Diffusion(画像生成の環境) | 生成AIモデル | 要確認(使用した画面ソフト・バージョンが台帳にない) | 要確認 | 生成AIのイラストの生成 | 要確認 |
| Gemini(画像生成・画像編集) | 生成AIモデル | Google | 要確認(生成物の利用条件を、制作者が確認する) | 表情差分・浄化後・アクセサリー・背景の編集、最初の画面・言の葉の森の背景の生成 | https://gemini.google.com/(サービス名のみ。生成物の利用規約のURLは要確認) |
| lucide-react 1.48.0 | ライブラリ | Lucide Icons and Contributors(アイコン) | ISC License(著作権表示と許諾文を残せば、使用・改変・再配布できる) | 画面のアイコン | https://lucide.dev(ソース: https://github.com/lucide-icons/lucide) |
| qrcode-generator 2.0.4 | ライブラリ | Kazuhiko Arase | MIT License | 引き継ぎコードのQR表示 | https://github.com/kazuhikoarase/qrcode-generator |
| jsQR 1.4.0 | ライブラリ | cozmo(Cosmo Wolfe) | Apache License 2.0 | 引き継ぎコードのQR読み取り | https://github.com/cozmo/jsQR |
| React / React DOM 18.3.1 | ライブラリ | Meta(Facebook) | MIT License | アプリ全体の画面 | https://react.dev(ソース: https://github.com/facebook/react) |
| Zustand 5.0.15 | ライブラリ | Paul Henschel ほか(pmndrs) | MIT License | 進行状況などの状態の保存 | https://github.com/pmndrs/zustand |
| Firebase JS SDK 11.10.0 | ライブラリ | Google | Apache License 2.0 | ランキング・引き継ぎ(Firebase) | https://firebase.google.com/(ソース: https://github.com/firebase/firebase-js-sdk) |

**ライセンス確認の棚卸し**: 「要確認」のままの素材と、確認してほしい点は [ASSET_LICENSE_CHECKLIST.md](ASSET_LICENSE_CHECKLIST.md) にまとめてある。

**仮素材について**: アプリアイコンは仮素材(本番素材に差し替えたら、該当の行を書き換えるか削除する)。BGM・効果音は本番素材に差し替え済み(効果音は、いまも置かれていない種類があれば合成ビープ音で鳴る)。
