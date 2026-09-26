/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// 9章 技術要件: PWA化(オフラインキャッシュ) / レスポンシブ対応 を反映した基本設定。
// 配色・アイコンは未決事項(12章)のため仮値。デザイン確定後に manifest を更新する。
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "パクっと国文法",
        short_name: "パクっと国文法",
        description: "中学生向け日本語文法学習アプリ",
        lang: "ja",
        start_url: "/",
        display: "standalone",
        background_color: "#FBF4E4",
        theme_color: "#A8E0C8",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // 出題データ・エンジン本体(コア機能)をオフラインでも動作させる。
        // 画像(src/assets/images)はビルド時に dist/assets/images/ へ出るので、ここでオフライン用に保存される。
        // 1ファイルの上限を大きめに取る(既定2MB。背景画像・日本語フォント(約0.9MB)などが保存から漏れないように)。
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,webp,gif,json,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Firebase(ランキング用・約0.7MB)は、ランキングを開いたときに、通信して読み込む。オフラインでは使えないので、最初の保存(プリキャッシュ)には含めない
        // QRコードの読み取り(jsQR・約0.13MB)も、引き継ぎで読み取るときだけ通信して読み込む。(初回の読み込みを軽くする)。
        globIgnores: ["**/firebase-*.js", "**/jsQR-*.js"],
        runtimeCaching: [
          {
            // 音声(src/assets/audio)は dist/assets/audio/ へ出る。BGMは容量が大きく、iOSのSafariは
            // サービスワーカー経由の部分読み込み(Range)が苦手なので、あらかじめ保存(プリキャッシュ)はせず、
            // 効果音の読み込み(通常のGET)だけ、一度読み込んだあとはオフラインでも使えるよう保存する。
            urlPattern: /\/assets\/audio\/se\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "se-cache",
              expiration: { maxEntries: 60 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    // 素材は種類ごとのフォルダへ出す(上のオフライン保存の設定と対応させる)。小さい素材もファイルのまま出す。
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Firebase は、動的import(ランキングを使うとき)で読み込まれる、専用のまとまりにする
        manualChunks(id) {
          if (id.includes("node_modules/@firebase/") || id.includes("node_modules/firebase/")) return "firebase";
        },
        assetFileNames: (asset) => {
          const name = asset.names?.[0] ?? asset.name ?? "";
          // 元のファイルの置き場所(src/assets/audio/se/ かどうか)で効果音を見分ける
          const original = asset.originalFileNames?.[0] ?? name;
          if (/\.(mp3|m4a|ogg|wav)$/i.test(name)) {
            return `assets/audio/${/audio[\\/]se[\\/]/.test(original) ? "se/" : ""}[name]-[hash][extname]`;
          }
          if (/\.(png|jpe?g|webp|gif|svg)$/i.test(name)) return "assets/images/[name]-[hash][extname]";
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
