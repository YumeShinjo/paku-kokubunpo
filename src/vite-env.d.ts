/// <reference types="vite/client" />

declare module "*.md?public" {
  const text: string;
  export default text;
}

/** package.json の version(vite.config.ts の define で埋め込む) */
declare const __APP_VERSION__: string;
/** git の短いコミットID(ビルドのときだけ。開発サーバー・テストでは "dev") */
declare const __APP_COMMIT__: string;
/** ビルドの日時(日本時間。"2026-10-23 12:34"。開発サーバー・テストでは、ビルドしていない時刻) */
declare const __APP_BUILD_TIME__: string;

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
