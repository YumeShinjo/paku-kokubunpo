import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase";
import { JOIN_MAX_SCORE } from "@/features/ranking/scoreLimits";

/**
 * ランキング(8章)のFirestoreアクセス。
 *
 * データの形: classes/{クラスコード}/members/{匿名認証のuid} = { nickname, icon, score, updatedAt }
 *  (icon は主人公のアイコンの id。古い版が書いたデータには無いことがある)
 *  - クラスコードをパスにしているので、「同じクラスコードのグループ内だけ」を読み書きでき、
 *    クラスの一覧は取れない(合言葉を知っている人だけがそのクラスの順位を見られる)。
 *  - 自分のドキュメントだけを書き換え・削除できる(firestore.rules で強制)。
 *  - 読み取りの回数を抑えるため、リアルタイム購読はしない(開いたとき・「こうしん」を押したときだけ取得)。
 *
 * Firebase SDK(認証・Firestore)は、ランキングを使うときに初めて読み込む(動的import)。
 * ふだんの出題や、オフラインで遊ぶだけのときは読み込まれない。
 */

export type RankingErrorCode =
  /** VITE_FIREBASE_* が未設定(ランキングを使えない) */
  | "not-configured"
  /** 通信できない(オフラインなど) */
  | "offline"
  /** セキュリティルールに拒否された(得点が不正・他人のデータなど) */
  | "denied"
  /** 匿名認証がまだ有効になっていない */
  | "auth-disabled"
  | "unknown";

export class RankingError extends Error {
  constructor(
    readonly code: RankingErrorCode,
    cause?: unknown,
  ) {
    super(code);
    this.name = "RankingError";
    this.cause = cause;
  }
}

/** 通信が返ってこないときに待つ長さ(ミリ秒)。これを過ぎたら「つうしんできない」として扱う */
export const NETWORK_TIMEOUT_MS = 10_000;

/**
 * 通信を一定時間で打ち切る。Firestoreは、電波が不安定だったり途切れたりしているとき、書き込みなどが
 * 「返ってこないまま待ち続ける」ことがある(エラーにならない)。画面が固まったり、得点の送信が
 * 詰まったままにならないよう、必ず時間で区切って「offline」として扱う。
 */
export function withTimeout<T>(promise: Promise<T>, ms: number = NETWORK_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new RankingError("offline")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** 通信を伴う処理を、エラーの分類と時間切れつきで実行する */
function guard<T>(run: () => Promise<T>): Promise<T> {
  return withTimeout(run().catch((error) => Promise.reject(toRankingError(error))));
}

/** Firebaseのエラーを、画面で扱いやすい種類に分ける */
export function toRankingError(error: unknown): RankingError {
  if (error instanceof RankingError) return error;
  const code = (error as { code?: string } | null)?.code ?? "";
  if (code === "unavailable" || code === "auth/network-request-failed" || code === "deadline-exceeded") {
    return new RankingError("offline", error);
  }
  if (code === "permission-denied") return new RankingError("denied", error);
  if (code === "auth/operation-not-allowed" || code === "auth/admin-restricted-operation") {
    return new RankingError("auth-disabled", error);
  }
  return new RankingError("unknown", error);
}

/** 順位表に出る、自分の情報(ニックネームと、主人公のアイコンの id) */
export interface RankingProfile {
  nickname: string;
  icon: string;
}

export interface RankingEntry {
  uid: string;
  nickname: string;
  /** アイコンの id。古いデータで無いときは空文字(表示側が標準のアイコンにする) */
  icon: string;
  score: number;
  /** 同点は同じ順位(1, 2, 2, 4 …) */
  rank: number;
  isMe: boolean;
}

export interface RankingSnapshot {
  entries: RankingEntry[];
  /** 自分の情報。ランキングに自分のデータがなければ null(退出済みなど) */
  me: { nickname: string; icon: string; score: number; rank: number } | null;
}

/** 画面・同期処理が使うAPI。テストでは偽物に差し替える。 */
export interface RankingApi {
  isConfigured(): boolean;
  /** クラスに参加する(すでにあればニックネーム・アイコンを更新し、得点は大きいほうを残す)。参加後の得点を返す。ニックネームの変更にも使う */
  joinClass(classCode: string, profile: RankingProfile, localScore: number): Promise<number>;
  /** 自分の得点を送る(ドキュメントがなければ作り直す) */
  submitScore(classCode: string, profile: RankingProfile, score: number): Promise<void>;
  fetchRanking(classCode: string, limit?: number): Promise<RankingSnapshot>;
  /** クラスから抜ける(自分のデータを削除する) */
  leaveClass(classCode: string): Promise<void>;
}

/** 同点を同順位にして、1, 2, 2, 4 … の順位をつける(得点の高い順に並んでいる前提) */
export function assignRanks(
  rows: { uid: string; nickname: string; score: number; icon?: string }[],
  myUid: string | null,
): RankingEntry[] {
  let rank = 0;
  let previous: number | null = null;
  return rows.map((row, index) => {
    if (row.score !== previous) {
      rank = index + 1;
      previous = row.score;
    }
    return { ...row, icon: row.icon ?? "", rank, isMe: row.uid === myUid };
  });
}

const MEMBERS = (classCode: string) => ["classes", classCode, "members"] as const;

let sdkPromise: Promise<{
  auth: import("firebase/auth").Auth;
  signInAnonymously: typeof import("firebase/auth").signInAnonymously;
  db: import("firebase/firestore").Firestore;
  fs: typeof import("firebase/firestore");
}> | null = null;

function loadSdk() {
  if (!sdkPromise) {
    sdkPromise = (async () => {
      const app = await getFirebaseApp().catch((error) => {
        throw new RankingError("offline", error);
      });
      if (!app) throw new RankingError("not-configured");
      // Firebase は、ランキングを使うときに通信して読み込む(最初の保存には含めていない)。読み込めない=通信できない、として扱う
      const [authModule, fs] = await Promise.all([import("firebase/auth"), import("firebase/firestore")]).catch((error) => {
        throw new RankingError("offline", error);
      });
      return {
        auth: authModule.getAuth(app),
        signInAnonymously: authModule.signInAnonymously,
        // 学校・会場のネットワークによっては、Firestoreの通常の接続方式(ストリーム)が通らないことがある。
        // その場合に、自動でロングポーリング方式へ切り替える(接続の安定性を上げる)。
        db: fs.initializeFirestore(app, { experimentalAutoDetectLongPolling: true }),
        fs,
      };
    })();
    // 読み込みに失敗したとき(オフラインなど)は、次回やり直せるようにする
    sdkPromise.catch(() => {
      sdkPromise = null;
    });
  }
  return sdkPromise;
}

/** 匿名認証でサインインして uid を返す(すでにサインイン済みならそのまま) */
async function ensureUid(): Promise<string> {
  const { auth, signInAnonymously } = await loadSdk();
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
  return auth.currentUser!.uid;
}

export const rankingApi: RankingApi = {
  isConfigured: () => isFirebaseConfigured(),

  joinClass(classCode, profile, localScore) {
    return guard(async () => {
      const uid = await ensureUid();
      const { db, fs } = await loadSdk();
      const ref = fs.doc(db, ...MEMBERS(classCode), uid);
      const existing = await fs.getDoc(ref);
      // 新しく作るときの得点には上限がある(不正対策。firestore.rules と同じ)。たまっている分は、参加後に少しずつ送られる
      const score = existing.exists()
        ? Number(existing.data().score) || 0 // すでにあるときは、サーバーの得点のまま(増やす分は、参加後の送信で、上限の範囲で進める)
        : Math.min(localScore, JOIN_MAX_SCORE);
      await fs.setDoc(ref, { nickname: profile.nickname, icon: profile.icon, score, updatedAt: fs.serverTimestamp() });
      return score;
    });
  },

  submitScore(classCode, profile, score) {
    return guard(async () => {
      const uid = await ensureUid();
      const { db, fs } = await loadSdk();
      await fs.setDoc(fs.doc(db, ...MEMBERS(classCode), uid), {
        nickname: profile.nickname,
        icon: profile.icon,
        score,
        updatedAt: fs.serverTimestamp(),
      });
    });
  },

  fetchRanking(classCode, limit = 30) {
    return guard(async () => {
      const uid = await ensureUid();
      const { db, fs } = await loadSdk();
      const members = fs.collection(db, ...MEMBERS(classCode));
      const top = await fs.getDocs(fs.query(members, fs.orderBy("score", "desc"), fs.limit(limit)));
      const rows = top.docs.map((d) => ({
        uid: d.id,
        nickname: String(d.data().nickname ?? ""),
        icon: String(d.data().icon ?? ""),
        score: Number(d.data().score) || 0,
      }));
      const entries = assignRanks(rows, uid);

      const mine = entries.find((e) => e.isMe);
      if (mine) return { entries, me: { nickname: mine.nickname, icon: mine.icon, score: mine.score, rank: mine.rank } };

      // 上位に入っていないとき: 自分のデータと、自分より得点が高い人数から順位を出す
      const own = await fs.getDoc(fs.doc(db, ...MEMBERS(classCode), uid));
      if (!own.exists()) return { entries, me: null };
      const score = Number(own.data().score) || 0;
      const higher = await fs.getCountFromServer(fs.query(members, fs.where("score", ">", score)));
      return {
        entries,
        me: {
          nickname: String(own.data().nickname ?? ""),
          icon: String(own.data().icon ?? ""),
          score,
          rank: higher.data().count + 1,
        },
      };
    });
  },

  leaveClass(classCode) {
    return guard(async () => {
      const uid = await ensureUid();
      const { db, fs } = await loadSdk();
      await fs.deleteDoc(fs.doc(db, ...MEMBERS(classCode), uid));
    });
  },
};
