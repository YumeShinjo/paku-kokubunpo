/**
 * BGMのピッチが変わる件の調査用ログ(URLに `?audiodebug=1` を付けて開いたときだけ動く。ふだんは何もしない)。
 *
 * 使うのは、ブラウザが自分で出すイベントだけ(setInterval・requestAnimationFrame・定期的な処理は使わない):
 *  - <audio> の ratechange(再生速度が変わった)・timeupdate(再生位置が進んだ。1秒に4回ほど)
 *  - AudioContext の statechange(running / suspended / interrupted / closed)
 *  - document の visibilitychange・window の pagehide / pageshow
 * 記録するのは、時刻・イベント名・AudioContext の状態とサンプルレート・<audio> の playbackRate(と defaultPlaybackRate)。
 * timeupdate のときは、約2秒ぶんの「再生位置の進み ÷ 実際に経った時間」を計算して、1.0 でなければ(ピッチ・速さが変わっていれば)その比も記録する。
 * 記録は、メモリ上の500件までのリング(古いものから消える)。設定画面の、`?audiodebug=1` のときだけ出るボタンで、テキストとしてコピーできる。
 */

const MAX_ENTRIES = 500;
/** 再生位置の進みの比が 1.0 からこれ以上ずれたら記録する */
const RATIO_TOLERANCE = 0.02;
/**
 * 比は、これだけ(ミリ秒)の時間をまとめて測る。timeupdate は、1秒に4回ほどで、1回ごとの間隔に数ミリ秒のゆらぎがあり、
 * 1回ずつ比べると、ふつうに鳴っていても 0.97〜1.03 になってしまう(実測)。2秒ぶんをまとめれば、ゆらぎは 0.5% ほどに収まる。
 */
const RATIO_WINDOW_MS = 2000;
/** 前回の timeupdate からこれ以上あいたら(裏に回っていたなど)、測り直す */
const MAX_GAP_MS = 1500;

export interface AudioDebugEntry {
  /** 記録した時刻(ISO形式。コピーしたテキストでは時刻だけ) */
  at: number;
  event: string;
  /** AudioContext の状態(まだ作られていなければ "-") */
  ctxState: string;
  ctxRate: number | null;
  playbackRate: number | null;
  defaultPlaybackRate: number | null;
  /** 再生位置の進み ÷ 経った時間(timeupdate で 1.0 からずれたときだけ) */
  ratio?: number;
  /** その他の補足(曲のファイル名など) */
  note?: string;
}

const entries: AudioDebugEntry[] = [];
let startedAt = 0;

/** URLに `audiodebug=1` があるか。画面を開いたときのURLで決まる(あとからは変わらない) */
export function isAudioDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("audiodebug") === "1";
  } catch {
    return false;
  }
}

let enabled: boolean | null = null;
function on(): boolean {
  if (enabled === null) enabled = isAudioDebugEnabled();
  return enabled;
}

// 記録の元になる、いまの <audio> と AudioContext(ログを書くときに、状態を読むだけ)
let audioRef: HTMLAudioElement | null = null;
let ctxRef: AudioContext | null = null;

function push(event: string, extra?: Pick<AudioDebugEntry, "ratio" | "note">): void {
  const entry: AudioDebugEntry = {
    at: Date.now(),
    event,
    ctxState: ctxRef ? ctxRef.state : "-",
    ctxRate: ctxRef ? ctxRef.sampleRate : null,
    playbackRate: audioRef ? audioRef.playbackRate : null,
    defaultPlaybackRate: audioRef ? audioRef.defaultPlaybackRate : null,
    ...extra,
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
}

/** アプリ側の目印(曲の切り替え・再生速度のリセットなど)。有効なときだけ記録する */
export function logAudioDebug(event: string, note?: string): void {
  if (!on()) return;
  push(event, note ? { note } : undefined);
}

let pageListenersAttached = false;
function attachPageListeners(): void {
  if (pageListenersAttached || typeof document === "undefined") return;
  pageListenersAttached = true;
  document.addEventListener("visibilitychange", () => push("visibilitychange", { note: document.visibilityState }));
  window.addEventListener("pagehide", () => push("pagehide"));
  window.addEventListener("pageshow", () => push("pageshow"));
  startedAt = Date.now();
  push("start", { note: navigator.userAgent });
}

/** BGM用の <audio> を作ったときに呼ぶ。有効でなければ、何もしない */
export function watchAudioElement(audio: HTMLAudioElement): void {
  if (!on()) return;
  attachPageListeners();
  audioRef = audio;
  push("audio-created");
  audio.addEventListener("ratechange", () => push("ratechange"));

  // 比の測り始め(baseWall・basePos)と、直前の timeupdate(lastWall・lastPos)
  let baseWall = 0;
  let basePos = 0;
  let lastWall = 0;
  let lastPos = -1;
  audio.addEventListener("timeupdate", () => {
    const wall = performance.now();
    const pos = audio.currentTime;
    // 一時停止中・ループで巻き戻った・長くあいた(裏に回っていた)ときは、比を出さずに、測り直す
    const continuous = lastPos >= 0 && !audio.paused && pos > lastPos && wall > lastWall && wall - lastWall < MAX_GAP_MS;
    lastWall = wall;
    lastPos = pos;
    if (!continuous) {
      baseWall = wall;
      basePos = pos;
      return;
    }
    if (wall - baseWall < RATIO_WINDOW_MS) return;
    const ratio = (pos - basePos) / ((wall - baseWall) / 1000);
    if (Math.abs(ratio - 1) > RATIO_TOLERANCE) push("timeupdate", { ratio: Math.round(ratio * 1000) / 1000 });
    baseWall = wall;
    basePos = pos;
  });
}

/** AudioContext を作ったときに呼ぶ。有効でなければ、何もしない */
export function watchAudioContext(ctx: AudioContext): void {
  if (!on()) return;
  attachPageListeners();
  ctxRef = ctx;
  push("context-created", { note: `sampleRate=${ctx.sampleRate}` });
  ctx.addEventListener?.("statechange", () => push("statechange", { note: ctx.state }));
}

/** 記録を、コピーできるテキストにする(1行に1件。先頭に、端末などの情報) */
export function formatAudioDebug(list: readonly AudioDebugEntry[] = entries): string {
  const time = (ms: number) => new Date(ms).toISOString().slice(11, 23);
  const lines = list.map((e) => {
    const parts = [
      time(e.at),
      e.event,
      `ctx=${e.ctxState}`,
      `ctxRate=${e.ctxRate ?? "-"}`,
      `rate=${e.playbackRate ?? "-"}`,
      `defRate=${e.defaultPlaybackRate ?? "-"}`,
    ];
    if (e.ratio !== undefined) parts.push(`ratio=${e.ratio}`);
    if (e.note) parts.push(`note=${e.note}`);
    return parts.join(" ");
  });
  return [
    `audiodebug ${new Date().toISOString()}`,
    `開始: ${startedAt ? new Date(startedAt).toISOString() : "-"} / 件数: ${list.length}(最大${MAX_ENTRIES}件。古いものから消える)`,
    `ratio は、timeupdate で、約${RATIO_WINDOW_MS / 1000}秒ぶんの「再生位置の進み ÷ 実際に経った時間」が 1.0 から ±${RATIO_TOLERANCE} 以上ずれたときだけ記録`,
    ...lines,
  ].join("\n");
}

export function getAudioDebugEntries(): readonly AudioDebugEntry[] {
  return entries;
}

/** テスト用: 記録と状態を空にする */
export function resetAudioDebugForTest(force?: boolean): void {
  entries.length = 0;
  audioRef = null;
  ctxRef = null;
  startedAt = 0;
  pageListenersAttached = false;
  enabled = force === undefined ? null : force;
}

/** 記録のテキストを、クリップボードへコピーする。コピーできたか(true)を返す */
export async function copyAudioDebug(): Promise<boolean> {
  const text = formatAudioDebug();
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // クリップボードAPIが使えない・許可されないときは、一時的な入力欄を使う昔の方法で試す
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
