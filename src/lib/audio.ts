import { useSettingsStore } from "@/app/store/settingsStore";
import { findAudio, seAssetName } from "@/assets/registry";

/**
 * BGM/SE再生の実体(9章: モバイル音声自動再生制約への対応)。
 *
 * iOS Safari等は、ユーザーが一度画面をタップするまで音声を自動再生できない。
 * ここでの「解禁」は3つの意味を持つ:
 *   1. AudioContext を resume する(Web Audio APIの再生に必要)
 *   2. settingsStore.audioUnlocked を true にする(以降 playSe/playBgm を許可するアプリ側の門)
 *   3. BGM用の <audio> 要素を、タップの中で一度だけ無音で再生しておく
 *      (この要素で再生を始めておけば、以降は場面が変わるたびに曲を差し替えても、
 *       タップの外(画面遷移のタイミング)から鳴らせる)
 * いずれも、必ずユーザー操作イベントハンドラの中で同期的に呼び出すこと
 * (非同期処理を挟むとブラウザがユーザー操作起因と認識せず解禁に失敗する)。
 *
 * 本物の素材は src/assets/audio/ に置くだけで使われる(取り決めは src/assets/README.md)。
 * 置かれていない効果音は、下の合成音(仮)のまま鳴る。
 */

let audioContext: AudioContext | null = null;

/**
 * BGMと効果音の基準音量のバランス。BGMは効果音(特にクリア音・成長音)を邪魔しないよう、
 * スライダーの値に、この係数をかけて鳴らす(スライダーの最大でも効果音より控えめ)。
 */
const BGM_BASE_GAIN = 0.4;
/** 効果音でBGMをダッキング(一時的に下げる)するときの音量の倍率と、下げる・戻すときの速さ(秒) */
const DUCK_FACTOR = 0.08;
const DUCK_DOWN_SEC = 0.05;
const DUCK_UP_SEC = 0.4;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) {
    audioContext = new Ctor();
    // 動き出した(running になった)ときに、鳴らそうとして待たされていたBGMを始める
    audioContext.addEventListener?.("statechange", () => {
      if (audioContext?.state === "running") ensureBgmPlaying();
    });
  }
  return audioContext;
}

/** 1サンプルだけの無音WAV。BGM要素を最初のタップの中で「再生済み」にするために使う */
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

/** タイトル画面などでの最初のタップ/クリックのハンドラ内で呼び出す(9章)。 */
export function unlockPlayback(): void {
  useSettingsStore.getState().unlockAudio();
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
  primeBgmElement();
  void preloadSeFiles();
  // 解禁のタップの中で、いまの場面のBGMを始める。iOSは、タップの中で始めた再生でないとブロックすることがあり、
  // 画面の描画のあと(useBgm の effect)に始めるだけでは、別の音が鳴るまでBGMが始まらないことがあった。
  bgmStarter?.();
  ensureBgmPlaying();
}

/** いまの場面のBGMを鳴らす関数。useBgm が登録する(unlockPlayback から、解禁のタップの中で呼ぶため) */
let bgmStarter: (() => void) | null = null;
export function setBgmStarter(starter: (() => void) | null): void {
  bgmStarter = starter;
}

export type SeKind =
  | "correct"
  | "incorrect"
  | "clear"
  | "subBossClear"
  | "lastBossClear"
  | "tap"
  | "pageUnlock"
  | "growth"
  | "bonus";

/** 効果音ごとの音色パラメータ。本物の素材(10章)が置かれていない種類の仮の音。 */
const TONE_PARAMS: Record<
  SeKind,
  /** endFreq を指定すると、freq からその高さまで音が滑らかに変わる(上がる音・下がる音) */
  { freq: number; endFreq?: number; duration: number; type: OscillatorType }
> = {
  tap: { freq: 520, duration: 0.06, type: "sine" },
  correct: { freq: 880, duration: 0.15, type: "sine" },
  incorrect: { freq: 220, duration: 0.25, type: "sawtooth" },
  clear: { freq: 660, duration: 0.4, type: "triangle" },
  subBossClear: { freq: 440, duration: 0.55, type: "square" },
  pageUnlock: { freq: 990, duration: 0.3, type: "triangle" },
  // マスコットまわり(6・13章)。素材が届くまでは、上がっていく仮の音
  growth: { freq: 523, endFreq: 1047, duration: 0.5, type: "triangle" },
  lastBossClear: { freq: 330, endFreq: 990, duration: 0.9, type: "triangle" },
  bonus: { freq: 1200, endFreq: 1700, duration: 0.2, type: "sine" },
};

export const SE_KINDS = Object.keys(TONE_PARAMS) as SeKind[];

/** 読み込み済みの本物の効果音(src/assets/audio/se/<種類>)。なければ合成音で鳴らす。 */
const seBuffers = new Map<SeKind, AudioBuffer>();
let sePreloadStarted = false;

/**
 * 置かれている効果音ファイルを読み込んでデコードしておく(解禁後に一度だけ)。
 * 短い音を遅延なく鳴らすため、<audio> ではなく Web Audio のバッファで再生する。
 * 読み込みに失敗した種類は、静かに合成音のまま使う。
 */
export async function preloadSeFiles(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx || sePreloadStarted) return;
  sePreloadStarted = true;
  await Promise.all(
    SE_KINDS.map(async (kind) => {
      const url = findAudio(seAssetName(kind));
      if (!url) return;
      try {
        const response = await fetch(url);
        const data = await response.arrayBuffer();
        seBuffers.set(kind, await ctx.decodeAudioData(data));
      } catch {
        // 読み込み・デコードできない場合は合成音のまま
      }
    }),
  );
}

/**
 * 効果音を鳴らす。本物の素材があればそれを、なければ合成音(仮)を鳴らす。
 * 呼び出し側の playSe("correct") 等は、素材の有無で変わらない。
 */
export function playSe(kind: SeKind): void {
  const { muted, seVolume, audioUnlocked } = useSettingsStore.getState();
  if (muted || seVolume <= 0 || !audioUnlocked) return;

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;
  if (LONG_SE.has(kind)) seBusyUntil = Math.max(seBusyUntil, Date.now() + seDurationMs(kind));

  const buffer = seBuffers.get(kind);
  if (buffer) {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = seVolume;
    source.connect(gain).connect(ctx.destination);
    source.start();
    return;
  }

  const { freq, endFreq, duration, type } = TONE_PARAMS[kind];
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
  if (endFreq) oscillator.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
  gain.gain.setValueAtTime(seVolume * 0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

/** BGM用の <audio> 要素は1つを使い回す(iOSで、最初のタップで再生を始めた要素を引き継ぐため)。 */
let bgmElement: HTMLAudioElement | null = null;
let bgmSrc: string | null = null;
/**
 * BGMの音量は GainNode で決める。iOS の Safari は <audio> の volume を無視する(常に最大)ため、
 * スライダーやミュートを効かせるには、要素の音を Web Audio に通して、その音量を変える必要がある。
 * つなげない環境(jsdom など)では、要素の volume で代用する。
 */
let bgmGain: GainNode | null = null;
/** 効果音のあいだ BGM を下げる倍率(1=通常)。ミュート・スライダーとは別に、かけ合わせる */
let duckFactor = 1;
let duckTimer: ReturnType<typeof setTimeout> | null = null;
let duckUntil = 0;

function getBgmElement(): HTMLAudioElement {
  if (!bgmElement) {
    bgmElement = new Audio();
    bgmElement.loop = true;
  }
  return bgmElement;
}

/** BGM要素を GainNode 経由にする(1要素につき1回だけできる)。できなければ要素の volume で代用する */
function attachBgmGain(): void {
  if (bgmGain) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const source = ctx.createMediaElementSource(getBgmElement());
    const gain = ctx.createGain();
    source.connect(gain).connect(ctx.destination);
    bgmGain = gain;
    getBgmElement().volume = 1;
    applyBgmLevel();
  } catch {
    bgmGain = null;
  }
}

/** いまのBGMの音量(ミュート・スライダー・基準・ダッキングをかけ合わせたもの) */
function bgmLevel(): number {
  const { muted, bgmVolume } = useSettingsStore.getState();
  return muted ? 0 : bgmVolume * BGM_BASE_GAIN * duckFactor;
}

/** いまの音量をBGMへ反映する。seconds は、その秒数かけて滑らかに変える(0なら即時) */
function applyBgmLevel(seconds = 0): void {
  const level = bgmLevel();
  if (bgmGain && audioContext) {
    const param = bgmGain.gain;
    const now = audioContext.currentTime;
    param.cancelScheduledValues(now);
    if (seconds > 0) param.setTargetAtTime(level, now, seconds / 3);
    else param.setValueAtTime(level, now);
  } else if (bgmElement) {
    bgmElement.volume = Math.min(1, level);
  }
}

/** 止まっている AudioContext を動かす。ミュート解除などユーザー操作の中で呼ぶと、iOSでも再開できる */
function resumeAudioContext(): void {
  const ctx = audioContext;
  if (ctx && ctx.state !== "running") void ctx.resume().catch(() => {});
}

/** play() はブラウザによって Promise を返さない/同期的に例外を投げることがあるため、両対応で呼ぶ */
function safePlay(audio: HTMLAudioElement): void {
  try {
    const playResult = audio.play() as unknown;
    if (playResult && typeof (playResult as Promise<void>).catch === "function") {
      (playResult as Promise<void>).catch(() => {
        // 解禁前など自動再生がブロックされた場合は静かに諦める
      });
    }
  } catch {
    // 同期的に例外を投げる実装への保険
  }
}

/** アプリが見えていない(ホーム画面に戻った・画面ロック)あいだは、BGMを鳴らさない */
function isPageHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/** BGM要素を再生する。見えていないあいだは何もしない(戻ってきたとき ensureBgmPlaying が始める) */
function playBgmElement(audio: HTMLAudioElement): void {
  if (!isPageHidden()) safePlay(audio);
}

/**
 * 曲が指定されているのに、止まったままのBGMを鳴らし直す(解禁の直後・ミュート解除・
 * AudioContext が動き出したとき・アプリに戻ったとき)。ミュート中も再生は続け、音量0で鳴らしておく。
 */
function ensureBgmPlaying(): void {
  if (bgmElement && bgmSrc && bgmElement.paused) playBgmElement(bgmElement);
}

/** タップの中で、BGM要素を無音で一度再生しておく(unlockPlayback から呼ぶ) */
function primeBgmElement(): void {
  const audio = getBgmElement();
  attachBgmGain();
  if (bgmSrc !== null) return; // すでにBGMが鳴っている(または指定済み)なら触らない
  audio.src = SILENT_WAV;
  safePlay(audio);
}

/** 導入曲が終わったらループ曲へ移るための待ち受け(曲が切り替わるとき・止めるときに外す) */
let introEndedHandler: (() => void) | null = null;

function clearIntroHandler(): void {
  if (bgmElement && introEndedHandler) bgmElement.removeEventListener("ended", introEndedHandler);
  introEndedHandler = null;
}

/**
 * BGMを再生する。同じ曲がすでに鳴っていれば何もしない(場面が変わっても曲が同じなら途切れない)。
 * `introSrc` があれば、それを1回鳴らしてから `src` をくり返す(導入→ループの2曲構成)。
 * どの曲を鳴らすかは、場面から決める(features/audio/bgmScene.ts。素材の取り決めは src/assets/README.md)。
 */
export function playBgm(src: string, introSrc?: string): void {
  const { audioUnlocked } = useSettingsStore.getState();
  if (!audioUnlocked || bgmSrc === src) return;

  const audio = getBgmElement();
  attachBgmGain();
  resumeAudioContext();
  clearIntroHandler();
  applyBgmLevel();
  if (introSrc) {
    audio.src = introSrc;
    audio.loop = false;
    introEndedHandler = () => {
      clearIntroHandler();
      audio.src = src;
      audio.loop = true;
      playBgmElement(audio);
    };
    audio.addEventListener("ended", introEndedHandler);
  } else {
    audio.src = src;
    audio.loop = true;
  }
  playBgmElement(audio);
  bgmSrc = src;
}

export function stopBgm(): void {
  clearIntroHandler();
  bgmElement?.pause();
  bgmSrc = null;
}

/**
 * 効果音を聞かせるため、BGMを `ms` ミリ秒のあいだ一時的に下げる(ダッキング)。終わると、滑らかに元の音量へ戻る。
 * 続けて呼ばれたら、いちばん遅い終了時刻に合わせる。ミュート中は何も変わらない。
 */
export function duckBgm(ms: number): void {
  const until = Date.now() + Math.max(0, ms);
  if (duckTimer && until <= duckUntil) return; // すでに、もっと長く下げる予定がある
  duckUntil = until;
  duckFactor = DUCK_FACTOR;
  applyBgmLevel(DUCK_DOWN_SEC);
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    duckTimer = null;
    duckFactor = 1;
    applyBgmLevel(DUCK_UP_SEC);
  }, until - Date.now());
}

/** 長めの効果音(演出の音)。これが鳴り終わるまで次の演出の音を待たせる(重ねない)ため、再生中を覚えておく */
const LONG_SE = new Set<SeKind>(["clear", "subBossClear", "lastBossClear", "growth", "pageUnlock", "bonus"]);
let seBusyUntil = 0;

/** 演出の効果音が鳴り終わるまでの残り時間(ミリ秒)。鳴っていなければ 0 */
export function seBusyRemainingMs(): number {
  return Math.max(0, seBusyUntil - Date.now());
}

/** 効果音の長さ(ミリ秒)。本物の素材が読み込めていればその長さ、なければ合成音の長さ */
export function seDurationMs(kind: SeKind): number {
  const buffer = seBuffers.get(kind);
  return (buffer ? buffer.duration : TONE_PARAMS[kind].duration) * 1000;
}

// 音量スライダー・ミュート(7章)の変更を、再生中のBGMへ即時反映する。
// ミュートを解除したときは、止まっていた AudioContext と BGM も動かし直す(解除のタップの中なので、iOSでも再開できる)。
useSettingsStore.subscribe((state, prev) => {
  applyBgmLevel(0.02);
  if (prev.muted && !state.muted) {
    resumeAudioContext();
    ensureBgmPlaying();
  }
});

// アプリがバックグラウンドに回ったら(ホーム画面に戻った・画面ロック)BGMを止め、戻ってきたら続きから鳴らす。
// ミュート中は、音量0のまま再生を続けるので、戻っても無音のまま(解除すれば鳴る)。
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!useSettingsStore.getState().audioUnlocked) return;
    if (isPageHidden()) {
      bgmElement?.pause();
      return;
    }
    resumeAudioContext();
    ensureBgmPlaying();
  });
}
