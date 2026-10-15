/**
 * BGMのピッチが変わる件の調査用ログ(ふだんは何もしない。有効にしたときだけ動く)。
 *
 * 有効にする方法は2つ:
 *  - URLに `?audiodebug=1` を付けて、一度開く(「有効」を端末に保存するので、ホーム画面から起動したアプリ(PWA)でも、有効のまま。`?audiodebug=0` で無効に戻る)
 *  - 設定画面の「音のログ」のスイッチ(その項目は、`?audiodebug=1` で開いたあとか、設定画面のバージョン表記を5回続けてタップしたあとだけ出る)
 * 無効に戻すと、記録も空にする。
 *
 * 使うのは、ブラウザが自分で出すイベントだけ(setInterval・requestAnimationFrame・定期的な処理は使わない):
 *  - <audio> の ratechange(再生速度が変わった)・timeupdate(再生位置が進んだ。1秒に4回ほど)
 *  - AudioContext の statechange(running / suspended / interrupted / closed)
 *  - document の visibilitychange・window の pagehide / pageshow
 * 記録するのは、時刻・イベント名・AudioContext の状態とサンプルレート・<audio> の playbackRate(と defaultPlaybackRate)。
 * timeupdate のときは、約2秒ぶんの「再生位置の進み ÷ 実際に経った時間」を計算して、1.0 でなければ(ピッチ・速さが変わっていれば)その比も記録する。
 * 記録は、メモリ上の500件までのリング(古いものから消える)。
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

/** 「有効」を端末に保存するキー(値は "1")。保存できなくても、アプリは動く(その回のあいだだけ有効) */
export const AUDIO_DEBUG_KEY = "paku-kokubunpo:audiodebug";

export interface AudioDebugEntry {
  /** 記録した時刻(ミリ秒。コピーしたテキストでは、ISO形式の時刻) */
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

/** 設定画面の「音のログ」の表示を決める状態 */
export interface AudioDebugState {
  /** ログをとっている(端末に保存される) */
  enabled: boolean;
  /** 設定画面に、「音のログ」の項目を出す(有効にしたあと・バージョン表記を5回タップしたあと。スイッチを切っても、画面を読み込み直すまで出したまま) */
  revealed: boolean;
}

const entries: AudioDebugEntry[] = [];
let startedAt = 0;
let state: AudioDebugState | null = null;
const listeners = new Set<() => void>();

// 記録の元になる、いまの <audio> と AudioContext(ログを書くときに、状態を読むだけ)
let audioRef: HTMLAudioElement | null = null;
let ctxRef: AudioContext | null = null;
// 有効なあいだだけ付けるイベントの待ち受け(無効にしたら、まとめて外す)
let pageAbort: AbortController | null = null;
let audioAbort: AbortController | null = null;
let ctxAbort: AbortController | null = null;

function readSaved(): boolean {
  try {
    return window.localStorage.getItem(AUDIO_DEBUG_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSaved(on: boolean): void {
  try {
    if (on) window.localStorage.setItem(AUDIO_DEBUG_KEY, "1");
    else window.localStorage.removeItem(AUDIO_DEBUG_KEY);
  } catch {
    // 保存できなくても、その回のあいだは、有効にできる
  }
}

function urlFlag(): "1" | "0" | null {
  try {
    const value = new URLSearchParams(window.location.search).get("audiodebug");
    return value === "1" || value === "0" ? value : null;
  } catch {
    return null;
  }
}

function current(): AudioDebugState {
  if (state) return state;
  if (typeof window === "undefined") return (state = { enabled: false, revealed: false });
  const flag = urlFlag();
  let enabled = readSaved();
  if (flag === "1") {
    enabled = true;
    writeSaved(true); // 一度開いたら、有効にして保存する(PWAで起動しても有効のまま)
  } else if (flag === "0") {
    enabled = false;
    writeSaved(false);
  }
  state = { enabled, revealed: enabled };
  return state;
}

function setState(next: AudioDebugState): void {
  state = next;
  listeners.forEach((l) => l());
}

/** いま有効か */
export function isAudioDebugEnabled(): boolean {
  return current().enabled;
}

/** 設定画面が、表示を決めるための状態(useSyncExternalStore の getSnapshot。変わるまで、同じ値を返す) */
export function getAudioDebugState(): AudioDebugState {
  return current();
}

export function subscribeAudioDebug(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

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
  if (!current().enabled) return;
  push(event, note ? { note } : undefined);
}

function attachPage(): void {
  if (pageAbort || typeof document === "undefined") return;
  const abort = (pageAbort = new AbortController());
  const { signal } = abort;
  document.addEventListener("visibilitychange", () => push("visibilitychange", { note: document.visibilityState }), { signal });
  window.addEventListener("pagehide", () => push("pagehide"), { signal });
  window.addEventListener("pageshow", () => push("pageshow"), { signal });
  startedAt = Date.now();
  push("start", { note: navigator.userAgent });
}

function attachAudio(audio: HTMLAudioElement): void {
  audioAbort?.abort();
  const abort = (audioAbort = new AbortController());
  const { signal } = abort;
  push("audio-created");
  audio.addEventListener("ratechange", () => push("ratechange"), { signal });

  // 比の測り始め(baseWall・basePos)と、直前の timeupdate(lastWall・lastPos)
  let baseWall = 0;
  let basePos = 0;
  let lastWall = 0;
  let lastPos = -1;
  audio.addEventListener(
    "timeupdate",
    () => {
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
    },
    { signal },
  );
}

function attachContext(ctx: AudioContext): void {
  ctxAbort?.abort();
  const abort = (ctxAbort = new AbortController());
  push("context-created", { note: `sampleRate=${ctx.sampleRate}` });
  ctx.addEventListener?.("statechange", () => push("statechange", { note: ctx.state }), { signal: abort.signal });
}

/** BGM用の <audio> を作ったときに呼ぶ(有効でなくても、覚えておく。有効にしたときに、待ち受けを付ける) */
export function watchAudioElement(audio: HTMLAudioElement): void {
  audioRef = audio;
  if (!current().enabled) return;
  attachPage();
  attachAudio(audio);
}

/** AudioContext を作ったときに呼ぶ(有効でなくても、覚えておく) */
export function watchAudioContext(ctx: AudioContext): void {
  ctxRef = ctx;
  if (!current().enabled) return;
  attachPage();
  attachContext(ctx);
}

function detachAll(): void {
  pageAbort?.abort();
  audioAbort?.abort();
  ctxAbort?.abort();
  pageAbort = audioAbort = ctxAbort = null;
}

/** 有効・無効を切り替える(端末に保存する)。無効に戻したときは、待ち受けを外して、記録も空にする */
export function setAudioDebugEnabled(on: boolean): void {
  const now = current();
  if (now.enabled === on) return;
  writeSaved(on);
  if (on) {
    setState({ enabled: true, revealed: true });
    attachPage();
    if (audioRef) attachAudio(audioRef);
    if (ctxRef) attachContext(ctxRef);
  } else {
    detachAll();
    entries.length = 0;
    startedAt = 0;
    setState({ enabled: false, revealed: now.revealed });
  }
}

/** 設定画面に「音のログ」の項目を出す(バージョン表記を5回続けてタップしたとき)。有効にはしない */
export function revealAudioDebug(): void {
  const now = current();
  if (!now.revealed) setState({ ...now, revealed: true });
}

/** 記録を空にする(有効のまま) */
export function clearAudioDebug(): void {
  entries.length = 0;
}

/** 記録を、コピーできるテキストにする(1件1行。先頭に、件数などの情報) */
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

/** テスト用: 記録・状態・待ち受けを空にして、初期状態に戻す(enabled を渡すと、保存せずに、その状態から始める) */
export function resetAudioDebugForTest(enabled?: boolean): void {
  detachAll();
  entries.length = 0;
  audioRef = null;
  ctxRef = null;
  startedAt = 0;
  listeners.clear();
  try {
    window.localStorage.removeItem(AUDIO_DEBUG_KEY);
  } catch {
    // 無視
  }
  state = enabled === undefined ? null : { enabled, revealed: enabled };
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
