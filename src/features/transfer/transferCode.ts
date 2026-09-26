import { useMascotStore } from "@/app/store/mascotStore";
import { useProfileStore } from "@/app/store/profileStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { useSessionStore } from "@/app/store/sessionStore";
import { useStatsStore } from "@/app/store/statsStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { getAllQuestions } from "@/data/questionLoader";
import { engineGuides, type GuideKey } from "@/data/engineGuide";
import { isPlayerIconId } from "@/data/playerIcons";
import { getStage } from "@/data/stages";
import { MASCOT_ACCESSORY_STAGES } from "@/assets/registry";
import { RECENT_LIMIT } from "@/features/selection/selectQuestions";
import { UNIT_ACCURACY_WINDOW } from "@/features/zukan/unitAccuracy";
import { decodeTransferPayloadV2, encodeTransferCodeV2 } from "./transferV2";

/**
 * データの引き継ぎコード(機種変更・アプリの入れ直しのとき、進み具合を新しい端末へ移す)。
 *
 * 進み具合は、端末のなかだけに保存されている(サーバーにはアカウントを作らない)。そこで、保存しているデータを
 * 1本の文字列(引き継ぎコード)にまとめて、新しい端末に貼り付けて戻す。サーバーを通らないので、通信は要らず、
 * データがサーバーに残ることもない。コードは自分のデータそのものなので、人に見せないよう画面で案内する。
 *
 * 移すもの: 進捗(クリアしたステージ・得点)/マスコットの成長/ストーリーの既読と選択/苦手問題の星/
 *           正答率の記録/操作ガイドの既読/アイコン。
 * 移さないもの: 音量などの設定(端末ごとに違ってよい)/途中経過(その場限り)/ランキング参加(端末ごとの匿名の認証を使うので、
 *           新しい端末で、もう一度クラスに入る。得点は移した値から続く)。
 *
 * 形式: "PAKU" + 版 + 圧縮の種類(Z=圧縮 / R=そのまま) + "." + 本体(base64url) + "." + 確認用の文字(壊れ・写し間違いの検出)。
 *  - 版2(いまの発行。transferV2.ts): id を3バイトの指紋にして持つ。コードが短く、QRコードにも収まる
 *  - 版1(以前の発行): id をそのまま JSON にして圧縮したもの。読み取りだけ引き続き対応する
 */
export const TRANSFER_PREFIX = "PAKU2";

export interface TransferData {
  /** 進捗 */
  cleared: string[];
  score: number;
  /** マスコットの成長段階(0〜7) */
  growth: number;
  /** ストーリー */
  seen: string[];
  choices: Record<string, string>;
  /** 苦手問題の星 */
  starred: string[];
  /** 正答率の記録 */
  recent: string[];
  /** 単元ごとの直近の正誤。正解=1・不正解=0 を並べた文字列("1011…")で持つ(コードを短くするため) */
  unitRecent: Record<string, string>;
  /** 操作ガイドの既読 */
  guides: string[];
  icon: string;
}

/** 復元した内容の確認表示に使う、概要 */
export interface TransferSummary {
  clearedStages: number;
  score: number;
  growth: number;
  starred: number;
}

export type DecodeError = "empty" | "format" | "broken" | "unsupported";
export class TransferError extends Error {
  constructor(readonly code: DecodeError) {
    super(code);
    this.name = "TransferError";
  }
}

// ---------------------------------------------------------------- 取り出し・書き戻し

/** いまの端末のデータを取り出す */
export function collectTransferData(): TransferData {
  const progress = useProgressStore.getState();
  const story = useStoryStore.getState();
  const stats = useStatsStore.getState();
  return {
    cleared: [...progress.clearedStageIds],
    score: progress.totalScore,
    growth: useMascotStore.getState().growthStage,
    seen: [...story.seenStoryIds],
    choices: { ...story.choices },
    starred: [...useReviewStore.getState().starredQuestionIds],
    recent: [...stats.recentQuestionIds],
    unitRecent: Object.fromEntries(
      Object.entries(stats.unitRecent).map(([unit, list]) => [unit, list.map((ok) => (ok ? "1" : "0")).join("")]),
    ),
    guides: [...useTutorialStore.getState().seenGuides],
    icon: useProfileStore.getState().iconId,
  };
}

/** データを、この端末に書き戻す(いまのデータは上書きされる)。端末の保存にも、そのまま反映される */
export function applyTransferData(data: TransferData): void {
  useProgressStore.setState({ clearedStageIds: data.cleared, totalScore: data.score });
  useMascotStore.setState({ growthStage: data.growth });
  useStoryStore.setState({ seenStoryIds: data.seen, choices: data.choices });
  useReviewStore.setState({ starredQuestionIds: data.starred });
  useStatsStore.setState({
    recentQuestionIds: data.recent,
    unitRecent: Object.fromEntries(
      Object.entries(data.unitRecent).map(([unit, bits]) => [unit, [...bits].map((c) => c === "1")]),
    ),
  });
  useTutorialStore.setState({ seenGuides: data.guides as GuideKey[] });
  useProfileStore.setState({ iconId: data.icon });
  useSessionStore.getState().clear(); // 途中経過は、別の端末の進み具合とはつながらないので消す
}

export function summarize(data: TransferData): TransferSummary {
  return { clearedStages: data.cleared.length, score: data.score, growth: data.growth, starred: data.starred.length };
}

// ---------------------------------------------------------------- 検証(コードは外から来る値なので、形も範囲も確かめる)

const MAX_LIST = 5000;
const MAX_TEXT = 120;
const MAX_SCORE = 10_000_000;

const isText = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= MAX_TEXT;
const textList = (v: unknown): string[] | null =>
  Array.isArray(v) && v.length <= MAX_LIST && v.every(isText) ? [...new Set(v as string[])] : null;

/** 外から来た値を、TransferData として確かめる。おかしければ null。存在しないステージ・問題のidは、取り除く */
export function validateTransferData(raw: unknown): TransferData | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const cleared = textList(r.cleared);
  const seen = textList(r.seen);
  const starred = textList(r.starred);
  const recent = textList(r.recent);
  const guides = textList(r.guides);
  if (!cleared || !seen || !starred || !recent || !guides) return null;

  const score = r.score;
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0 || score > MAX_SCORE) return null;
  const growth = r.growth;
  if (typeof growth !== "number" || !Number.isInteger(growth) || growth < 0 || growth > MASCOT_ACCESSORY_STAGES) return null;
  if (!isPlayerIconId(r.icon)) return null;

  const choicesRaw = r.choices;
  if (typeof choicesRaw !== "object" || choicesRaw === null || Array.isArray(choicesRaw)) return null;
  const choices: Record<string, string> = {};
  for (const [key, value] of Object.entries(choicesRaw)) {
    if (!isText(key) || !isText(value)) return null;
    choices[key] = value;
  }

  const unitRaw = r.unitRecent;
  if (typeof unitRaw !== "object" || unitRaw === null || Array.isArray(unitRaw)) return null;
  const unitRecent: Record<string, string> = {};
  for (const [unit, bits] of Object.entries(unitRaw)) {
    if (!isText(unit) || typeof bits !== "string" || !/^[01]*$/.test(bits) || bits.length > 1000) return null;
    unitRecent[unit] = bits.slice(-UNIT_ACCURACY_WINDOW);
  }

  const questionIds = new Set(getAllQuestions().map((q) => q.id));
  return {
    cleared: cleared.filter((id) => getStage(id) !== undefined),
    score,
    growth,
    seen,
    choices,
    starred: starred.filter((id) => questionIds.has(id)),
    recent: recent.filter((id) => questionIds.has(id)).slice(-RECENT_LIMIT),
    unitRecent,
    guides: guides.filter((g) => g in engineGuides),
    icon: r.icon as string,
  };
}

// ---------------------------------------------------------------- 文字列への変換

export const toBase64Url = (bytes: Uint8Array<ArrayBuffer>): string => {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

export const fromBase64Url = (text: string): Uint8Array<ArrayBuffer> => {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

/** 確認用の文字(FNV-1a を、英数字4文字にしたもの)。写し間違い・途中で切れたコードを見つける */
export function checksum(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).padStart(7, "0").slice(-4).toUpperCase();
}

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
  const source = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(source).arrayBuffer());
}

const canCompress = () => typeof CompressionStream !== "undefined" && typeof DecompressionStream !== "undefined";

/** データを、引き継ぎコード(版2)にする */
export async function encodeTransferCode(data: TransferData = collectTransferData()): Promise<string> {
  return encodeTransferCodeV2(data);
}

/** 版1のコードを作る。いまの発行は版2で、以前のコードを読めることを確かめるテストのために残している */
export async function encodeTransferCodeV1(data: TransferData = collectTransferData()): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let method = "R";
  let body = bytes;
  if (canCompress()) {
    try {
      body = await pipe(bytes, new CompressionStream("deflate-raw"));
      method = "Z";
    } catch {
      body = bytes;
    }
  }
  const payload = toBase64Url(body);
  return `PAKU1${method}.${payload}.${checksum(payload)}`;
}

/** 引き継ぎコードを読み取る。写し間違い・壊れたコード・別の形式は、TransferError を投げる */
export async function decodeTransferCode(input: string): Promise<TransferData> {
  // 貼り付けのとき混ざりやすい空白・改行・全角の空白を取り除く
  const code = input.replace(/\s+/g, ""); // \s には、全角の空白も含まれる
  if (code === "") throw new TransferError("empty");
  const match = code.match(/^PAKU(\d+)([ZR])\.([A-Za-z0-9_-]+)\.([A-Za-z0-9]{4})$/);
  if (!match) throw new TransferError("format");
  const [, version, method, payload, sum] = match;
  if (version !== "1" && version !== "2") throw new TransferError("unsupported");
  if (checksum(payload) !== sum.toUpperCase()) throw new TransferError("broken");
  if (version === "2") return decodeTransferPayloadV2(payload);

  let json: string;
  try {
    let bytes = fromBase64Url(payload);
    if (method === "Z") {
      if (!canCompress()) throw new TransferError("unsupported");
      bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    }
    json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (error) {
    if (error instanceof TransferError) throw error;
    throw new TransferError("broken");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new TransferError("broken");
  }
  const data = validateTransferData(parsed);
  if (!data) throw new TransferError("broken");
  return data;
}

/** エラーの種類に合わせた、子どもに伝わるメッセージ */
export function transferErrorMessage(error: unknown): string {
  const code = error instanceof TransferError ? error.code : "broken";
  switch (code) {
    case "empty":
      return "コードを入れてね。";
    case "format":
      return "コードの形がちがうよ。「PAKU1」ではじまるコードを、そのまま貼り付けてね。";
    case "unsupported":
      return "このコードは、この端末では読めないよ。アプリを新しくしてから、もう一度ためしてね。";
    default:
      return "コードが読み取れなかったよ。写し間違い・途中で切れていないか、たしかめてね。";
  }
}
