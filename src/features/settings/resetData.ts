import { useRankingStore } from "@/app/store/rankingStore";
import { shutdownAudio } from "@/lib/audio";
import { rankingApi, type RankingApi } from "@/lib/rankingApi";

/**
 * データの初期化(発表本番の前や、デバッグでの確認に使う)。
 * 端末に保存しているゲームのデータ(進捗・得点・ストーリーの既読・復習の星・図鑑・マスコットの成長・
 * 操作ガイドの既読・アイコン・ランキング参加状態・途中経過)をすべて消して、最初の状態に戻す。
 * 音量・ミュートの設定(settings)も、最初の状態(既定の音量・ミュートなし)に戻す。以前は設定だけ残していたため、
 * ミュートや小さい音量にしたまま初期化すると、初期化後にBGMが鳴らない(音量0のよう)ように見えてしまった。
 */
const KEY_PREFIX = "paku-kokubunpo:";
/** 初期化しても残すキー。いまは無い(音量・ミュートも含めて、すべて最初の状態に戻す) */
export const KEPT_KEYS: readonly string[] = [];

export interface ResetResult {
  /** 端末から消したキー */
  removedKeys: string[];
  /**
   * ランキングに参加していたか、そして順位表の自分のデータを消せたか。
   * "not-joined"=参加していなかった / "left"=クラスから抜けて消した / "failed"=通信できず、順位表には残ったまま
   */
  ranking: "not-joined" | "left" | "failed";
}

/** ゲームのデータを初期化する。ランキング参加中なら、先にクラスから抜ける(通信できなくても、端末のデータは初期化する) */
export async function resetAllData(api: Pick<RankingApi, "leaveClass"> = rankingApi): Promise<ResetResult> {
  const { classCode } = useRankingStore.getState();
  let ranking: ResetResult["ranking"] = "not-joined";
  if (classCode) {
    try {
      await api.leaveClass(classCode);
      ranking = "left";
    } catch {
      ranking = "failed";
    }
  }

  const removedKeys: string[] = [];
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(KEY_PREFIX) && !KEPT_KEYS.includes(key)) {
        localStorage.removeItem(key);
        removedKeys.push(key);
      }
    }
  } catch {
    // 端末の保存が使えない環境では、消すものがない
  }
  return { removedKeys, ranking };
}

/** 初期化のあと、画面を読み込み直して、メモリ上のデータも最初の状態にする(テストで差し替えられるよう分けてある) */
export function reloadApp(reload: () => void = () => window.location.reload()): void {
  shutdownAudio(); // 鳴っているBGMを止め、古い音声の状態を持ち越さない
  reload();
}
