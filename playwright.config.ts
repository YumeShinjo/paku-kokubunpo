import { defineConfig, devices } from "@playwright/test";

/**
 * E2E・ビジュアル回帰テスト(手動のiPhone確認だけに頼らず、主要画面のレイアウト崩れ・操作フローを自動で検知する)。
 * 実行: npx playwright test(初回だけ npx playwright install chromium が要る)
 * 画面のスクリーンショットは e2e フォルダの下の *-snapshots フォルダに保存し、比較の基準としてリポジトリに含める
 * (レイアウトを意図して変えたときは、`npx playwright test --update-snapshots` で基準を作り直す)。
 *
 * 開発用サーバーは、専用のポート(5183)で、このテストのためだけに起動する(通常の開発サーバーとは別)。
 * ランキング(Firebase)は、実際のプロジェクトへ接続せず、「まだ使えない」状態のまま確認する
 * (テストの実行で、本番のFirestoreにデータを書き込んでしまわないように)。
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 30_000,
  expect: {
    // 実機とは違うフォントの描画などで、ピクセル単位ではわずかにずれるため、少しの差は許容する
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" },
  },
  use: {
    baseURL: "http://localhost:5183",
    trace: "retain-on-failure",
    // iPhone SEクラスの小さい画面を基準にする(小さい画面での窮屈さ・はみ出しを見つけるため)
    viewport: { width: 375, height: 667 },
    colorScheme: "light",
  },
  projects: [
    {
      name: "mobile-small",
      use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 667 } },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 5183 --strictPort",
    url: "http://localhost:5183",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      // ランキング(Firebase)を「未設定」にして、テストが本番のFirestoreへ接続しないようにする
      VITE_FIREBASE_API_KEY: "",
      VITE_FIREBASE_AUTH_DOMAIN: "",
      VITE_FIREBASE_PROJECT_ID: "",
      VITE_FIREBASE_STORAGE_BUCKET: "",
      VITE_FIREBASE_MESSAGING_SENDER_ID: "",
      VITE_FIREBASE_APP_ID: "",
    },
  },
});
