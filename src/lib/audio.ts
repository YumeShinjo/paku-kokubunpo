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

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) {
    audioContext = new Ctor();
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

function getBgmElement(): HTMLAudioElement {
  if (!bgmElement) {
    bgmElement = new Audio();
    bgmElement.loop = true;
  }
  return bgmElement;
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

/** タップの中で、BGM要素を無音で一度再生しておく(unlockPlayback から呼ぶ) */
function primeBgmElement(): void {
  const audio = getBgmElement();
  if (bgmSrc !== null) return; // すでにBGMが鳴っている(または指定済み)なら触らない
  audio.src = SILENT_WAV;
  safePlay(audio);
}

/**
 * BGMを再生する。同じ曲がすでに鳴っていれば何もしない(場面が変わっても曲が同じなら途切れない)。
 * どの曲を鳴らすかは、場面から決める(features/audio/bgmScene.ts。素材の取り決めは src/assets/README.md)。
 */
export function playBgm(src: string): void {
  const { muted, bgmVolume, audioUnlocked } = useSettingsStore.getState();
  if (!audioUnlocked || bgmSrc === src) return;

  const audio = getBgmElement();
  audio.src = src;
  audio.loop = true;
  audio.volume = muted ? 0 : bgmVolume;
  safePlay(audio);
  bgmSrc = src;
}

export function stopBgm(): void {
  bgmElement?.pause();
  bgmSrc = null;
}

// 音量スライダー・ミュート(7章)の変更を、再生中のBGMへ即時反映する
useSettingsStore.subscribe((state) => {
  if (bgmElement) {
    bgmElement.volume = state.muted ? 0 : state.bgmVolume;
  }
});
