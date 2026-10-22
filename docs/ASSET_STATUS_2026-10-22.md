# 素材の出典の現状(2026-10-22。提出前の最終確認)

台帳(`docs/ASSET_CREDITS.md`)と、実際にアプリが使っているファイル(`src/assets/` の audio・images・fonts、`public/`、`registry.ts` に登録されているもの全部、`package.json` の依存)を突き合わせた。公開されている規約のページは、2026-10-22 に開いて、台帳の記録と合うかを確かめた(開けなかったものは、そう書いた)。

## 1. 要約

台帳の行は、全部で54行(「(例)」の行を除く。今回、ビルドツールの1行を足した)。

| 状態 | 件数 | 内容 |
| --- | --- | --- |
| OK | 23 | 入手元URLが特定でき、規約が台帳に記録されていて、今回、公開ページで台帳と合うことを確かめた(または、ライブラリ・フォントのように、手元のパッケージのライセンスで確かめた) |
| OK※(注意あり) | 19 | 上と同じ。ただし、注意点がある(生成AIのイラスト・ロゴ15行は、「LoRA」の入手元が未特定の影響を受ける。Illustrious・Gemini・M+ FONTS・OpenTracks の1曲にも注意点。第6節) |
| 規約本文未確認 | 11 | 台帳には、制作者が確認した記録があるが、今回、公開ページの本文を取得できなかった(FANBOX・YouTubeの概要欄・SSL証明書のエラー・非公開ページ・サーバーの停止) |
| 入手元未特定 | 1 | LoRA「Chibi Lerasigma 228 style」(配布元が削除済み) |
| 要差し替え | 0 | 今回の調べで、すぐ差し替えるべきものは見つかっていない。ただし、「規約本文未確認」の素材について、差し替え候補を第6節に出した |

件数は、第3節の表の「状態」の列を数えたもの。

- **規約のスナップショット(`docs/license-snapshots/`)は、1件もない**(README だけ)。全54行が、「スナップショットなし」。台帳の「制作者が確認」の記録が、いまの唯一の証拠。確認できたページは、第6節に、要点を書き残した。
- **ファイルの漏れ**: アプリが使っているファイルで、台帳のどの行にも当たらないものは、なかった(第4節)。台帳にない依存は、ビルドツール(Vite・vite-plugin-pwa・Workbox)だけで、今回、台帳に足した。
- **アプリ内の表示**: クレジット画面・「くわしい出典」は、台帳の全行を載せている(第5節)。食い違いが3つあり、直した(第7節)。

## 2. 状態の定義と、見方

- **OK**: 入手元URLあり。規約の要点が台帳にある。今回、公開ページ(または手元のパッケージ)で、条件が台帳と矛盾しないことを確認した。
- **OK※**: OK と同じだが、注意点がある。
- **規約本文未確認**: 台帳に、制作者が確認した日付はあるが、今回の調べでは、公開ページの本文を読めなかった。本文は、制作者が開いて、保存(スナップショット)してほしい。
- **本文確認の列**: 「今回確認」=今回、公開ページを開いて、台帳と合うことを確認した。「記録のみ」=台帳の「制作者が確認」の記録だけ。
- 「表記」の列は、規約が義務としているものを「必須」、任意・希望のものを「任意」と書いた。

## 3. 素材ごとの一覧(R1)

### 3-1. BGM(`src/assets/audio/bgm/`。全部で11ファイル)

| ファイル | 場所 | 作者 | 入手元URL | 規約の要点 | 表記 | 本文確認 | 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `title.mp3` | ホーム・設定・ことだまの書・ランキングなど | OpenTracks / 鷹尾まさき(曲名「爽やかなアイリッシュ的なBGM_2」。2021年リミックス版) | https://opentracks.com/bgm/play1840.html | クレジット不要。ゲーム・アプリ・学校の課題に使える。音源の配布・BGM素材としての配信は禁止。作曲者は「サイト準拠」 | 不要 | 今回確認(利用ライセンスのページ。曲のページで、作曲者・バージョンも) | **OK※**(第6節 9番) |
| `explore-intro.mp3` / `explore.mp3` | エリア選択・ステージ選択 | zippy「始まりの村 A / B」 | https://booth.pm/ja/items/6114595 | 【フリーBGM】の曲は、ゲームに可。キー・ピッチ変更は禁止。クレジットは任意(台帳の記録) | 任意 | 記録のみ(BOOTHの商品ページは、「規約をFANBOXで読むように」とだけ書いてある。FANBOXは、本文を取得できなかった) | 規約本文未確認 |
| `stage.mp3` | 出題中 | PeriTune「Prairie4」(作者表記: sei) | https://peritune.com/blog/2019/03/01/prairie4/ | CC BY 4.0。商用可。ゲームへの同梱は、無償の作品ならよい | **必須**(曲名・作者・ライセンス・入手元) | 今回確認(曲のページ「CC BY 4.0」。PeriTuneの利用ページ) | OK |
| `subBoss.mp3` | 小ボス戦 | Hareno「【フリーBGM】禁忌の詠唱」 | https://youtu.be/AdWxKyHYQM0 | 無料・商用可・ゲーム可。二次配布・Content ID登録は禁止(台帳の記録) | 任意(リンクを載せると喜ばれる) | 記録のみ(YouTubeの概要欄を取得できなかった) | 規約本文未確認 |
| `lastBoss.mp3` | ラスボス戦 | EigHt「凍てつく世界の果て」 | https://www.youtube.com/watch?v=FZ2dtOAPe5U | ゲーム可。配信サービス・Content ID登録は禁止(台帳の記録) | 任意 | 記録のみ(規約のFANBOXは、見出しだけ取得) | 規約本文未確認 |
| `truth-intro.mp3` / `truth.mp3` | 真相究明の会話 | zippy「星降る丘 LoopA / LoopB」 | https://booth.pm/ja/items/6114577 | 上の「始まりの村」と同じ | 任意 | 記録のみ(同上) | 規約本文未確認 |
| `ending.mp3` | エンディング | zippy「The Forgotten Girl 1Loop」 | https://www.youtube.com/watch?v=ZBIg90S5vaI(BOOTHの配布ページは、見つかっていない) | 上と同じ | 任意 | 記録のみ(YouTubeの題名だけ取得。概要欄は取得できなかった) | 規約本文未確認 |
| `talk.mp3` | 会話シーン | にゃるぱかBGM工房「ゆっくりしよ」 | https://booth.pm/ja/items/7674668 / https://nyalpacabgm.com/terms-of-use/ | 個人・法人・商用・非商用可。「販売するゲームや創作物での利用」は許諾側に記載。通常は、クレジット不要。楽曲そのものを不特定多数が取り出せる状態にするのは禁止。教育・授業の明示記載はなし | 不要 | 今回確認(規約。BOOTHの商品ページは、題名・「クレジット表記不要、無料で商用利用を含む…」) | OK |
| `kotonoha.mp3` | 言の葉の森 | Hareno「千年の内緒話 / A secret whispered for a millennium」 | https://youtu.be/CGjkJKXqgHY | ゲーム・教育での利用可・改変可・二次配布と権利の主張は禁止(台帳の記録) | 任意 | 記録のみ(題名「【フリーBGM】千年の内緒話…」だけ取得。概要欄は取得できなかった) | 規約本文未確認 |

### 3-2. 効果音(`src/assets/audio/se/`。全部で10ファイル)

| ファイル | 場所 | 作者(素材名) | 入手元URL | 規約の要点 | 表記 | 本文確認 | 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `correct.mp3` | 正解 | Springin' Sound Stock(正解4) | https://www.springin.org/sound-stock/category/system/ | 商用可。ゲームに組み込める(素材ファイルは、目立たない配置に)。加工可。再配布・直リンクは禁止 | 任意 | 今回確認(ガイドライン) | OK |
| `clear.mp3` | ステージクリア | Springin'(jingle_23) | https://www.springin.org/sound-stock/subcategory/jingle/ | 同上 | 任意 | 今回確認 | OK |
| `roundEnd.mp3` | 練習・言の葉の森の終わり | Springin'(ジングル21。元の名前 jingle_21.mp3) | https://www.springin.org/sound-stock/subcategory/jingle/ | 同上 | 任意 | 今回確認 | OK |
| `subBossClear.mp3`(`subBossPurify` も、これを鳴らす) | 小ボス撃破 | Springin'(衝撃) | https://www.springin.org/sound-stock/category/battle/ | 同上 | 任意 | 今回確認 | OK |
| `incorrect.mp3` | 不正解 | 効果音工房 umipla(se_cancel15) | https://umipla.com/soundeffect/4388 | 個人・サークルは商用・非商用可、クレジット・報告は不要。再配布・Content ID登録は禁止。法人は要連絡。加工は可 | 不要 | 今回確認(利用規約) | OK |
| `tap.mp3` | ボタン | On-Jin ～音人～(ボタン音17) | https://on-jin.com/sound/muci.php | 個人・サークル・学校は無料。クレジットは任意。**音源がシステム上むき出しになる場合は、著作表記と「二次配布・無断利用禁止」の表記が必要**。直リンク禁止 | 任意(むき出しの場合は必須) | 今回確認(利用規約の原文を引用して確認) | OK(クレジット画面に、表記を足した) |
| `growth.mp3` | マスコット成長 | ポケットサウンド(holy1) | https://pocket-se.info/archives/412/ | 商用・ゲーム可。**作品での表記かサイトへのリンクが必要**。教育機関でリンクが困難な場合は免除。直リンク・再配布は禁止 | **必須** | 今回確認(規約。2023/05/31版) | OK |
| `lastBossClear.mp3` | ラスボス撃破 | くらげ工匠(hit02) | http://www.kurage-kosho.info/ | 商用・非商用可・加工可・クレジット不要・再配布禁止(台帳の記録) | 不要 | 記録のみ(サイトのSSL証明書が合わず、取得できなかった) | 規約本文未確認 |
| `bonus.mp3` | 克服ボーナス | くらげ工匠(one23) | http://www.kurage-kosho.info/ | 同上 | 不要 | 記録のみ(同上) | 規約本文未確認 |
| `pageUnlock.mp3` | 図鑑ページ解放 | VSQ plus+(VSQ_JINGLE_0067_Otoboke_01) | https://vsq.co.jp/plus/wordpress/wp-content/uploads/2021/07/VSQ_JINGLE_0067_Otoboke_01.mp3(規約: https://vsq.co.jp/plus/tos/) | 商用・非商用とも無料。ゲーム・アプリを例示。クレジットは任意。そのままの状態での頒布は禁止。Content ID登録は禁止 | 任意 | 今回確認(規約) | OK |

小ボス撃破の `subBossPurify`(専用の新しい効果音)は、**専用のファイルは、まだ置かれていない**。`registry.ts` の `SE_FILE_FALLBACK` で、`subBossClear.mp3`(「衝撃」。Springin')を鳴らしている。新しい音を置くときは、台帳に1行足してから置く(`docs/AUDIO_INVENTORY.md` に手順がある)。もし、別の場所に新しい音のファイルを用意しているなら、このリポジトリ・台帳には、まだ入っていない。

### 3-3. 画像(`src/assets/images/`。61ファイル。すべて git の管理外)

台帳には、制作の道具(生成AIモデル・ロゴの素材・フォント)の行が別にあり(3-4)、画像の行は、その行を参照している。

| ファイル | 場所 | 作者・制作方法 | 入手元URL | 規約の要点 | 表記 | 本文確認 | 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mascot/base.webp`(コト・通常) | マスコット全般 | 生成AI(Stable Diffusion / Illustrious-XL v2.0 + LoRA)による制作 | 「生成AIモデルの行を参照」 | 生成物の権利は、3-4の各モデルの条件による | クレジット画面に「イラスト: 生成AI(…)」 | 3-4のとおり | OK※ |
| `mascot/{happy,sad,eating,surprised,sleepy,combo,hungry}.webp`(表情7) | 正誤・結果・ホーム | 生成AI(Geminiで、ベースの画像を編集) | 同上 | 同上(Gemini) | 同上 | 同上 | OK※ |
| `mascot/accessory-1〜7.webp`(成長アクセサリー7) | 成長演出 | 生成AI(Geminiで編集) | 同上 | 同上 | 同上 | 同上 | OK※ |
| `mascot/true.webp`(本来の姿) | エンディング結果など | 生成AI(SD + LoRA) | 同上 | 同上 | 同上 | 同上 | OK※ |
| `boss/lastboss-possessed.webp` | ラスボス戦・ストーリー | 生成AI(SD + LoRA) | 同上 | 同上 | 同上 | 同上 | OK※ |
| `boss/lastboss-purified.webp` | ストーリー | 生成AI(Geminiで編集) | 同上 | 同上 | 同上 | 同上 | OK※ |
| `boss/subboss-<エリア>.webp`(7) | 小ボス戦・ストーリー | 生成AI(SD + LoRA) | 同上 | 同上 | 同上 | 同上 | OK※ |
| `boss/subboss-<エリア>-purified.webp`(7) | 撃破後のストーリー・ずかん | 生成AI(Geminiで編集) | 同上 | 同上 | 同上 | 同上 | OK※ |
| `bg/<エリア>.webp`(8)・`bg/<エリア>-corrupted.webp`(7) | 背景 | 生成AI(SD + LoRA。Geminiで画像編集)+ 制作者の加工 | 同上 | 同上 | 同上 | 同上 | OK※ |
| `bg-card/<エリア>.webp`(8) | エリア選択のカード | `bg/<エリア>.webp` を512×286に縮めたもの(新しい素材ではない) | 上の背景と同じ | 同上 | 同上 | 同上 | OK※ |
| `bg/kotonoha_forest.webp` | 言の葉の森の入口・出題・結果 | 生成AI(Geminiによる生成) | 同上 | 同上(Gemini) | 同上 | 同上 | OK※ |
| `kotonoha/yurai.webp` | 言の葉の森のユライ | 生成AI(SD + LoRA)+ 背景除去・サイズ調整は制作者 | 同上 | 同上 | 同上 | 同上 | OK※ |
| `title/title_bg.webp` | 最初の画面の背景 | 生成AI(Geminiによる生成) | 同上 | 同上(Gemini) | 同上 | 同上 | OK※ |
| `title/title_koto.webp` | 最初の画面のコト | 生成AI(Gemini)+ 制作者の透過処理・手直し | 同上 | 同上 | 同上 | 同上 | OK※ |
| `title/title-logo.svg`・`ui/title-logo.svg` | タイトルロゴ(2つは、縁取りありと、なしの版。同じ絵) | 制作者による制作(Vサムネ・Photopea・ICOON MONO のアイコン・あかずきんポップ・Monomaniac One を使う) | 「なし(制作者による制作。制作素材の行を参照)」 | 3-4の各素材の条件(ロゴの画像ファイルは、素材として単体で配布しない) | 不要 | 3-4のとおり | OK※ |
| `public/icons/*.png`(4)・`public/favicon.svg` | ホーム画面のアイコン・タブのアイコン | 自作(`scripts/generate-icons.py` で生成。favicon は、円と「言」の文字だけ) | なし(自作) | 制限なし | 不要 | ― | OK |

### 3-4. 制作の道具・素材(アプリには同梱されない。イラスト・ロゴの出典として台帳にある行)

| 素材 | 作者・提供元 | 入手元URL | 規約の要点 | 表記 | 本文確認 | 状態 |
| --- | --- | --- | --- | --- | --- | --- |
| Illustrious-XL v2.0(生成AIモデル) | OnomaAI Research | https://huggingface.co/OnomaAIResearch/Illustrious-XL-v2.0 | Hugging Faceの license 欄は creativeml-openrail-m(今回確認)。台帳に、CivitAI側の表記は Fair AI Public License 1.0-SD とあり、2つの表記が違う | 不要(AI生成の開示は、クレジット画面で済み) | 今回確認(license欄のみ。ページに本文・要点の記載はない) | OK※(第6節 8番) |
| Chibi Lerasigma 228 style(LoRA) | Ticovca | https://civitai.com/models/966828/chibi-lerasigma-228-style(**削除済み**。2025-08-07)/ https://civarchive.com/models/966828(アーカイブ) | 台帳: Fair AI Public License 1.0-SD(制作者が見たCivitAIの表記)。アーカイブのページには、ライセンスの記載がなく、ベースは Pony と表示 | 不要(台帳の記録) | **未確認**(CivitAIは、今回も開けなかった(403)。アーカイブは、ライセンス欄なし) | **入手元未特定** |
| sd-webui-forge-classic | Haoming02 | https://github.com/Haoming02/sd-webui-forge-classic | AGPL-3.0(ソフトのライセンス。生成画像の権利には触れていない) | 不要 | 今回確認 | OK |
| Gemini(画像生成・編集) | Google | https://policies.google.com/terms | 「Google won't claim ownership over that content」「Your content remains yours」。商用利用の明記はない。「生成AIのコンテンツを人間が作ったと誤認させる」ことの禁止(今回、原文を確認)。クレジット画面で、AI生成と開示している | 開示が必要 | 今回確認(原文) | OK※(第6節 10番) |
| Vサムネ(ロゴの制作) | Vサムネ | https://vsamune.com/ (規約: https://vsamune.com/ja/rule) | クレジット不要。商用・非商用とも可(用途の例に、ゲーム・アプリがある)。テンプレートの素材そのものの配布・再配布は禁止 | 不要 | 今回確認 | OK |
| Photopea(ロゴの制作) | Photopea | https://www.photopea.com/ | 作った物は、すべて制作者のもの。販売可。表記不要 | 不要 | 今回確認(規約のページ。検索結果の記載。`/terms` を直接開くと 404 だった) | OK |
| 肉球のアイコン3(ICOON MONO) | TopeconHeroes | https://icooon-mono.com/12783-%e8%82%89%e7%90%83%e3%81%ae%e3%82%a2%e3%82%a4%e3%82%b3%e3%83%b33/ | 連絡不要・無料・アプリへの組み込み可・加工可。再配布・ジェネレーターの素材・商標登録は不可(台帳の記録) | 不要 | 記録のみ(サイトが 502 を返し、今回は開けなかった) | 規約本文未確認 |
| 葉っぱアイコン(ICOON MONO) | TopeconHeroes | https://icooon-mono.com/13591-%e8%91%89%e3%81%a3%e3%81%b1%e3%82%a2%e3%82%a4%e3%82%b3%e3%83%b3/ | 同上 | 不要 | 記録のみ(同上) | 規約本文未確認 |
| あかずきんポップ(ロゴのフォント) | FLOPDESIGN | https://flopdesign.booth.pm/items/1748058 | 商用・非商用可、プログラムへの埋め込み可。クレジットは「依頼」で、義務ではない。**ページは、2026-10-22 も「非公開中」と表示される**(本文は取得できて、台帳と合う) | 任意(作者の希望) | 今回確認(ただし、非公開のページ。保存した文面は、まだない) | 規約本文未確認 |
| M+ FONTS(あかずきんポップの元) | M+ FONTS PROJECT | https://github.com/coz-m/MPLUS_FONTS | OFL-1.1(リポジトリの表示。今回確認)。あかずきんポップの元になった2018年版そのもののバージョンは、未確認 | OFL(著作権表示を残す) | 今回確認(リポジトリのライセンス表示のみ) | OK※ |
| Monomaniac One(ロゴのフォント) | Maniackers Design | https://fonts.google.com/specimen/Monomaniac+One | OFL-1.1(GitHubのリポジトリの表示。今回確認) | OFL | 今回確認(リポジトリのライセンス表示) | OK |

### 3-5. フォント・ライブラリ(アプリに同梱される。手元のパッケージで確認)

| 素材 | 場所 | 作者 | 入手元URL | ライセンス | 表記 | 本文確認 | 状態 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M PLUS Rounded 1c(`src/assets/fonts/*.woff2`。使う文字だけに絞った版) | アプリ全体の文字 | The Rounded M+ Project Authors(Google Fonts / @fontsource 5.3.0) | https://fontsource.org/fonts/m-plus-rounded-1c | SIL OFL 1.1(パッケージの LICENSE を確認) | クレジット画面に載せている | 今回確認(`node_modules` の LICENSE) | OK |
| lucide-react 1.48.0 | 画面のアイコン | Lucide Icons and Contributors | https://lucide.dev | ISC | 載せている | 今回確認(パッケージ) | OK |
| qrcode-generator 2.0.4 | 引き継ぎコードのQR | Kazuhiko Arase | https://github.com/kazuhikoarase/qrcode-generator | MIT | 載せている | 今回確認 | OK |
| jsQR 1.4.0 | QR読み取り | cozmo | https://github.com/cozmo/jsQR | Apache-2.0 | 載せている | 今回確認 | OK |
| React / React DOM 18.3.1 | 画面全体 | Meta | https://react.dev | MIT | 載せている | 今回確認 | OK |
| Zustand 5.0.15 | 状態の保存 | pmndrs | https://github.com/pmndrs/zustand | MIT | 載せている | 今回確認 | OK |
| Firebase JS SDK 11.10.0 | ランキング・引き継ぎ | Google | https://firebase.google.com/ | Apache-2.0 | 載せている | 今回確認 | OK |
| Vite 5.4.21 / vite-plugin-pwa 0.21.2 / Workbox 7.4.1(**今回、台帳に追加**) | ビルド・オフライン動作(ビルド結果に Workbox の実行コード `workbox-*.js` が入る) | Evan You ほか / Anthony Fu / Google | https://vite.dev ・ https://github.com/vite-pwa/vite-plugin-pwa ・ https://github.com/GoogleChrome/workbox | MIT(3つとも。パッケージの LICENSE を確認) | クレジット画面には、もとから載っていた(Vite / vite-plugin-pwa) | 今回確認 | OK |

## 4. 台帳とアプリの突き合わせ(別枠)

### 台帳にあるが、アプリが直接は使わない素材
制作の過程で使った道具で、アプリには同梱されない: Illustrious-XL・LoRA・sd-webui-forge-classic・Gemini・Vサムネ・Photopea・ICOON MONO(2つ)・あかずきんポップ・M+ FONTS・Monomaniac One。ロゴ・イラストの出典として、台帳と「くわしい出典」に載せている(漏れではない)。アプリが使っていないのに載っている音・画像は、なかった。

### アプリが使っているが、台帳にない素材(漏れ)
- Vite・vite-plugin-pwa・Workbox: ビルド結果(`dist/workbox-*.js`)に入るのに、台帳になかった(クレジット画面の「つかった ソフトウェア」には載っていた)。**今回、台帳に1行足した**。
- 音の合成ビープ・無音のダミー音声: コードが作る音で、素材ファイルではない(出典は不要)。
- `bg-card/*`(カード用の縮小版)・2つの `title-logo.svg`: 台帳の行(背景・ロゴ)の派生で、新しい素材ではない。
- 画像・音のファイルのうち、台帳のどの行にも当たらないものは、なかった(61画像 + 11BGM + 10効果音 + フォント2 + アイコン5)。

## 5. アプリ内の表示との一致(R2)

- **クレジット画面**: BGMは、台帳9行 → 6行(作曲者ごとにまとめる: OpenTracks・zippy・PeriTune・Hareno・EigHt・にゃるぱかBGM工房)。効果音は、10行 → 6行(Springin'・効果音工房・On-Jin・ポケットサウンド・くらげ工匠・VSQ plus+)。台帳の全行の作者が、載っている。台帳にないのに載っているものは、ない(「つかった ソフトウェア」の Vite / vite-plugin-pwa は、台帳になかったので、足した)。
- **くわしい出典**: 台帳の全行(今回で54行)を、区分ごとに載せている。曲名・作者・入手元・条件が出る。
- **表記が必須の素材**(今回、直したもの):
  - ポケットサウンド: クレジット画面に、規約の書式「効果音：ポケットサウンド – https://pocket-se.info/」を、リンクで載せている。コロンが半角だった(「:」)ので、規約と同じ全角(「：」)にした。
  - Prairie4(CC BY 4.0): クレジット画面には、「PeriTune」だけで、曲名・ライセンス名・入手元がなかった(「くわしい出典」には、あった)。**「BGM：Prairie4 - PeriTune(CC BY 4.0) https://peritune.com/blog/2019/03/01/prairie4/」の行を、リンクで足した。**
  - On-Jin: 規約に、音源がむき出しになる場合は、著作表記と「二次配布・無断利用禁止」の表記が必要、とある(ブラウザで、音声ファイルを取り出せる)。**「効果音：On-Jin ～音人～ https://on-jin.com/ (音源の二次配布・無断利用は禁止)」の行を、リンクで足した。**
- **食い違い(直したもの)**: 「くわしい出典」で、生成AIのイラスト・ロゴ・アイコンの16行が、すべて「入手元: 要確認」と出ていた(台帳には、「生成AIモデルの行を参照」「なし(自作)」とあるのに、説明が出ていなかった)。**台帳の説明(「入手元: 生成AIモデルの行を参照」など)を出すように直した。**「要確認」と出るのは、URLも説明もない行だけ(いまは、0行)。
- **解説書用の一覧**: `scripts/export-sources.py` で作り直した。変更前と変わらなかった(台帳と一致)。ビルドツールの行を足したので、今回、1行増えた。アプリの「くわしい出典」と、台帳の行の数・名前は一致(テストで確認: `credits.test.ts`・`SourcesScreen.test.tsx`)。なお、`SOURCES_FOR_REPORT.md` は、台帳の区分(「制作素材」と「フォント」は別の見出し)で並べ、アプリは、区分をまとめる(フォントは「ソフトウェア」の中)ので、見出しの並びは違う。内容は同じ。

## 6. 規約の確認で足りないもの(R3)

### 6-1. 今回、公開ページで確認できた内容(台帳と合っていた)
(要約は、ページを開いて読んだ内容。原文の保存ではない。制作者が、原文の保存を `docs/license-snapshots/` に追加してほしい)

- **Springin' Sound Stock**(https://www.springin.org/sound-stock/guideline/): 商用可。ゲームの配布は可(素材ファイルが単体で取り出せる場合は、目立ちにくい配置にする)。クレジットは必須ではない(書く場合は「Springin' Sound Stock」を含める)。加工可。再配布・直リンクは禁止。教育専用の条項はなし。
- **効果音工房**(https://umipla.com/利用規約/): 個人・サークルは、商用・非商用とも可。報告・クレジット不要。編集可。再配布禁止。Content ID登録禁止。法人は問い合わせが必要。中学・高校の部活動は、連絡・クレジット不要。
- **On-Jin ～音人～**(https://on-jin.com/kiyaku.php): 個人・サークル・学校・ボランティアは、営利・非営利とも無料。クレジットは任意だが、「音源がシステム上むき出しになる場合は、必ず著作表記と音源の二次配布、無断利用禁止の表記」(原文)。企業・営利事業・商業広告は、連絡が必要。授業の制作・コンテストは可。直リンク禁止。
- **ポケットサウンド**(https://pocket-se.info/rules/): 商用・ゲーム可。表記かサイトへのリンクが必要(教育機関でリンクが困難な場合は免除)。加工可。再配布・転売・直リンク禁止。アプリの明確な記載はない。
- **VSQ plus+**(https://vsq.co.jp/plus/tos/): 商用・非商用とも無料、報告不要。ゲーム・アプリ・Scratch の制作を例示。クレジットは任意。加工可。そのままの状態での頒布(販売・貸与・ネットでの再掲)は禁止。Content ID登録禁止。教育・学校の記載はなし。
- **にゃるぱかBGM工房**(https://nyalpacabgm.com/terms-of-use/): 個人・法人・商用・非商用可。「販売するゲームや創作物での利用」は、許諾側の記載。通常はクレジット不要(楽曲が主のUGC公開のときだけ必要)。加工可。楽曲そのものを不特定多数が取り出せる状態にする・Content ID登録・再配布は禁止。教育・授業の記載はなし。
- **OpenTracks**(https://opentracks.com/help/articles/license/): 利用料・クレジット不要。ゲーム・アプリ・学校の課題に可。加工可。音源の配布・販売は禁止。**「エンドユーザーが音源ファイルに容易にアクセス・複製できる状態での利用も禁止」**。「ツールアプリやプラットフォームへの組み込みは対象外(事前相談)」。作曲者の条件が別にあれば、そちらが優先(この曲は「サイト準拠」)。
- **PeriTune**(https://peritune.com/about/ と曲のページ): 商用可。クレジットは任意だが、曲のページが CC BY 4.0(2026年2月より前の曲は CC BY 4.0)。ゲームへの同梱は、無償・非営利なら可(有償の作品では、ファイルを暗号化して取り出せないようにする)。再配布・Content ID登録は禁止。
- **Hugging Face(Illustrious-XL v2.0)**: license 欄は creativeml-openrail-m。ページに、本文・要点の記載はない。
- **Gemini(Googleの利用規約)**: 「Google won't claim ownership over that content」「Your content remains yours」「misleading others into thinking that generative AI content was created by a human」の禁止(原文)。商用利用の明記はない。
- **Vサムネ**(https://vsamune.com/ja/rule): 商用・非商用可。ゲーム・アプリを用途の例に挙げている。クレジット・報告は不要。テンプレートの素材そのものの配布・再配布は禁止、加工は自由。
- **Photopea**: 作った物は、すべて制作者のもの。販売可。表記不要。
- **あかずきんポップ**(BOOTHの非公開ページ): 商用・非商用可。「プログラムへの埋め込みが可能」。クレジットは、依頼(表記例「フォント：あかずきんポップ」とURL)。フォントファイルの再配布の記載はない。M+ FONTS派生(Copyright 2018 M+ FONTS PROJECT)。
- **M+ FONTS / Monomaniac One**: GitHubのリポジトリが OFL-1.1 と表示。

### 6-2. ユーザーが確認する必要がある項目(確認先つき)

| # | 素材 | 確認すること | 確認先 |
| --- | --- | --- | --- |
| 1 | hit02・one23(くらげ工匠) | サイトの**SSL証明書が合わず**(別のサイトの証明書が返る)、規約を取得できなかった。ブラウザで、規約(商用・加工・再配布・クレジット)を開いて、文面を保存する | http://www.kurage-kosho.info/ |
| 2 | 始まりの村 A/B・星降る丘・The Forgotten Girl(zippy) | FANBOXの規約本文は、取得できなかった(見出しだけ)。台帳の「【フリーBGM】表記の曲のみ二次利用可・ゲーム可・キー/ピッチ変更禁止」を、本文で確認して保存。**3曲とも、【フリーBGM】の表記があるか**、YouTubeの概要欄でも確認 | https://zippysound.fanbox.cc/posts/8574304 / https://booth.pm/ja/items/6114595 / https://booth.pm/ja/items/6114577 / https://www.youtube.com/watch?v=ZBIg90S5vaI |
| 3 | 凍てつく世界の果て(EigHt) | FANBOXの規約本文が取得できなかった。台帳の「ゲーム可・著作表記は任意・配信サービス/Content ID登録は禁止・教育機関は著作権法第35条に準ずる」を、本文で確認して保存 | https://eight-novel.fanbox.cc/posts/7647818 / https://www.youtube.com/watch?v=FZ2dtOAPe5U |
| 4 | 禁忌の詠唱・千年の内緒話(Hareno) | YouTubeの概要欄が取得できなかった。利用条件(無料・商用可・ゲーム可・教育可・改変可・二次配布禁止)を、概要欄で確認して保存 | https://youtu.be/AdWxKyHYQM0 / https://youtu.be/CGjkJKXqgHY |
| 5 | ICOON MONO(肉球・葉っぱ) | サイトが502を返し、開けなかった。台帳の条件(アプリへの組み込み可・再配布と商標登録は不可)を、時間をおいて確認 | https://icooon-mono.com/ |
| 6 | あかずきんポップ | BOOTHのページが「非公開中」。ダウンロードしたときの規約の文面を、`docs/license-snapshots/` に保存。元のM+ FONTS(2018年版)のライセンスの確認も | https://flopdesign.booth.pm/items/1748058 / https://github.com/coz-m/MPLUS_FONTS |
| 7 | LoRA(Chibi Lerasigma 228 style) | 配布元が削除され、アーカイブに、ライセンス欄がない。制作者が見たときのCivitAIのページ(Fair AI Public License 1.0-SD)の画面や記録が残っていれば、保存。なければ、「入手元が削除されている」ことを、解説書に書く | https://civitai.com/models/966828/chibi-lerasigma-228-style / https://civarchive.com/models/966828 |
| 8 | Illustrious-XL v2.0 | Hugging Faceは creativeml-openrail-m、CivitAIは Fair AI Public License 1.0-SD と、表記が違う。どちらの条件でも、このゲームの用途(出力画像を使う)に当てはまるかを確認 | https://huggingface.co/OnomaAIResearch/Illustrious-XL-v2.0 (Files and versions の License ファイル) |
| 9 | OpenTracks・PeriTune・Springin'・On-Jin(音源の取り出し) | Webアプリは、ブラウザから音声ファイルを取り出せる(ファイル名にハッシュを付け、目立たない配置にしてある)。OpenTracks は「エンドユーザーが音源ファイルに容易にアクセス・複製できる状態での利用も禁止」としている。この配信方法で、学校の課題として許されるかを、判断(必要なら、各サイトに問い合わせ) | https://opentracks.com/help/articles/license/ |
| 10 | Gemini | 商用利用の可否の明記がない。生成物の所有権は、Googleが主張しない、とある。公開の用途に、問題ないかを、判断 | https://policies.google.com/terms |
| 11 | 学校・授業での利用の明記がない素材 | にゃるぱかBGM工房・Springin'・VSQ plus+・ポケットサウンドの規約には、教育・授業の明示がない(ゲームへの組み込みは許諾されている)。課題の提出・公開について、不安なら問い合わせ | 各サイトの問い合わせ先 |
| 12 | 規約の保存 | `docs/license-snapshots/` が、README だけ。上の各ページの文面(スクリーンショットやテキスト)を保存する | ― |

### 6-3. 差し替え候補(実際の差し替えはしていない)

「規約本文未確認」と「入手元未特定」の素材について、同じ用途で使える、出典と規約が明確な素材。今回、ページを開いて、条件を確かめたものだけを書いた。

| 差し替えの対象 | 候補1 | 候補2 |
| --- | --- | --- |
| hit02(ラスボス撃破)・one23(克服ボーナス)(くらげ工匠。効果音) | **効果音ラボ** https://soundeffect-lab.info/ (規約: https://soundeffect-lab.info/agreement/): 商用可・クレジット不要・アプリの操作音として組み込み可・加工可。再配布・直リンク・Content ID登録は禁止。 | **Springin' Sound Stock**(すでに4つ使用。規約を確認済み) https://www.springin.org/sound-stock/ : 商用可・クレジット任意・ゲームに組み込み可。戦闘・ジングルのカテゴリがある。 |
| 始まりの村 A/B・星降る丘・The Forgotten Girl(zippy。BGM3曲)、禁忌の詠唱・千年の内緒話(Hareno)、凍てつく世界の果て(EigHt) | **OpenTracks(DOVA-SYNDROME)**(すでに1曲使用。規約を確認済み) https://opentracks.com/ : クレジット不要・ゲーム可。ただし、音源の取り出しの条件(上の9番)に注意。 | **Kevin MacLeod(incompetech)** https://incompetech.com/music/royalty-free/faq.html : CC BY 4.0。ゲームのクレジット画面に「曲名 Kevin MacLeod (incompetech.com) / Licensed under Creative Commons: By Attribution 4.0 / https://creativecommons.org/licenses/by/4.0/」と書く。改変可。 |
| ICOON MONO のアイコン(ロゴの肉球・葉っぱ) | **lucide**(すでにアプリで使用。ISC) https://lucide.dev : 「paw-print」「leaf」などのアイコンで、ロゴを作り直す(ISCは、著作権表示と許諾文を残せば、改変・再配布できる)。 | (ロゴは、ほかの素材から作り直す必要がある。差し替えの前に、ロゴの見た目を、制作者が決める) |
| あかずきんポップ(ロゴのフォント) | **Monomaniac One**(すでにロゴで使用。OFL-1.1。リポジトリを確認済み) https://fonts.google.com/specimen/Monomaniac+One : ロゴのタイトル全体を、このフォントで作り直す | **M PLUS Rounded 1c**(すでにアプリで使用。OFL-1.1。パッケージで確認済み) https://fontsource.org/fonts/m-plus-rounded-1c |
| LoRA(Chibi Lerasigma 228 style。入手元未特定) | 画像は、すでに生成済みで、LoRAだけの差し替えは、できない。**Illustrious-XL v2.0 のみで、同じキャラクターを描き直す**(Hugging Faceの license 欄 creativeml-openrail-m が、はっきりしている) | 配布元の削除を、解説書に明記したうえで、アーカイブのURLと、確認した表記(Fair AI Public License 1.0-SD)を残す(差し替えなし) |

## 7. 今回、変更したもの

調べの結果、確実なものだけを直した。

1. クレジット画面: ポケットサウンドの行のコロンを、規約の書式の全角に。Prairie4(CC BY 4.0)・On-Jin(二次配布・無断利用禁止)の表記の行を追加。
2. 「くわしい出典」: 画像・ロゴ・アイコンの行の「入手元: 要確認」を、台帳の説明に。
3. 台帳: ビルドツール(Vite・vite-plugin-pwa・Workbox)の1行を追加。`docs/SOURCES_FOR_REPORT.md` を作り直した。

判断が必要なものは、直していない(第6節の12項目)。
