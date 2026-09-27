import { getFirebaseApp, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import { withTimeout } from "@/lib/rankingApi";

/**
 * 経験値(クリア画面の演出強化)のFirestoreアクセス。
 *
 * データの形: players/{匿名認証のuid} = { exp: 累計経験値, updatedAt }
 *  - ランキング(classes/{クラスコード}/members)とは別の、自分のドキュメントだけを読み書きできる置き場所。
 *    クラスに参加していなくても(ランキングを使っていなくても)経験値は貯まる。
 *  - 書き込みは、いまの累計を送るだけ(features/exp/expSync.ts)。サーバー側の値を読み出して
 *    ローカルへ反映することはしない。読み出しもしてしまうと、端末でデータを初期化したときに、
 *    古いサーバー側の値でローカルの初期化が上書きされる食い違いが起きるため。
 *
 * Firebase SDK(認証・Firestore)は、ランキングと同じく、実際に送るときに初めて読み込む(動的import)。
 */
export interface ExpApi {
  isConfigured(): boolean;
  /** いまの累計経験値を送る(ドキュメントがなければ作る) */
  submitExp(exp: number): Promise<void>;
}

let authPromise: Promise<{
  auth: import("firebase/auth").Auth;
  signInAnonymously: typeof import("firebase/auth").signInAnonymously;
}> | null = null;

function loadAuth() {
  if (!authPromise) {
    authPromise = (async () => {
      const app = await getFirebaseApp();
      if (!app) throw new Error("not-configured");
      const authModule = await import("firebase/auth");
      return { auth: authModule.getAuth(app), signInAnonymously: authModule.signInAnonymously };
    })();
    authPromise.catch(() => {
      authPromise = null;
    });
  }
  return authPromise;
}

/** 匿名認証でサインインして uid を返す(すでにサインイン済みならそのまま。ランキングと同じ利用者) */
async function ensureUid(): Promise<string> {
  const { auth, signInAnonymously } = await loadAuth();
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser!.uid;
}

export const expApi: ExpApi = {
  isConfigured: () => isFirebaseConfigured(),

  submitExp(exp) {
    return withTimeout(
      (async () => {
        const uid = await ensureUid();
        const db = await getFirestoreDb();
        if (!db) throw new Error("not-configured");
        const fs = await import("firebase/firestore");
        await fs.setDoc(fs.doc(db, "players", uid), { exp, updatedAt: fs.serverTimestamp() });
      })(),
    );
  },
};
