# ことわざ・故事成語 80件の事実確認(2026-10-22)

`src/data/kotowaza/` の全80件(ことわざ50・故事成語30)の「読み・意味・由来・選択肢の正誤」を、国語辞典のオンライン版などで確認した結果。

## 確認のしかた

- 出典: コトバンク(デジタル大辞泉・精選版日本国語大辞典など)、goo国語辞書、Weblio辞書、故事ことわざ辞典(kotowaza-allguide.com)。必要なものは、文化庁の「国語に関する世論調査」関連の資料。URLは、検索で見つかったページ(推測したURLはない)。
- 「読み」: 見出しの読みと、データの `reading` が同じか。「意味」: データの文が、辞書の語釈と矛盾しないか。「由来」: データの `origin`(ある項目だけ)が、辞書の説明と矛盾しないか。「選択肢」: 正解が1つだけか(誤答の選択肢が、辞書に載る異形・同義句と同じ形にならないか)。
- 「例文」: データに、例文の項目は、ない(出題文 `sentence` を、問題の文として確認した)。
- 以前の確認(2026-10-02): 由来のある47件(ことわざ17・故事成語30)の由来を照合し、3件(kotowaza-050 敵に塩を送る・kotowaza-026 覆水盆に返らず・koji-007 百発百中)を直した(コミット 66541ab)。今回は、その47件の由来を、もう一度、確かめ直し、残りの33件(由来のないことわざ)は、読み・意味・選択肢を確かめた。画竜点睛の読みの誤り(竜[りゅう]→竜[りょう])は、2026-10-16に直した(コミット 41fa0ac)。
- 判定: OK=確認できて、直すところがない / 直した=今回、直した / 要判断=直していない。理由と案を書いた。

## まとめ

- 確認した件数: 80 / 80(確認できなかった項目: なし)
- 直した: 1件(kotowaza-013 の選択肢)
- 要判断: 3件(kotowaza-006・koji-025・koji-013。いずれも、いまの文は、ぼかしてあり、誤りとは言えない)
- OK: 上の4件以外。(koji-016 は、2026-10-16 に書き直し済みの由来を、再確認した)

## 一覧

| id | 表記 | データの読み | 確認した出典 | 読み(判定) | 意味(判定) | 由来(判定) | 選択肢(判定) | 総合 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| kotowaza-001 | 猿も木から落ちる | さるもきからおちる | [コトバンク](https://kotobank.jp/word/%E7%8C%BF%E3%82%82%E6%9C%A8%E3%81%8B%E3%82%89%E8%90%BD%E3%81%A1%E3%82%8B-512429) / [故事ことわざ辞典](http://kotowaza-allguide.com/sa/sarumokikaraochiru.html) | OK | OK | OK | OK | OK |
| kotowaza-002 | 石橋を叩いて渡る | いしばしをたたいてわたる | [コトバンク](https://kotobank.jp/word/%E7%9F%B3%E6%A9%8B%E3%82%92%E5%8F%A9%E3%81%84%E3%81%A6%E6%B8%A1%E3%82%8B-432183) / [故事ことわざ辞典](http://kotowaza-allguide.com/i/ishibashiwotataite.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-003 | 七転び八起き | ななころびやおき | [コトバンク](https://kotobank.jp/word/%E4%B8%83%E8%BB%A2%E3%81%B3%E5%85%AB%E8%B5%B7%E3%81%8D-589160) / [故事ことわざ辞典](http://kotowaza-allguide.com/na/nanakorobiyaoki.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-004 | 花より団子 | はなよりだんご | [コトバンク](https://kotobank.jp/word/%E8%8A%B1%E3%82%88%E3%82%8A%E5%9B%A3%E5%AD%90-603292) / [故事ことわざ辞典](http://kotowaza-allguide.com/ha/hanayoridango.html) | OK | OK | OK | OK | OK |
| kotowaza-005 | 犬も歩けば棒に当たる | いぬもあるけばぼうにあたる | [コトバンク](https://kotobank.jp/word/%E7%8A%AC%E3%82%82%E6%AD%A9%E3%81%91%E3%81%B0%E6%A3%92%E3%81%AB%E5%BD%93%E3%81%9F%E3%82%8B-435267) / [故事ことわざ辞典](http://kotowaza-allguide.com/i/inumoarukebabou.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-006 | 急がば回れ | いそがばまわれ | [コトバンク](https://kotobank.jp/word/%E6%80%A5%E3%81%8C%E3%81%B0%E5%9B%9E%E3%82%8C-432744) / [故事ことわざ辞典](http://kotowaza-allguide.com/i/isogabamaware.html) | OK | OK | OK | OK | 要判断 |
| kotowaza-007 | 論より証拠 | ろんよりしょうこ | [コトバンク](https://kotobank.jp/word/%E8%AB%96%E3%82%88%E3%82%8A%E8%A8%BC%E6%8B%A0-664007) / [故事ことわざ辞典](http://kotowaza-allguide.com/ro/ronyorisyouko.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-008 | 塵も積もれば山となる | ちりもつもればやまとなる | [コトバンク](https://kotobank.jp/word/%E5%A1%B5%E3%82%82%E7%A9%8D%E3%82%82%E3%82%8C%E3%81%B0%E5%B1%B1%E3%81%A8%E3%81%AA%E3%82%8B-569680) / [故事ことわざ辞典](http://kotowaza-allguide.com/ti/chirimotsumoreba.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-009 | 雨降って地固まる | あめふってじかたまる | [コトバンク](https://kotobank.jp/word/%E9%9B%A8%E9%99%8D%E3%81%A4%E3%81%A6%E5%9C%B0%E5%9B%BA%E3%81%BE%E3%82%8B-3206810) / [故事ことわざ辞典](http://kotowaza-allguide.com/a/amafuttejikatamaru.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-010 | 千里の道も一歩から | せんりのみちもいっぽから | [コトバンク](https://kotobank.jp/word/%E5%8D%83%E9%87%8C%E3%81%AE%E9%81%93%E3%82%82%E4%B8%80%E6%AD%A9%E3%81%8B%E3%82%89-1729075) / [故事ことわざ辞典](http://kotowaza-allguide.com/se/senrinomichimoippo.html) | OK | OK | OK | OK | OK |
| kotowaza-011 | 果報は寝て待て | かほうはねてまて | [コトバンク](https://kotobank.jp/word/%E6%9E%9C%E5%A0%B1%E3%81%AF%E5%AF%9D%E3%81%A6%E5%BE%85%E3%81%A6-466068) / [故事ことわざ辞典](http://kotowaza-allguide.com/ka/kahouwanetemate.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-012 | 早起きは三文の徳 | はやおきはさんもんのとく | [コトバンク](https://kotobank.jp/word/%E6%97%A9%E8%B5%B7%E3%81%8D%E3%81%AF%E4%B8%89%E6%96%87%E3%81%AE%E5%BE%B3-604586) / [故事ことわざ辞典](http://kotowaza-allguide.com/ha/hayaokisanmontoku.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-013 | 猫に小判 | ねこにこばん | [コトバンク](https://kotobank.jp/word/%E7%8C%AB%E3%81%AB%E5%B0%8F%E5%88%A4-594784) / [故事ことわざ辞典](http://kotowaza-allguide.com/ne/nekonikoban.html) / [犬に小判(コトバンク)](https://kotobank.jp/word/%E7%8A%AC%E3%81%AB%E5%B0%8F%E5%88%A4-2008059) / [猫に小判(Weblio)](https://www.weblio.jp/content/%E7%8C%AB%E3%81%AB%E5%B0%8F%E5%88%A4) | OK | OK | (由来の項目なし) | 直した(下) | 直した |
| kotowaza-014 | 井の中の蛙大海を知らず | いのなかのかわずたいかいをしらず | [コトバンク](https://kotobank.jp/word/%E4%BA%95%E3%81%AE%E4%B8%AD%E3%81%AE%E8%9B%99%E5%A4%A7%E6%B5%B7%E3%82%92%E7%9F%A5%E3%82%89%E3%81%9A-429844) / [故事ことわざ辞典](http://kotowaza-allguide.com/i/inonakanokawazu.html) | OK | OK | OK | OK | OK |
| kotowaza-015 | 目は口ほどに物を言う | めはくちほどにものをいう | [コトバンク](https://kotobank.jp/word/%E7%9B%AE%E3%81%AF%E5%8F%A3%E3%81%BB%E3%81%A9%E3%81%AB%E7%89%A9%E3%82%92%E8%A8%80%E3%81%86-642721) / [故事ことわざ辞典](http://kotowaza-allguide.com/me/mewakuchihodoni.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-016 | 良薬は口に苦し | りょうやくはくちににがし | [コトバンク](https://kotobank.jp/word/%E8%89%AF%E8%96%AC%E3%81%AF%E5%8F%A3%E3%81%AB%E8%8B%A6%E3%81%97-659586) / [故事ことわざ辞典](http://kotowaza-allguide.com/ri/ryouyakukuchinigashi.html) | OK | OK | OK | OK | OK |
| kotowaza-017 | 腹が減っては戦ができぬ | はらがへってはいくさができぬ | [コトバンク](https://kotobank.jp/word/%E8%85%B9%E3%81%8C%E6%B8%9B%E3%81%A3%E3%81%A6%E3%81%AF%E6%88%A6%E3%81%8C%E3%81%A7%E3%81%8D%E3%81%AC-2236373) / [故事ことわざ辞典](http://kotowaza-allguide.com/ha/harahetteikusa.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-018 | 棚からぼた餅 | たなからぼたもち | [コトバンク](https://kotobank.jp/word/%E6%A3%9A%E3%81%8B%E3%82%89%E7%89%A1%E4%B8%B9%E9%A4%85-561800) / [故事ことわざ辞典](http://kotowaza-allguide.com/ta/tanakarabotamochi.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-019 | 口は災いのもと | くちはわざわいのもと | [コトバンク](https://kotobank.jp/word/%E5%8F%A3%E3%81%AF%E7%A6%8D%E3%81%AE%E5%85%83-2236142) / [故事ことわざ辞典](http://kotowaza-allguide.com/ku/kuchiwawazawainomoto.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-020 | 百聞は一見にしかず | ひゃくぶんはいっけんにしかず | [コトバンク](https://kotobank.jp/word/%E7%99%BE%E8%81%9E%E3%81%AF%E4%B8%80%E8%A6%8B%E3%81%AB%E5%A6%82%E3%81%8B%E3%81%9A-612782) / [故事ことわざ辞典](http://kotowaza-allguide.com/hi/hyakubunwaikken.html) | OK | OK | OK | OK | OK |
| kotowaza-021 | 情けは人のためならず | なさけはひとのためならず | [コトバンク](https://kotobank.jp/word/%E6%83%85%E3%81%91%E3%81%AF%E4%BA%BA%E3%81%AE%E7%82%BA%E3%81%AA%E3%82%89%E3%81%9A-588620) / [故事ことわざ辞典](http://kotowaza-allguide.com/na/nasakewahitono.html) / [文化庁「国語に関する世論調査」を基にした映像台本](https://www.bunka.go.jp/seisaku/kokugo_nihongo/kokugo_shisaku/kotoba_shokudo/pdf/kotoba_19.pdf) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-022 | 三人寄れば文殊の知恵 | さんにんよればもんじゅのちえ | [コトバンク](https://kotobank.jp/word/%E4%B8%89%E4%BA%BA%E5%AF%84%E3%82%8C%E3%81%B0%E6%96%87%E6%AE%8A%E3%81%AE%E7%9F%A5%E6%81%B5-514501) / [故事ことわざ辞典](http://kotowaza-allguide.com/sa/sanninyorebamonjyu.html) | OK | OK | OK | OK | OK |
| kotowaza-023 | 喉元過ぎれば熱さを忘れる | のどもとすぎればあつさをわすれる | [コトバンク](https://kotobank.jp/word/%E5%96%89%E5%85%83%E9%81%8E%E3%81%8E%E3%82%8C%E3%81%B0%E7%86%B1%E3%81%95%E3%82%92%E5%BF%98%E3%82%8C%E3%82%8B-597125) / [故事ことわざ辞典](http://kotowaza-allguide.com/no/nodomotosugireba.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-024 | 石の上にも三年 | いしのうえにもさんねん | [コトバンク](https://kotobank.jp/word/%E7%9F%B3%E3%81%AE%E4%B8%8A%E3%81%AB%E3%82%82%E4%B8%89%E5%B9%B4-431901) / [故事ことわざ辞典](http://kotowaza-allguide.com/i/ishinouenimosannen.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-025 | 灯台下暗し | とうだいもとくらし | [コトバンク](https://kotobank.jp/word/%E7%81%AF%E5%8F%B0%E4%B8%8B%E6%9A%97%E3%81%97-580848) / [故事ことわざ辞典](http://kotowaza-allguide.com/to/toudaimotokurashi.html) | OK | OK | OK | OK | OK |
| kotowaza-026 | 覆水盆に返らず | ふくすいぼんにかえらず | [コトバンク](https://kotobank.jp/word/%E8%A6%86%E6%B0%B4%E7%9B%86%E3%81%AB%E8%BF%94%E3%82%89%E3%81%9A-617363) / [故事ことわざ辞典](http://kotowaza-allguide.com/hu/fukusuibonnikaerazu.html) | OK | OK | OK | OK | OK |
| kotowaza-027 | 弘法にも筆の誤り | こうぼうにもふでのあやまり | [コトバンク](https://kotobank.jp/word/%E5%BC%98%E6%B3%95%E3%81%AB%E3%82%82%E7%AD%86%E3%81%AE%E8%AA%A4%E3%82%8A-497430) / [故事ことわざ辞典](http://kotowaza-allguide.com/ko/koubounimofude.html) | OK | OK | OK | OK | OK |
| kotowaza-028 | 河童の川流れ | かっぱのかわながれ | [コトバンク](https://kotobank.jp/word/%E6%B2%B3%E7%AB%A5%E3%81%AE%E5%B7%9D%E6%B5%81%E3%82%8C-464501) / [故事ことわざ辞典](http://kotowaza-allguide.com/ka/kappanokawanagare.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-029 | 豚に真珠 | ぶたにしんじゅ | [コトバンク](https://kotobank.jp/word/%E8%B1%9A%E3%81%AB%E7%9C%9F%E7%8F%A0-618657) / [故事ことわざ辞典](http://kotowaza-allguide.com/hu/butanishinjyu.html) | OK | OK | OK | OK | OK |
| kotowaza-030 | 泣きっ面に蜂 | なきっつらにはち | [コトバンク](https://kotobank.jp/word/%E6%B3%A3%E3%81%8D%E3%81%A4%E9%9D%A2%E3%81%AB%E8%9C%82-2236301) / [故事ことわざ辞典](http://kotowaza-allguide.com/na/nakitsuranihachi.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-031 | 二兎を追う者は一兎をも得ず | にとをおうものはいっとをもえず | [コトバンク](https://kotobank.jp/word/%E4%BA%8C%E5%85%8E%E3%82%92%E8%BF%BD%E3%81%86%E8%80%85%E3%81%AF%E4%B8%80%E5%85%8E%E3%82%92%E3%82%82%E5%BE%97%E3%81%9A-592428) / [故事ことわざ辞典](http://kotowaza-allguide.com/ni/nitowooumono.html) | OK | OK | OK | OK | OK |
| kotowaza-032 | 月とすっぽん | つきとすっぽん | [コトバンク](https://kotobank.jp/word/%E6%9C%88%E3%81%A8%E9%BC%88-570933) / [故事ことわざ辞典](http://kotowaza-allguide.com/tu/tsukitosuppon.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-033 | のれんに腕押し | のれんにうでおし | [コトバンク](https://kotobank.jp/word/%E6%9A%96%E7%B0%BE%E3%81%AB%E8%85%95%E6%8A%BC%E3%81%97-597667) / [故事ことわざ辞典](http://kotowaza-allguide.com/no/norenniudeoshi.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-034 | 腐っても鯛 | くさってもたい | [コトバンク](https://kotobank.jp/word/%E8%85%90%E3%81%A4%E3%81%A6%E3%82%82%E9%AF%9B-3210022) / [故事ことわざ辞典](http://kotowaza-allguide.com/ku/kusattemotai.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-035 | 馬の耳に念仏 | うまのみみにねんぶつ | [コトバンク](https://kotobank.jp/word/%E9%A6%AC%E3%81%AE%E8%80%B3%E3%81%AB%E5%BF%B5%E4%BB%8F-441294) / [故事ことわざ辞典](http://kotowaza-allguide.com/u/umanomimininenbutsu.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-036 | 悪事千里を走る | あくじせんりをはしる | [コトバンク](https://kotobank.jp/word/%E6%82%AA%E4%BA%8B%E5%8D%83%E9%87%8C%E3%82%92%E8%B5%B0%E3%82%8B-423351) / [故事ことわざ辞典](http://kotowaza-allguide.com/a/akujisenriwohashiru.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-037 | 大は小を兼ねる | だいはしょうをかねる | [Weblio](https://www.weblio.jp/content/%E5%A4%A7%E3%81%AF%E5%B0%8F%E3%82%92%E5%85%BC%E3%81%AD%E3%82%8B) / [故事ことわざ辞典](http://kotowaza-allguide.com/ta/daiwasyouwokaneru.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-038 | 朱に交われば赤くなる | しゅにまじわればあかくなる | [コトバンク](https://kotobank.jp/word/%E6%9C%B1%E3%81%AB%E4%BA%A4%E3%82%8F%E3%82%8C%E3%81%B0%E8%B5%A4%E3%81%8F%E3%81%AA%E3%82%8B-526031) / [故事ことわざ辞典](http://kotowaza-allguide.com/si/syunimajiwarebaaka.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-039 | 転ばぬ先の杖 | ころばぬさきのつえ | [コトバンク](https://kotobank.jp/word/%E8%BB%A2%E3%81%B0%E3%81%AC%E5%85%88%E3%81%AE%E6%9D%96-505623) / [故事ことわざ辞典](http://kotowaza-allguide.com/ko/korobanusakinotsue.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-040 | 餅は餅屋 | もちはもちや | [コトバンク](https://kotobank.jp/word/%E9%A4%85%E3%81%AF%E9%A4%85%E5%B1%8B-645668) / [故事ことわざ辞典](http://kotowaza-allguide.com/mo/mochiwamochiya.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-041 | 枯れ木も山のにぎわい | かれきもやまのにぎわい | [コトバンク](https://kotobank.jp/word/%E6%9E%AF%E3%82%8C%E6%9C%A8%E3%82%82%E5%B1%B1%E3%81%AE%E8%B3%91%E3%82%8F%E3%81%84-468374) / [故事ことわざ辞典](http://kotowaza-allguide.com/ka/karekimoyama.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-042 | 雨垂れ石をうがつ | あまだれいしをうがつ | [コトバンク](https://kotobank.jp/word/%E9%9B%A8%E5%9E%82%E3%82%8C%E7%9F%B3%E3%82%92%E7%A9%BF%E3%81%A4-427034) / [故事ことわざ辞典](http://kotowaza-allguide.com/a/amadareishiwougatsu.html) | OK | OK | OK | OK | OK |
| kotowaza-043 | 風が吹けば桶屋が儲かる | かぜがふけばおけやがもうかる | [コトバンク](https://kotobank.jp/word/%E9%A2%A8%E3%81%8C%E5%90%B9%E3%81%91%E3%81%B0%E6%A1%B6%E5%B1%8B%E3%81%8C%E5%84%B2%E3%81%8B%E3%82%8B-462844) / [故事ことわざ辞典](http://kotowaza-allguide.com/ka/kazegafukebaokeya.html) | OK | OK | OK | OK | OK |
| kotowaza-044 | 捨てる神あれば拾う神あり | すてるかみあればひろうかみあり | [コトバンク](https://kotobank.jp/word/%E6%8D%A8%E3%81%A6%E3%82%8B%E7%A5%9E%E3%81%82%E3%82%8C%E3%81%B0%E6%8B%BE%E3%81%86%E7%A5%9E%E3%81%82%E3%82%8A-542456) / [故事ことわざ辞典](http://kotowaza-allguide.com/su/suterukamiareba.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-045 | 昔取った杵柄 | むかしとったきねづか | [コトバンク](https://kotobank.jp/word/%E6%98%94%E5%8F%96%E3%81%A3%E3%81%9F%E6%9D%B5%E6%9F%84-640931) / [故事ことわざ辞典](http://kotowaza-allguide.com/mu/mukashitotta.html) | OK | OK | OK | OK | OK |
| kotowaza-046 | 船頭多くして船山に登る | せんどうおおくしてふねやまにのぼる | [コトバンク](https://kotobank.jp/word/%E8%88%B9%E9%A0%AD%E5%A4%9A%E3%81%8F%E3%81%97%E3%81%A6%E8%88%B9%E5%B1%B1%E3%81%AB%E4%B8%8A%E3%82%8B-550808) / [故事ことわざ辞典](http://kotowaza-allguide.com/se/sendoufuneyama.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-047 | 魚心あれば水心 | うおごころあればみずごころ | [コトバンク](https://kotobank.jp/word/%E9%AD%9A%E5%BF%83%E3%81%82%E3%82%8C%E3%81%B0%E6%B0%B4%E5%BF%83-438938) / [故事ことわざ辞典](http://kotowaza-allguide.com/u/uogokoroareba.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-048 | 瓜の蔓に茄子はならぬ | うりのつるになすびはならぬ | [コトバンク](https://kotobank.jp/word/%E7%93%9C%E3%81%AE%E8%94%93%E3%81%AB%E8%8C%84%E5%AD%90%E3%81%AF%E3%81%AA%E3%82%89%E3%81%AC-442007) / [故事ことわざ辞典](http://kotowaza-allguide.com/u/urinotsuruninasubi.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-049 | 三つ子の魂百まで | みっつごのたましいひゃくまで | [コトバンク](https://kotobank.jp/word/%E4%B8%89%E3%81%A4%E5%AD%90%E3%81%AE%E9%AD%82%E7%99%BE%E3%81%BE%E3%81%A7-638673) / [故事ことわざ辞典](http://kotowaza-allguide.com/mi/mitsugonotamashii.html) | OK | OK | (由来の項目なし) | OK | OK |
| kotowaza-050 | 敵に塩を送る | てきにしおをおくる | [コトバンク](https://kotobank.jp/word/%E6%95%B5%E3%81%AB%E5%A1%A9%E3%82%92%E9%80%81%E3%82%8B-575230) / [故事ことわざ辞典](http://kotowaza-allguide.com/te/tekinishiowookuru.html) | OK | OK | OK | OK | OK |
| koji-001 | 矛盾 | むじゅん | [コトバンク](https://kotobank.jp/word/%E7%9F%9B%E7%9B%BE-140478) / [故事ことわざ辞典](https://kotowaza-allguide.com/mu/mujyun.html) | OK | OK | OK | OK | OK |
| koji-002 | 蛇足 | だそく | [コトバンク](https://kotobank.jp/word/%E8%9B%87%E8%B6%B3-560630) / [故事ことわざ辞典](http://kotowaza-allguide.com/ta/dasoku.html) | OK | OK | OK | OK | OK |
| koji-003 | 五十歩百歩 | ごじっぽひゃっぽ | [コトバンク](https://kotobank.jp/word/%E4%BA%94%E5%8D%81%E6%AD%A9%E7%99%BE%E6%AD%A9-501225) / [故事ことわざ辞典](http://kotowaza-allguide.com/ko/gojippohyappo.html) | OK | OK | OK | OK | OK |
| koji-004 | 四面楚歌 | しめんそか | [コトバンク](https://kotobank.jp/word/%E5%9B%9B%E9%9D%A2%E6%A5%9A%E6%AD%8C-524095) / [故事ことわざ辞典](http://kotowaza-allguide.com/si/shimensoka.html) | OK | OK | OK | OK | OK |
| koji-005 | 破竹の勢い | はちくのいきおい | [コトバンク](https://kotobank.jp/word/%E7%A0%B4%E7%AB%B9%E3%81%AE%E5%8B%A2%E3%81%84-601942) / [故事ことわざ辞典](http://kotowaza-allguide.com/ha/hachikunoikioi.html) | OK | OK | OK | OK | OK |
| koji-006 | 虎の威を借る狐 | とらのいをかるきつね | [コトバンク](https://kotobank.jp/word/%E8%99%8E%E3%81%AE%E5%A8%81%E3%82%92%E5%80%9F%E3%82%8B%E7%8B%90-585239) / [故事ことわざ辞典](http://kotowaza-allguide.com/to/toranoiwokaru.html) | OK | OK | OK | OK | OK |
| koji-007 | 百発百中 | ひゃっぱつひゃくちゅう | [コトバンク](https://kotobank.jp/word/%E7%99%BE%E7%99%BA%E7%99%BE%E4%B8%AD-612882) | OK | OK | OK | OK | OK |
| koji-008 | 杞憂 | きゆう | [コトバンク](https://kotobank.jp/word/%E6%9D%9E%E6%86%82-476573) / [故事ことわざ辞典](http://kotowaza-allguide.com/ki/kiyuu.html) | OK | OK | OK | OK | OK |
| koji-009 | 漁夫の利 | ぎょふのり | [コトバンク](https://kotobank.jp/word/%E6%BC%81%E5%A4%AB%E3%81%AE%E5%88%A9-479910) / [故事ことわざ辞典](http://kotowaza-allguide.com/ki/gyofunori.html) | OK | OK | OK | OK | OK |
| koji-010 | 温故知新 | おんこちしん | [コトバンク](https://kotobank.jp/word/%E6%B8%A9%E6%95%85%E7%9F%A5%E6%96%B0-455768) / [故事ことわざ辞典](http://kotowaza-allguide.com/o/onkochishin.html) | OK | OK | OK | OK | OK |
| koji-011 | 背水の陣 | はいすいのじん | [コトバンク](https://kotobank.jp/word/%E8%83%8C%E6%B0%B4%E3%81%AE%E9%99%A3-598884) / [故事ことわざ辞典](http://kotowaza-allguide.com/ha/haisuinojin.html) | OK | OK | OK | OK | OK |
| koji-012 | 圧巻 | あっかん | [コトバンク](https://kotobank.jp/word/%E5%9C%A7%E5%B7%BB-425447) / [故事ことわざ辞典](http://kotowaza-allguide.com/a/akkan.html) | OK | OK | OK | OK | OK |
| koji-013 | 朝三暮四 | ちょうさんぼし | [コトバンク](https://kotobank.jp/word/%E6%9C%9D%E4%B8%89%E6%9A%AE%E5%9B%9B-568433) / [故事ことわざ辞典](http://kotowaza-allguide.com/ti/tyousanboshi.html) | OK | OK | OK | OK | 要判断(軽微) |
| koji-014 | 完璧 | かんぺき | [コトバンク](https://kotobank.jp/word/%E5%AE%8C%E7%92%A7-471421) / [故事ことわざ辞典](http://kotowaza-allguide.com/ka/kanpeki.html) | OK | OK | OK | OK | OK |
| koji-015 | 推敲 | すいこう | [コトバンク](https://kotobank.jp/word/%E6%8E%A8%E6%95%B2-539689) / [故事ことわざ辞典](http://kotowaza-allguide.com/su/suikou.html) | OK | OK | OK | OK | OK |
| koji-016 | 登竜門 | とうりゅうもん | [コトバンク](https://kotobank.jp/word/%E7%99%BB%E7%AB%9C%E9%96%80-581641) / [故事ことわざ辞典](http://kotowaza-allguide.com/to/touryuumon.html) | OK | OK | OK | OK | OK(参考) |
| koji-017 | 呉越同舟 | ごえつどうしゅう | [コトバンク](https://kotobank.jp/word/%E5%91%89%E8%B6%8A%E5%90%8C%E8%88%9F-498116) / [故事ことわざ辞典](http://kotowaza-allguide.com/ko/goetsudousyuu.html) | OK | OK | OK | OK | OK |
| koji-018 | 画竜点睛 | がりょうてんせい | [コトバンク](https://kotobank.jp/word/%E7%94%BB%E7%AB%9C%E7%82%B9%E7%9D%9B-468054) / [故事ことわざ辞典](http://kotowaza-allguide.com/ka/garyoutenseikaku.html) | OK | OK | OK | OK | OK |
| koji-019 | 株を守りて兎を待つ | かぶをまもりてうさぎをまつ | [コトバンク](https://kotobank.jp/word/%E6%A0%AA%E3%82%92%E5%AE%88%E3%82%8A%E3%81%A6%E5%85%8E%E3%82%92%E5%BE%85%E3%81%A4-233219) / [故事ことわざ辞典](http://kotowaza-allguide.com/ka/kabuwomamoriteusagi.html) | OK | OK | OK | OK | OK |
| koji-020 | 他山の石 | たざんのいし | [コトバンク](https://kotobank.jp/word/%E4%BB%96%E5%B1%B1%E3%81%AE%E7%9F%B3-560324) / [故事ことわざ辞典](http://kotowaza-allguide.com/ta/tazannoishi.html) / [文化庁「ことば食堂」台本(他山の石)](https://www.bunka.go.jp/seisaku/kokugo_nihongo/kokugo_shisaku/kotoba_shokudo/pdf/kotoba_12.pdf) | OK | OK | OK | OK | OK |
| koji-021 | 三顧の礼 | さんこのれい | [コトバンク](https://kotobank.jp/word/%E4%B8%89%E9%A1%A7%E3%81%AE%E7%A4%BC-513415) | OK | OK | OK | OK | OK |
| koji-022 | 白眉 | はくび | [コトバンク](https://kotobank.jp/word/%E7%99%BD%E7%9C%89-600456) / [故事ことわざ辞典](http://kotowaza-allguide.com/ha/hakubi.html) | OK | OK | OK | OK | OK |
| koji-023 | 五里霧中 | ごりむちゅう | [コトバンク](https://kotobank.jp/word/%E4%BA%94%E9%87%8C%E9%9C%A7%E4%B8%AD-505210) / [故事ことわざ辞典](http://kotowaza-allguide.com/ko/gorimutyuu.html) | OK | OK | OK | OK | OK |
| koji-024 | 蛍雪の功 | けいせつのこう | [コトバンク](https://kotobank.jp/word/%E8%9B%8D%E9%9B%AA%E3%81%AE%E5%8A%9F-488919) / [故事ことわざ辞典](http://kotowaza-allguide.com/ke/keisetsu.html) | OK | OK | OK | OK | OK |
| koji-025 | 臥薪嘗胆 | がしんしょうたん | [コトバンク](https://kotobank.jp/word/%E8%87%A5%E8%96%AA%E5%98%97%E8%83%86-462474) / [故事ことわざ辞典](http://kotowaza-allguide.com/ka/gashinsyoutan.html) | OK | OK | OK | OK | 要判断 |
| koji-026 | 羊頭狗肉 | ようとうくにく | [Weblio](https://www.weblio.jp/content/%E7%BE%8A%E9%A0%AD%E7%8B%97%E8%82%89) / [故事ことわざ辞典](http://kotowaza-allguide.com/yo/youtoukuniku.html) | OK | OK | OK | OK | OK |
| koji-027 | 鶏口牛後 | けいこうぎゅうご | [コトバンク](https://kotobank.jp/word/%E9%B6%8F%E5%8F%A3%E7%89%9B%E5%BE%8C-667232) / [故事ことわざ辞典](http://kotowaza-allguide.com/ke/keikougyuugo.html) | OK | OK | OK | OK | OK |
| koji-028 | 泣いて馬謖を斬る | ないてばしょくをきる | [コトバンク](https://kotobank.jp/word/%E6%B3%A3%E3%81%84%E3%81%A6%E9%A6%AC%E8%AC%96%E3%82%92%E6%96%AC%E3%82%8B-588395) / [故事ことわざ辞典](http://kotowaza-allguide.com/na/naitebasyoku.html) | OK | OK | OK | OK | OK |
| koji-029 | 青は藍より出でて藍より青し | あおはあいよりいでてあいよりあおし | [コトバンク](https://kotobank.jp/word/%E9%9D%92%E3%81%AF%E8%97%8D%E3%82%88%E3%82%8A%E5%87%BA%E3%81%A7%E3%81%A6%E8%97%8D%E3%82%88%E3%82%8A%E9%9D%92%E3%81%97-422146) / [故事ことわざ辞典](http://kotowaza-allguide.com/a/aowaaiyori.html) | OK | OK | OK | OK | OK |
| koji-030 | 先ず隗より始めよ | まずかいよりはじめよ | [コトバンク](https://kotobank.jp/word/%E9%9A%97%E3%82%88%E3%82%8A%E5%A7%8B%E3%82%81%E3%82%88-456629) / [故事ことわざ辞典](http://kotowaza-allguide.com/ma/kaiyorihajimeyo.html) | OK | OK | OK | OK | OK |

## 直したもの

- **kotowaza-013 猫に小判**: 選択肢: 「犬に小判」も、猫に小判と同じ意味の言い方として辞書に載っている(コトバンク「犬に小判」・Weblio「猫に小判」の同義句)。「犬」も正解になり得たので、誤答の選択肢を「牛」に差し替えた(「牛に小判」は、コトバンク・故事ことわざ辞典に見出しがない)。
  - 変更: 誤答の選択肢 `犬[いぬ]` → `牛[うし]`(`src/data/kotowaza/kotowaza.ts`)。正解は「猫」のまま。

## 要判断(直していない)

- **kotowaza-006 急がば回れ**(要判断): 由来: 「宗長の歌がもと」とする説明が一般的だが、作者は源俊頼とする記録もあり、「この古歌からことわざが生まれたのではなく、すでにあることわざを詠み込んだ」という見方もある(故事ことわざ辞典・Weblio)。いまの文は「室町時代の歌に…とよまれたことが由来とされる」と、ぼかしてある。直すなら案: 「室町時代の歌に、『急がば回れ』の意味をよみこんだものがあり、ことわざのもとになったとも言われる。」(断定しない形)。瀬田の唐橋は、古歌の「瀬田の長橋」と同じ橋(辞書の注)。
- **koji-025 臥薪嘗胆**(要判断): 由来: 「史記などにある、呉と越の争いの話」。「嘗胆」(勾践)は史記に見えるが、「臥薪」を夫差の話とするのは後代(十八史略など)で、「臥薪嘗胆」と続けた形は宋代以降、との指摘がある(Weblio)。いまの文は「史記などにある…がもとになっている」と、ぼかしてある。直すなら案: 「中国の「史記」や「十八史略」などにある、呉と越の争いの話がもとになっている。」
- **koji-013 朝三暮四**(要判断(軽微)): 出典: 「荘子」斉物論に見えるとする辞書と、「列子」黄帝篇とする辞書がある(コトバンク・Weblio)。いまの文は「荘子などにある話」。直すなら案: 「荘子」「列子」の両方を挙げる。

## 参考(OK のうち、注意して読むもの)

- koji-016 登竜門: 出典の箇所: 辞書によって「後漢書」李膺伝・党錮伝の両方がある。2026-10-16に書き直した由来(「後漢書」に見える言葉。黄河の急流「竜門」を、鯉がのぼりきると竜になる、という伝説から…)は、この両方と矛盾しない。
- kotowaza-021 情けは人のためならず: 本来の意味(人に情けをかけると、めぐりめぐって自分に返る)で書いてある。データの意味の文に、「親切はその人のためにならない」という意味ではない、と注意も入っている。文化庁の調査でも、この言葉の意味の誤解が取り上げられている。
- koji-020 他山の石: 本来の意味(他人の誤った言行も、自分の行いの参考になる)。「他人のよい行いを手本にする」という意味ではない、という注意が、意味の文に入っている(文化庁の調査でも、誤用が取り上げられている)。
- kotowaza-012 早起きは三文の徳: 「徳」は「得」とも書く(辞書)。データは「徳」。
- kotowaza-043 風が吹けば桶屋が儲かる: 初出の江戸時代の本(世間学者気質)では、「桶」ではなく「箱の類」とあり、成句の形ではない、という説明がある。データは「江戸時代の言葉遊びから来ているとされる」と、ぼかしてある。
- kotowaza-050 敵に塩を送る: 以前に直した文(「値上げをせずに塩を手に入れさせた」「実際に無料で送ったかどうかは、はっきりしない」)で、辞書の説明と合っている(史実性に疑問があるという注記も、辞書にある)。
- kotowaza-026 覆水盆に返らず: 以前に直した文で、辞書の説明(太公望の妻が去り、出世したのちに復縁を求めた話。史実ではなく伝説とみられる)と合っている。

## 確認できなかった項目

なし。ただし、次の点は、辞書の解説の範囲でしか確認していない(原典は、確かめていない)。
- 故事成語の細部(登場人物・場面)は、辞書とことわざ辞典の要約と照合した。原典(史記・戦国策・三国志など)の本文までは、確かめていない。
- 「例文」は、データに項目がないので、確認していない。
