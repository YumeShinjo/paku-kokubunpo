import type { FirebaseApp } from "firebase/app";

/**
 * Firebase接続の雛形(8章: ランキング機能用)。
 * 実際のプロジェクト作成・APIキー設定・Firestoreセキュリティルールは
 * ランキング機能に着手する段階で行う(現時点は未接続)。
 * VITE_FIREBASE_* が未設定の間は getFirebaseApp() が null を返す(ランキングは「まだ使えない」表示になる)。
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;

/** VITE_FIREBASE_* が設定されているか(ランキングを使えるか)。SDKは読み込まずに判定できる。 */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

/**
 * Firebaseアプリを初期化して返す。未設定なら null。
 * SDKは、ランキングを使うときに初めて読み込む(動的import)。出題だけ遊ぶときの読み込み量を増やさないため。
 */
export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    const { initializeApp } = await import("firebase/app");
    app = initializeApp(firebaseConfig);
  }
  return app;
}
