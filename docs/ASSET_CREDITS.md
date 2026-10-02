# 素材管理表

10章の方針に基づき、使用する画像・BGM・SEの出典を一元管理する。
提出物への同梱、および減点50(出典未記載)を避けるための必須ドキュメント。
実素材を追加するたびに1行ずつ追記していく。

**ゲーム内クレジットとの連動**: この表は、ビルド時にゲーム内の「クレジット」画面へそのまま読み込まれる。
表に1行足せば(`npm run build` のあと)ゲーム内にも出る。列は次の5つを、この順で `|` 区切りで書くこと。
先頭が「(例)」の行と、見出し・区切りの行は表示されない。種別は「画像」「BGM」「SE」のどれかにすると、まとまって表示される。

| 素材名 | 種別(画像/BGM/SE) | 出典・生成方法 | ライセンス | 使用箇所 |
| --- | --- | --- | --- | --- |
| (例)相棒_通常.png | 画像 | 生成AIツール名を記載 | 利用規約確認済み | マスコット全般 |
| マスコット コト(通常) | 画像 | 生成AIによるオリジナル制作 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | マスコットの表示全般(タイトル・ストーリー・正誤フィードバック・結果画面) |
| マスコット コト 表情差分(喜び・しょんぼり・もぐもぐ・びっくり・眠そう) | 画像 | 生成AIによる画像編集(ベース立ち絵から加工) | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | マスコットの表示全般(正誤フィードバック・結果画面など) |
| マスコット 本来の姿(コレット) | 画像 | 生成AIによるオリジナル制作 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | ラスボス撃破後・エンディング結果 |
| 王様ヴェルバルト(取り憑かれた姿) | 画像 | 生成AIによるオリジナル制作 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | ラスボス戦のパネル、ストーリーの王様の台詞 |
| 王様ヴェルバルト(浄化後の姿) | 画像 | 生成AIによる画像編集(ベース立ち絵から加工) | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | ストーリーの王様(ヴェルバルト)の台詞 |
| 小ボス7人(メイ・レル・オンヴィン・ジョゼット・ネジラルド・サイラス・ニジュヴェール) | 画像 | 生成AIによるオリジナル制作 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | 小ボス戦のパネル、ストーリーの小ボスの台詞 |
| 小ボス7人 浄化後の姿 | 画像 | 生成AIによる画像編集(ベース立ち絵から加工) | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | 小ボス撃破後のストーリーの台詞、思い出の再生 |
| マスコット コト 成長アクセサリー7段階(ポーチ・腕輪・スカーフ・ブローチ・リボン・片眼鏡・王冠のかけら) | 画像 | 生成AIによる画像編集(ベース立ち絵に加工) | 生成AI(Geminiによる画像編集。元絵はStable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | マスコットの成長演出(エリアクリアごとに1つずつ重ねて表示) |
| エリア背景8種(序章+エリア①〜⑦。通常の姿) | 画像 | 生成AIによるオリジナル制作(制作者が加工) | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」、画像編集にGeminiを使用)によるオリジナル制作 | ストーリー・ステージ選択・出題画面の背景 |
| エリア背景7種 荒れた姿(エリア①〜⑦。関門(小ボス。王座の間だけラスボス)を撃破するまで) | 画像 | 生成AIによるオリジナル制作(制作者が加工) | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」、画像編集にGeminiを使用)によるオリジナル制作 | ストーリー・ステージ選択・出題画面の背景 |
| 旅人ユライ(言の葉の森の案内役) | 画像 | 生成AIによるオリジナル制作(背景除去・サイズ調整は制作者が実施) | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA「Chibi Lerasigma 228 style」)によるオリジナル制作 | 言の葉の森の立ち絵 |
| 「言の葉の森」の背景 | 画像 | 生成AIによるオリジナル制作 | 生成AI(Geminiによる画像生成)によるオリジナル制作 | 「言の葉の森」の背景(登録のみ。まだ使う画面はない) |
| 最初の画面(タッチして はじめる)の背景 | 画像 | 生成AIによるオリジナル制作 | 生成AI(Geminiによる画像生成)によるオリジナル制作 | 最初の画面の背景 |
| 最初の画面(タッチして はじめる)の手を振るコト | 画像 | 生成AIによるオリジナル制作(制作者が透過処理・輪郭の手直しを加工) | 生成AI(Geminiによる画像生成)によるオリジナル制作 | 最初の画面のコト(手を振る立ち絵) |
| タイトルロゴ「パクっと国文法 / NIBBLE GRAMMAR」 | 画像 | 制作者による制作(SVG) | オリジナル制作(制作者提供) | タイトル画面 |
| アプリアイコン(仮) | 画像 | 自作(scripts/generate-icons.py で生成) | 自作のため制限なし | ホーム画面のアイコン |
| M PLUS Rounded 1c | フォント | Google Fonts(npmパッケージ @fontsource/m-plus-rounded-1c から同梱) | SIL Open Font License 1.1(自由に使用・再配布可) | アプリ全体の文字 |
| 爽やかなアイリッシュ的なBGM_2 | BGM | OpenTracks / 鷹尾まさき(タカオマサキ) | 配布元の利用規約に従う(利用条件は要確認) | タイトル・設定・図鑑・ランキング・通常のクレジット(title) |
| 始まりの村 A / 始まりの村 B | BGM | zippy | 配布元の利用規約に従う(利用条件は要確認) | エリア選択・ステージ選択(explore。A→B→Bのループ) |
| Prairie4(PerituneMaterial_Prairie4_loop) | BGM | PeriTune | 配布元の利用規約に従う(利用条件は要確認) | 出題中(stage) |
| 禁忌の詠唱 - Phantom Resonance | BGM | Hareno | 配布元の利用規約に従う(利用条件は要確認) | 小ボス戦(subBoss) |
| 凍てつく世界の果て | BGM | EigHt | 配布元の利用規約に従う(利用条件は要確認) | ラスボス戦(lastBoss) |
| 星降る丘 LoopA / LoopB | BGM | zippy | 配布元の利用規約に従う(利用条件は要確認) | 真相究明(truth。A→B→Bのループ) |
| The Forgotten Girl 1Loop | BGM | zippy | 配布元の利用規約に従う(利用条件は要確認) | エンディング(ending) |
| ゆっくりしよ～まったりかわいいチルポップリラックス～ | BGM | にゃるぱかBGM工房 | 配布元の利用規約に従う(利用条件は要確認) | 会話シーン(王座の間以外の導入・小ボス撃破後・エリアクリア)(talk) |
| 千年の内緒話 / A secret whispered for a millennium(入手元: YouTube https://youtu.be/CGjkJKXqgHY。ゲーム内の表示は、小ボス戦の曲と同じ作曲者のため、「Hareno」の1行にまとめている。小ボス戦の曲の入手元は、台帳に記載がない) | BGM | Hareno | 入手元のページの利用条件を、制作者が2026-10-02に確認(クレジット表記: 載せる方針。教育での配信: 可。ゲームへの利用: 可。改変: 可) | 言の葉の森の入口・出題・解説・結果(kotonoha)。加工: 元の48kHzのWAVを、44.1kHz・ステレオ・128kbpsのmp3に変換(約2分48秒。最後の約3秒でフェードアウトして終わる曲。ループは再生側で曲全体をくり返す) |
| 正解4 | SE | Springin' Sound Stock | 配布元の利用規約に従う(利用条件は要確認) | 正解音(correct) |
| se_cancel15 | SE | 効果音工房 | 配布元の利用規約に従う(利用条件は要確認) | 不正解音(incorrect) |
| ボタン音17 | SE | On-Jin ～音人～ | 配布元の利用規約に従う(利用条件は要確認) | ボタンタップ音(tap) |
| jingle_23 | SE | Springin' Sound Stock | 配布元の利用規約に従う(利用条件は要確認) | ステージクリア音(clear) |
| ジングル21(元のファイル名 jingle_21.mp3。入手元: https://www.springin.org/sound-stock/subcategory/jingle/ 規約: https://www.springin.org/sound-stock/guideline/) | SE | Springin' Sound Stock | 入手元のページの利用条件を、制作者が2026-10-02に確認(クレジット表記: 載せる方針。教育での配信: 可。ゲームへの利用: 可。改変: 可)。Springin'の規約: 素材ファイルは目立たない配置で使う(ビルド後のファイル名はハッシュ付き)。加工した音声そのものを素材として配布・販売しない(該当しない)。クレジット表記の書式は、規約の例に合わせて「効果音: Springin' Sound Stock」 | 自由練習・苦手練習・言の葉の森のラウンドの終わりの音(roundEnd)。加工: 元の48kHz・192kbpsのmp3を、44.1kHz・128kbpsに変換し、後半の無音を切って、0.4秒のフェードを足した(4.5秒) |
| holy1 | SE | ポケットサウンド | 配布元の利用規約に従う(利用条件は要確認) | マスコット成長音(growth) |
| 衝撃 | SE | Springin' Sound Stock | 配布元の利用規約に従う(利用条件は要確認) | 小ボス撃破音(subBossClear) |
| hit02 | SE | くらげ工匠 | 配布元の利用規約に従う(利用条件は要確認) | ラスボス撃破音(lastBossClear) |
| VSQ_JINGLE_0067_Otoboke_01 | SE | VSQ plus+ | 配布元の利用規約に従う(利用条件は要確認) | 図鑑ページ解放音(pageUnlock) |
| one23 | SE | くらげ工匠 | 配布元の利用規約に従う(利用条件は要確認) | 克服ボーナス音(bonus) |

**ライセンス確認の棚卸し**: 「要確認」のままの素材と、確認してほしい点は [ASSET_LICENSE_CHECKLIST.md](ASSET_LICENSE_CHECKLIST.md) にまとめてある。

**仮素材について**: アプリアイコンは仮素材(本番素材に差し替えたら、該当の行を書き換えるか削除する)。BGM・効果音は本番素材に差し替え済み(効果音は、いまも置かれていない種類があれば合成ビープ音で鳴る)。
