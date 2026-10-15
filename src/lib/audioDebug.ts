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
 * 記録するのは、時刻・イベント名・AudioContext の状態とサンプルレート・<audio> の playbackRate(と defaultPlaybackRate)・
 * 曲の名前・audio.paused / readyState / networkState。
 * timeupdate のたびに、約2秒の窓で、3つの時計の進みを測る(timeupdate の中の、足し算・引き算だけ。重い処理はしない):
 *   wallΔ = performance.now の進み(実際に経った時間) / audioΔ = audio.currentTime の進み(プレーヤー側の時計) /
 *   ctxΔ = audioContext.currentTime の進み(実際の出力に近い、AudioContext側の時計)
 * そこから、audio/wall・ctx/wall・audio/ctx の3つの比を出す。ふつうは、どれかが 1.0 から ±0.02 以上ずれた窓だけ記録し、
 * 「全記録」のときは、すべての窓(約2秒ごとに1件)を記録する。どれかの比が 1.0 から ±0.01 以上ずれた行には、先頭に「!」を付ける。
 * 窓が、止まる・動き出す(statechange)・裏に回る/戻る・一時停止・シークをまたいだときは、その行に「窓をまたいだ」と印を付ける。
 * 記録は、メモリ上の500件までのリング(古いものから消える)。
 */

const MAX_ENTRIES = 500;
/** 比が 1.0 からこれ以上ずれた窓は、ふつうのモードでも記録する */
const RATIO_TOLERANCE = 0.02;
/** 比が 1.0 からこれ以上ずれた行には、先頭に「!」を付ける(あとで探しやすくする) */
const BANG_TOLERANCE = 0.01;
/**
 * 比は、これだけ(ミリ秒)の時間をまとめて測る。timeupdate は、1秒に4回ほどで、1回ごとの間隔に数ミリ秒のゆらぎがあり、
 * 1回ずつ比べると、ふつうに鳴っていても 0.97〜1.03 になってしまう(実測)。2秒ぶんをまとめれば、ゆらぎは 0.5% ほどに収まる。
 */
const RATIO_WINDOW_MS = 2000;
/** 前回の timeupdate からこれ以上あいたら(止まっていた・裏に回っていたなど)、その窓は「またいだ」ことにする */
const MAX_GAP_MS = 1500;

/** 「有効」を端末に保存するキー(値は "1")。保存できなくても、アプリは動く(その回のあいだだけ有効) */
export const AUDIO_DEBUG_KEY = "paku-kokubunpo:audiodebug";
/** 「全記録」(すべての窓を記録する)を端末に保存するキー(値は "1") */
export const AUDIO_DEBUG_FULL_KEY = "paku-kokubunpo:audiodebug-full";

/** 約2秒の窓で測った、3つの時計の進みと、3つの比(測れないものは null) */
export interface AudioDebugWindow {
  wallMs: number;
  audioMs: number;
  ctxMs: number | null;
  /** audio / wall */
  aw: number;
  /** ctx / wall */
  cw: number | null;
  /** audio / ctx */
  ac: number | null;
  /** 窓が、止まる・動き出す・裏に回る/戻る・一時停止・シークなどをまたいだ(比の信頼性が低い) */
  crossed: boolean;
}

export interface AudioDebugEntry {
  /** 記録した時刻(ミリ秒。コピーしたテキストでは、ISO形式の時刻) */
  at: number;
  event: string;
  /** AudioContext の状態(まだ作られていなければ "-") */
  ctxState: string;
  ctxRate: number | null;
  playbackRate: number | null;
  defaultPlaybackRate: number | null;
  /** 鳴らしている曲のファイル名(なければ null) */
  bgm: string | null;
  paused: boolean | null;
  readyState: number | null;
  networkState: number | null;
  /** AudioContext の出力の遅れ(秒)。対応していなければ省略 */
  outputLatency?: number;
  baseLatency?: number;
  /** timeupdate の窓の測定 */
  win?: AudioDebugWindow;
  /** どれかの比が 1.0 から ±0.01 以上ずれている(先頭に「!」) */
  bang?: boolean;
  /** 「いま高い」ボタン(MARK)を押した瞬間の値 */
  mark?: {
    wallNow: number;
    audioTime: number | null;
    ctxTime: number | null;
    /** いまの窓の、ここまでの測定(窓の始まりから、いままで) */
    current: AudioDebugWindow | null;
    /** 直前に終わった窓の測定 */
    last: AudioDebugWindow | null;
  };
  /** その他の補足(曲のファイル名など) */
  note?: string;
}

/** 設定画面の「音のログ」の表示を決める状態 */
export interface AudioDebugState {
  /** ログをとっている(端末に保存される) */
  enabled: boolean;
  /** 設定画面に、「音のログ」の項目を出す(有効にしたあと・バージョン表記を5回タップしたあと。スイッチを切っても、画面を読み込み直すまで出したまま) */
  revealed: boolean;
  /** 全記録: すべての窓を記録する(端末に保存される) */
  full: boolean;
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

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, on: boolean): void {
  try {
    if (on) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
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
  if (typeof window === "undefined") return (state = { enabled: false, revealed: false, full: false });
  const flag = urlFlag();
  let enabled = readFlag(AUDIO_DEBUG_KEY);
  if (flag === "1") {
    enabled = true;
    writeFlag(AUDIO_DEBUG_KEY, true); // 一度開いたら、有効にして保存する(PWAで起動しても有効のまま)
  } else if (flag === "0") {
    enabled = false;
    writeFlag(AUDIO_DEBUG_KEY, false);
  }
  state = { enabled, revealed: enabled, full: readFlag(AUDIO_DEBUG_FULL_KEY) };
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

/** 曲のファイル名(無音の準備用のデータURLは "(無音)") */
function bgmName(audio: HTMLAudioElement | null): string | null {
  const src = audio ? audio.currentSrc || audio.src : "";
  if (!src) return null;
  if (src.startsWith("data:")) return "(無音)";
  return src.split("?")[0].split("/").pop() ?? null;
}

const num = (value: unknown): number | undefined => (typeof value === "number" && Number.isFinite(value) ? value : undefined);

type Extra = Partial<Pick<AudioDebugEntry, "win" | "bang" | "mark" | "note">>;

function push(event: string, extra?: Extra): void {
  const ctx = ctxRef;
  const entry: AudioDebugEntry = {
    at: Date.now(),
    event,
    ctxState: ctx ? ctx.state : "-",
    ctxRate: ctx ? ctx.sampleRate : null,
    playbackRate: audioRef ? audioRef.playbackRate : null,
    defaultPlaybackRate: audioRef ? audioRef.defaultPlaybackRate : null,
    bgm: bgmName(audioRef),
    paused: audioRef ? audioRef.paused : null,
    readyState: audioRef ? audioRef.readyState : null,
    networkState: audioRef ? audioRef.networkState : null,
    ...extra,
  };
  // 出力の遅れ(対応していれば。Safari などでは未対応のことがある)
  const out = num(ctx?.outputLatency);
  const base = num(ctx?.baseLatency);
  if (out !== undefined) entry.outputLatency = out;
  if (base !== undefined) entry.baseLatency = base;
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
}

/** アプリ側の目印(曲の切り替え・再生速度のリセットなど)。有効なときだけ記録する */
export function logAudioDebug(event: string, note?: string): void {
  if (!current().enabled) return;
  push(event, note ? { note } : undefined);
}

/** 約2秒の窓の、測り始めと、ここまでの進み(timeupdate のたびに、足し算だけで進める) */
interface Sampler {
  started: boolean;
  baseWall: number;
  baseCtx: number | null;
  /** 窓の始まりからの、audio.currentTime の進み(秒。ループで巻き戻ったときは、曲の長さを足して続ける) */
  audioAcc: number;
  lastWall: number;
  lastPos: number;
  crossed: boolean;
  /** 直前に終わった窓 */
  last: AudioDebugWindow | null;
}

const newSampler = (): Sampler => ({ started: false, baseWall: 0, baseCtx: null, audioAcc: 0, lastWall: 0, lastPos: 0, crossed: false, last: null });
let sampler: Sampler = newSampler();

/** 窓を、止まる・動き出す・裏に回る/戻る・一時停止・シークがまたいだ、という印を付ける */
function markCrossed(): void {
  sampler.crossed = true;
}

const ratio3 = (n: number, d: number): number | null => (d > 0 ? Math.round((n / d) * 1000) / 1000 : null);

/** いまの窓の、ここまでの測定(wallΔ が 0 以下なら null) */
function measure(wall: number, audioAcc: number, ctxNow: number | null): AudioDebugWindow | null {
  const wallMs = wall - sampler.baseWall;
  if (!sampler.started || wallMs <= 0) return null;
  const audioMs = audioAcc * 1000;
  const ctxMs = ctxNow !== null && sampler.baseCtx !== null ? (ctxNow - sampler.baseCtx) * 1000 : null;
  return {
    wallMs: Math.round(wallMs),
    audioMs: Math.round(audioMs),
    ctxMs: ctxMs === null ? null : Math.round(ctxMs),
    aw: ratio3(audioMs, wallMs) as number,
    cw: ctxMs === null ? null : ratio3(ctxMs, wallMs),
    ac: ctxMs === null ? null : ratio3(audioMs, ctxMs),
    crossed: sampler.crossed,
  };
}

const ratiosOf = (w: AudioDebugWindow): number[] => [w.aw, w.cw, w.ac].filter((r): r is number => r !== null);
const offBy = (w: AudioDebugWindow, tolerance: number): boolean => ratiosOf(w).some((r) => Math.abs(r - 1) > tolerance);

function attachPage(): void {
  if (pageAbort || typeof document === "undefined") return;
  const abort = (pageAbort = new AbortController());
  const { signal } = abort;
  document.addEventListener(
    "visibilitychange",
    () => {
      markCrossed();
      push("visibilitychange", { note: document.visibilityState });
    },
    { signal },
  );
  window.addEventListener(
    "pagehide",
    () => {
      markCrossed();
      push("pagehide");
    },
    { signal },
  );
  window.addEventListener(
    "pageshow",
    () => {
      markCrossed();
      push("pageshow");
    },
    { signal },
  );
  startedAt = Date.now();
  push("start", { note: navigator.userAgent });
}

function attachAudio(audio: HTMLAudioElement): void {
  audioAbort?.abort();
  const abort = (audioAbort = new AbortController());
  const { signal } = abort;
  sampler = newSampler();
  push("audio-created");
  audio.addEventListener("ratechange", () => push("ratechange"), { signal });
  // 止まる・動き出す・待たされる・シークは、窓をまたぐ(記録もする。どれも、ふだんは、まれにしか起きない)
  for (const name of ["pause", "playing", "waiting", "seeking"]) {
    audio.addEventListener(
      name,
      () => {
        markCrossed();
        push(name);
      },
      { signal },
    );
  }

  audio.addEventListener(
    "timeupdate",
    () => {
      const wall = performance.now();
      const pos = audio.currentTime;
      const ctxNow = num(ctxRef?.currentTime) ?? null;
      const s = sampler;
      if (!s.started) {
        Object.assign(s, { started: true, baseWall: wall, baseCtx: ctxNow, audioAcc: 0, lastWall: wall, lastPos: pos, crossed: false });
        return;
      }
      let delta = pos - s.lastPos;
      if (delta < 0) {
        // ループで巻き戻った(曲の長さを足して続ける)。それ以外の巻き戻し(シークなど)は、進んでいないことにして、またいだ印を付ける
        if (audio.loop && Number.isFinite(audio.duration)) delta += audio.duration;
        else {
          delta = 0;
          s.crossed = true;
        }
      }
      if (audio.paused || wall - s.lastWall > MAX_GAP_MS) s.crossed = true;
      s.audioAcc += delta;
      s.lastWall = wall;
      s.lastPos = pos;
      if (wall - s.baseWall < RATIO_WINDOW_MS) return;

      const win = measure(wall, s.audioAcc, ctxNow);
      if (win) {
        s.last = win;
        if (current().full || offBy(win, RATIO_TOLERANCE)) push("timeupdate", { win, bang: offBy(win, BANG_TOLERANCE) });
      }
      Object.assign(s, { baseWall: wall, baseCtx: ctxNow, audioAcc: 0, crossed: false });
    },
    { signal },
  );
}

function attachContext(ctx: AudioContext): void {
  ctxAbort?.abort();
  const abort = (ctxAbort = new AbortController());
  push("context-created", { note: `sampleRate=${ctx.sampleRate}` });
  ctx.addEventListener?.(
    "statechange",
    () => {
      markCrossed();
      push("statechange", { note: ctx.state });
    },
    { signal: abort.signal },
  );
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
  writeFlag(AUDIO_DEBUG_KEY, on);
  if (on) {
    setState({ ...now, enabled: true, revealed: true });
    attachPage();
    if (audioRef) attachAudio(audioRef);
    if (ctxRef) attachContext(ctxRef);
  } else {
    detachAll();
    entries.length = 0;
    startedAt = 0;
    setState({ ...now, enabled: false });
  }
}

/** 全記録(すべての窓を記録する)を切り替える(端末に保存する) */
export function setAudioDebugFull(on: boolean): void {
  const now = current();
  if (now.full === on) return;
  writeFlag(AUDIO_DEBUG_FULL_KEY, on);
  setState({ ...now, full: on });
}

/**
 * 「いま高い」ボタン: 押した瞬間の、3つの時計・各比・出力の遅れ・ctx の状態とサンプルレート・曲の名前を、「MARK」の行で記録する。
 * 有効でなければ、何もしない(false)。
 */
export function markAudioDebug(): boolean {
  if (!current().enabled) return false;
  const wall = performance.now();
  const ctxNow = num(ctxRef?.currentTime) ?? null;
  const audioTime = audioRef ? audioRef.currentTime : null;
  // いまの窓の、ここまでの進み(最後の timeupdate までの進みに、いまの位置までを足す)
  const pending = audioRef && sampler.started ? Math.max(0, audioRef.currentTime - sampler.lastPos) : 0;
  const currentWin = measure(wall, sampler.audioAcc + pending, ctxNow);
  push("MARK", { mark: { wallNow: Math.round(wall * 10) / 10, audioTime, ctxTime: ctxNow, current: currentWin, last: sampler.last } });
  return true;
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

const fmt = (n: number | boolean | string | null | undefined): string => (n === null || n === undefined ? "-" : String(n));

/** 窓の測定を、1行ぶんの文字にする */
function formatWindow(w: AudioDebugWindow): string {
  return `win=${w.wallMs}ms audio=${w.audioMs}ms ctx=${fmt(w.ctxMs)}ms a/w=${w.aw} c/w=${fmt(w.cw)} a/c=${fmt(w.ac)}${w.crossed ? " 窓をまたいだ" : ""}`;
}

/** 記録を、コピーできるテキストにする(1件1行。先頭に、件数などの情報) */
export function formatAudioDebug(list: readonly AudioDebugEntry[] = entries): string {
  const time = (ms: number) => new Date(ms).toISOString().slice(11, 23);
  const lines = list.map((e) => {
    const parts = [
      `${e.bang ? "! " : ""}${time(e.at)}`,
      e.event,
      `ctx=${e.ctxState}`,
      `ctxRate=${fmt(e.ctxRate)}`,
      `rate=${fmt(e.playbackRate)}`,
      `defRate=${fmt(e.defaultPlaybackRate)}`,
      `bgm=${fmt(e.bgm)}`,
      `paused=${fmt(e.paused)}`,
      `ready=${fmt(e.readyState)}`,
      `net=${fmt(e.networkState)}`,
    ];
    if (e.outputLatency !== undefined) parts.push(`outLat=${e.outputLatency}`);
    if (e.baseLatency !== undefined) parts.push(`baseLat=${e.baseLatency}`);
    if (e.win) parts.push(formatWindow(e.win));
    if (e.mark) {
      const m = e.mark;
      parts.push(`wall=${m.wallNow} audioT=${fmt(m.audioTime)} ctxT=${fmt(m.ctxTime)}`);
      parts.push(m.current ? `now:[${formatWindow(m.current)}]` : "now:[-]");
      parts.push(m.last ? `last:[${formatWindow(m.last)}]` : "last:[-]");
    }
    if (e.note) parts.push(`note=${e.note}`);
    return parts.join(" ");
  });
  return [
    `audiodebug ${new Date().toISOString()}`,
    `開始: ${startedAt ? new Date(startedAt).toISOString() : "-"} / 件数: ${list.length}(最大${MAX_ENTRIES}件。古いものから消える) / 全記録: ${current().full ? "あり" : "なし"}`,
    `win は、約${RATIO_WINDOW_MS / 1000}秒の窓。a/w=audio÷wall・c/w=ctx÷wall・a/c=audio÷ctx(audio=audio.currentTime、ctx=AudioContext.currentTime、wall=performance.now の進み)。ふつうは、どれかが 1.0 から ±${RATIO_TOLERANCE} 以上ずれた窓だけ記録(全記録は、すべての窓)。「!」は ±${BANG_TOLERANCE} 以上`,
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
  sampler = newSampler();
  try {
    window.localStorage.removeItem(AUDIO_DEBUG_KEY);
    window.localStorage.removeItem(AUDIO_DEBUG_FULL_KEY);
  } catch {
    // 無視
  }
  state = enabled === undefined ? null : { enabled, revealed: enabled, full: false };
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
