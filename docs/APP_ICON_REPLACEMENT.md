# アプリアイコンの差し替え手順(本番デザイン確定後)

いまのアプリアイコンは `scripts/generate-icons.py` で自動生成した仮素材(口を開けた丸いキャラ)。
本番のデザイン画像が用意できたら、ここに書いた場所へ**同じファイル名で置き換えるだけ**で反映される(コードの変更は基本的に不要)。

## 置き換えるファイル(4種類、すべて `public/` 以下)

| ファイル | サイズ | 形式 | 用途 |
| --- | --- | --- | --- |
| `public/icons/icon-192.png` | 192×192 | PNG | PWAの標準アイコン(小)。`purpose: "any"` |
| `public/icons/icon-512.png` | 512×512 | PNG | PWAの標準アイコン(大)。`purpose: "any"` |
| `public/icons/icon-512-maskable.png` | 512×512 | PNG | Android のホーム画面アイコン用。`purpose: "maskable"`(下の「maskableの注意点」を参照) |
| `public/icons/apple-touch-icon.png` | 180×180 | PNG | iOS のホーム画面アイコン |
| `public/favicon.svg` | 可変(SVG) | SVG | ブラウザのタブ・ブックマークのアイコン |

**maskableの注意点**: Android は `icon-512-maskable.png` を、OSが勝手に円形・角丸四角形などに切り抜いて使う。
絵柄を画像いっぱいまで描くと、切り抜きで欠けてしまう。**中央80%の範囲(安全領域)にキャラクター本体を収め、
周囲10%ずつは背景色で余白にする**こと(いまの仮アイコンもこの作り)。`icon-192`/`icon-512`(purpose: "any")は
切り抜かれないので、余白なしで全面に描いてよい。

## 手順

1. 新しいデザインから、上の表の5ファイルをそれぞれのサイズで書き出す(PNGは透過なしのほうが安全。iOSは`apple-touch-icon`を透過のまま使うと、透明部分が黒くなる端末があるため、背景色で塗りつぶす)。
2. 同じファイル名で `public/icons/` と `public/` を上書きする(ファイル名・置き場所は変えない。変えると3の設定変更が追加で必要になる)。
3. ファイル名・サイズ・`purpose` の割り当てを変えないなら、コードの変更は不要。変える場合は次の2箇所を確認する。
   - `vite.config.ts` の `VitePWA` プラグイン設定内、`manifest.icons` 配列(`src`・`sizes`・`purpose` の対応)と `includeAssets`。
   - `index.html` の `<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />` と `<link rel="icon" ... href="/favicon.svg" />`。
4. `npm run build` でビルドし直す(vite-plugin-pwa が新しいアイコンを含めて manifest・Service Worker を作り直す)。
5. 確認: ブラウザ・実機のPWAアイコンのキャッシュは強いため、既にホーム画面に追加済みの場合は**一度削除して追加し直す**(iOS Safari・Android Chrome とも、上書きだけでは反映されないことがある)。デスクトップは、タブを閉じて開き直すかキャッシュを消してから確認する。
6. `docs/ASSET_LICENSE_CHECKLIST.md`(50行目付近の「アプリアイコン(仮)」の行)と `docs/ASSET_CREDITS.md` を、実際の制作方法(デザイナー名・使用ツールなど)に書き換える(いまは仮素材のため「自作(`scripts/generate-icons.py` で生成)」のまま)。

## 仮生成スクリプト(`scripts/generate-icons.py`)について

本番アイコンに差し替えたら、このスクリプトは実行しなくてよくなる。削除してもよいし、
「素材が用意できるまでの仮アイコンを作る」参考実装として残しておいてもよい(どちらでも動作に影響しない)。
