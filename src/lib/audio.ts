import { useSettingsStore } from "@/app/store/settingsStore";
import { bgmGainForUrl, findSeAudio, seGain } from "@/assets/registry";
import { isExperimentOn, logAudioDebug, registerAudioProbe, subscribeAudioDebug, watchAudioContext, watchAudioElement } from "@/lib/audioDebug";
import { bufferBytes, createBufferBgm } from "@/lib/bgmBuffer";

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
/** 直前の AudioContext の状態(実験Aが、interrupted → running を見分けるため) */
let lastCtxState = "";

/**
 * BGMと効果音の基準音量のバランス。BGMは効果音(特にクリア音・成長音)を邪魔しないよう、
 * スライダーの値に、この係数をかけて鳴らす(スライダーの最大でも効果音より控えめ)。
 */
const BGM_BASE_GAIN = 0.4;
/** 効果音でBGMをダッキング(一時的に下げる)するときの音量の倍率と、下げる・戻すときの速さ(秒) */
const DUCK_FACTOR = 0.08;
const DUCK_DOWN_SEC = 0.05;
const DUCK_UP_SEC = 0.4;

/**
 * BGM素材のサンプルレート(assets/README.md の取り決め。音声素材の統一)。AudioContext を、これに合わせて作る。
 * iOSは、バックグラウンドから戻ったときに、いったん止まった AudioContext を resume() すると、内部のクロックが
 * ハードウェアの出力レートに合うまでの一瞬(数秒ほど)、BGMのピッチが変わって聞こえることがある(WebKitの既知の挙動)。
 * サンプルレートを明示しておくと、その食い違いの一因を減らせる可能性がある(全機種で直る保証はない)。
 */
const BGM_SAMPLE_RATE = 44100;
/**
 * バックグラウンドから戻ったときだけ使う、再開の音量の戻し方。
 * 実機(iPhone)で確認したところ、ピッチが変わって聞こえる時間は、体感で3秒ほど続く。そこで:
 *  - RESUME_SETTLE_MS: 完全に無音にしておく短い時間。いちばん耳につく、鳴り始めの瞬間だけを隠す(長すぎると「音が出ない」と感じるため短めに)
 *  - RESUME_FADE_SEC: そのあと、無音から元の音量まで、ゆっくり滑らかに戻す時間。「無音→急に鳴る」ではなく、
 *    自然なフェードインに聞こえる程度の長さで、ピッチのずれが収まるころには、ほぼ元の音量に戻っているようにする
 * 合計(0.5 + 3.0 ≒ 3.5秒)が、体感のピッチずれの時間を、余裕を持って覆う長さになるようにしている。
 */
export const RESUME_SETTLE_MS = 500;
export const RESUME_FADE_SEC = 3.0;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) {
    // サンプルレートの明示は、対応していない環境(古いブラウザなど)では例外になることがあるので、そのときは既定値で作る
    try {
      audioContext = new Ctor({ sampleRate: BGM_SAMPLE_RATE });
    } catch {
      audioContext = new Ctor();
    }
    watchAudioContext(audioContext); // 調査用のログ(URLに ?audiodebug=1 があるときだけ動く。lib/audioDebug.ts)
    lastCtxState = audioContext.state;
    subscribeExperimentChanges();
    // 動き出した(running になった)ときに、鳴らそうとして待たされていたBGMを始める
    audioContext.addEventListener?.("statechange", () => {
      const prev = lastCtxState;
      lastCtxState = audioContext?.state ?? "";
      // 実験A(デバッグ項目のスイッチ。ふだんはオフ): 中断(interrupted)から戻ったら、<audio> 要素を作り直す
      if (prev === "interrupted" && audioContext?.state === "running" && isExperimentOn("rebuild")) rebuildBgmElement("interrupted→running");
      if (audioContext?.state === "running") {
        runPendingStart();
        ensureBgmPlaying();
      }
    });
  }
  return audioContext;
}

/** 1サンプルだけの無音WAV。BGM要素を最初のタップの中で「再生済み」にするために使う */
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

/** タイトル画面などでの最初のタップ/クリックのハンドラ内で呼び出す(9章)。 */
export function unlockPlayback(): void {
  useSettingsStore.getState().unlockAudio();
  updateAudioSession();
  getAudioContext(); // (なければ作る)
  // 止まっていれば動かす。iOS(Safari)は、止まった状態を "suspended" ではなく "interrupted" と呼ぶことがあり
  // (画面の読み込み直し・電話・ロックのあとなど)、"suspended" だけを見ていると再開できず、BGMも効果音も無音のままになる。
  resumeAudioContext();
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
  /** 小ボスの撃破(浄化)。7エリアの小ボス戦と、「先へすすむ」の場面で鳴る。称号の授与などは subBossClear のまま */
  | "subBossPurify"
  | "lastBossClear"
  | "tap"
  | "pageUnlock"
  /** 練習・ラウンドの終わり(自由練習・苦手練習・言の葉の森) */
  | "roundEnd"
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
  roundEnd: { freq: 660, duration: 0.4, type: "triangle" },
  subBossClear: { freq: 440, duration: 0.55, type: "square" },
  subBossPurify: { freq: 440, duration: 0.55, type: "square" },
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
      const url = findSeAudio(kind);
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
  if (!ctx) return;
  if (ctx.state !== "running") {
    resumeAudioContext(); // このタップの中で動かしておく(この1回は間に合わなくても、次からは鳴る)
    return;
  }
  if (LONG_SE.has(kind)) seBusyUntil = Math.max(seBusyUntil, Date.now() + seDurationMs(kind));

  const buffer = seBuffers.get(kind);
  if (buffer) {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = seVolume * seGain(kind); // 素材ごとの補正(ピークを -1 dBFS 以下に。assets/audioLevels.ts)
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
    watchAudioElement(bgmElement); // 調査用のログ(?audiodebug=1 のときだけ)
  }
  return bgmElement;
}

/**
 * BGM要素を GainNode 経由にする(1要素につき1回だけできる)。できなければ要素の volume で代用する。
 * createMediaElementSource は、同じ要素に2回目を呼ぶと例外になる(その要素の音は、最初のノードにつながったまま)。
 * 例外を握りつぶして、繰り返し呼ばないよう、試したかどうか(bgmSourceTried)を覚えておく。
 */
let bgmSourceTried = false;
/** BGM要素につないだ MediaElementSource(実験Aが、要素を作り直すとき、捨てるため) */
let bgmSourceNode: MediaElementAudioSourceNode | null = null;
function attachBgmGain(): void {
  if (bgmGain || bgmSourceTried) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  bgmSourceTried = true;
  try {
    const source = ctx.createMediaElementSource(getBgmElement());
    const gain = ctx.createGain();
    source.connect(gain).connect(ctx.destination);
    bgmSourceNode = source;
    bgmGain = gain;
    bgmTargetLevel = -1;
    getBgmElement().volume = 1;
    applyBgmLevel();
  } catch {
    bgmGain = null;
  }
}

/**
 * いま鳴らす曲のゲイン補正(倍率)。曲ごとの音量の差をそろえる(assets/audioLevels.ts。BGMは -16 LUFS 前後)。
 * 曲を切り替えるとき(playBgm・導入曲からループ曲へ)に、値を決めるだけ。再生・停止の仕組みには、触れない。
 */
let bgmTrackGain = 1;

/** いまのBGMの音量(ミュート・スライダー・基準・曲ごとの補正・ダッキングをかけ合わせたもの) */
function bgmLevel(): number {
  const { muted, bgmVolume } = useSettingsStore.getState();
  return muted ? 0 : bgmVolume * BGM_BASE_GAIN * bgmTrackGain * duckFactor;
}

/**
 * 最後にゲインへ予約した音量(目標)。同じ値を何度も書き込まないための記録(-1 は、まだ・分からない)。
 * ゲインの書き換え(cancelScheduledValues + setValueAtTime)は、音を処理している側(オーディオスレッド)と
 * 受け渡しをするので、値が変わらないのに繰り返すと、端末によっては、音のとぎれの原因になりうる。
 */
let bgmTargetLevel = -1;

/** いまの音量をBGMへ反映する。seconds は、その秒数かけて滑らかに変える(0なら即時)。目標が前回と同じなら、何もしない */
function applyBgmLevel(seconds = 0): void {
  const level = bgmLevel();
  if (bgmGain && audioContext) {
    if (level === bgmTargetLevel) return;
    bgmTargetLevel = level;
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
  if (useSettingsStore.getState().muted) return; // ミュート中は、動かさない(端末に「音声を使っているアプリ」と見せない)
  if (ctx && ctx.state !== "running") void ctx.resume().catch(() => {});
}

/** バックグラウンドから戻ったときの、音量を戻す予約(clearTimeoutで消せるように覚えておく) */
let resumeSettleTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 裏に回って止めたあと、戻ったときに、1回だけ始める再開の処理(AudioContext が動き出してから呼ばれる)。
 * AudioContext が止まったまま <audio> を先に再生すると、音の受け皿が動いていないあいだ、<audio> の音が流れ続けて、
 * 動き出したときに音がずれる(プツプツとしたノイズの原因になりうる)ので、必ず、動き出したあとに再生する。
 */
let pendingStart: (() => void) | null = null;

function runPendingStart(): void {
  const start = pendingStart;
  pendingStart = null;
  start?.();
}

/** 裏に回って止めた状態か(visibilitychange・pagehide・pageshow のどれが何回来ても、止める・再開するのは1回だけにするための目印) */
let backgroundHalted = false;

/**
 * 同じ曲を、最初から入れ替える(いまの曲のURLを、付け直す)。裏に回って戻ったあとの、<audio> と音の受け皿との間の状態を、
 * 場面が変わって曲を替えるときと同じ、まっさらな状態にする。導入曲を鳴らしている途中なら導入曲、そうでなければ、くり返しの曲。
 */
function reloadBgmElement(): void {
  // 実験B(AudioBuffer)で鳴らしているときは、いまの曲を、頭に戻す
  if (bgmMethod === "buffer") {
    bufferBgm.rewind();
    return;
  }
  const audio = bgmElement;
  const url = introEndedHandler ? bgmIntroSrc : bgmSrc;
  if (!audio || !url) return;
  audio.src = url;
}

/**
 * バックグラウンドから戻ったときだけ使う、再開のしかた(9章)。ここ1か所に集めてあり、止まっていた(backgroundHalted)ときに、1回だけ動く。
 *  1. 音量を0にして(前の音量の予約は取り消す)、曲を最初から入れ替える
 *  2. AudioContext が止まっていれば(suspended / interrupted)、resume() を1回呼ぶ。すでに動いていれば呼ばない
 *  3. AudioContext が動き出したあとで、<audio> を再生し、短い無音のあと、滑らかに元の音量へ戻す
 * 単純に resumeAudioContext() するだけだと、iOSでは、直前まで止まっていた AudioContext が
 * ハードウェアのクロックに合うまでの一瞬、BGMのピッチが変わって聞こえることがある(上のBGM_SAMPLE_RATEのコメント)。
 * これを完全に避ける手段(AudioContextの作り直し)は、いま使っている <audio> 要素が、一度でも
 * createMediaElementSource に渡すと、その要素はほかの AudioContext では二度と使えなくなる(仕様上の制約)ため取れない
 * (別の要素を新たに作ると、iOSでは、ユーザーの操作の中でない再生として、鳴らなくなる恐れがある)。
 * 代わりに、再開の一瞬だけ音量を0にしておき、クロックが落ち着くころに、滑らかに元の音量へ戻すことで、
 * ピッチが変わって聞こえる不具合を、耳に入らないようにする。
 */
function resumeFromBackground(): void {
  if (useSettingsStore.getState().muted) return;
  if (resumeSettleTimer) {
    clearTimeout(resumeSettleTimer);
    resumeSettleTimer = null;
  }
  pendingStart = null;
  const ctx = audioContext;
  if (bgmGain && ctx) {
    // 前に予約された音量の変化(フェードなど)を取り消してから、0にする(予約が重なって残らないように)
    const param = bgmGain.gain;
    param.cancelScheduledValues(ctx.currentTime);
    param.setValueAtTime(0, ctx.currentTime);
    bgmTargetLevel = -1; // 手で 0 にしたので、このあとの applyBgmLevel(フェードイン)は、必ず書き込む
  } else if (bgmElement) bgmElement.volume = 0;
  reloadBgmElement();

  const start = () => {
    ensureBgmPlaying();
    if (resumeSettleTimer) clearTimeout(resumeSettleTimer);
    resumeSettleTimer = setTimeout(() => {
      resumeSettleTimer = null;
      applyBgmLevel(RESUME_FADE_SEC);
    }, RESUME_SETTLE_MS);
  };
  if (!ctx || ctx.state === "running") {
    start();
    return;
  }
  pendingStart = start; // 動き出したとき(statechange、または resume の完了)に、1回だけ始める
  void ctx
    .resume()
    .then(() => {
      if (ctx.state === "running") runPendingStart();
    })
    .catch(() => {});
}

/** 裏に回った(アプリを閉じた・画面ロック)。止めていなければ、止める(すでに止めていれば何もしない) */
function onPageHidden(): void {
  if (!useSettingsStore.getState().audioUnlocked || backgroundHalted) return;
  backgroundHalted = true;
  pendingStart = null;
  haltPlayback();
}

/** 戻ってきた。裏に回って止めていたときだけ、1回だけ再開する(visibilitychange・pageshow が続けて来ても、2回目は何もしない) */
function onPageVisible(): void {
  if (!useSettingsStore.getState().audioUnlocked || !backgroundHalted || isPageHidden()) return;
  backgroundHalted = false;
  resumeFromBackground();
}

/**
 * ミュート中・バックグラウンド中に、音声の再生を実際に止める。BGMを一時停止(pause)し、AudioContext も
 * 休ませる(suspend)。音量0のまま鳴らし続けると、端末は「音声を再生中のアプリ」と扱い、他の音楽アプリの再生を止めてしまうため。
 */
function haltPlayback(): void {
  if (resumeSettleTimer) {
    clearTimeout(resumeSettleTimer);
    resumeSettleTimer = null;
  }
  bgmElement?.pause();
  pauseBufferBgm();
  const ctx = audioContext;
  if (ctx && ctx.state === "running") void ctx.suspend().catch(() => {});
}

/** play() はブラウザによって Promise を返さない/同期的に例外を投げることがあるため、両対応で呼ぶ */
function safePlay(audio: HTMLAudioElement): void {
  // 再生を始める・再開するたびに、再生速度を 1 に戻しておく(曲を入れ替えると、再生速度は defaultPlaybackRate に戻る決まり)。
  // このアプリは playbackRate を一度も変えていないので、ふだんは何もしない。1 以外になっていたら、ピッチが変わって聞こえるので、戻す。
  if (audio.playbackRate !== 1 || audio.defaultPlaybackRate !== 1) {
    logAudioDebug("playbackRate-reset", `rate=${audio.playbackRate} defRate=${audio.defaultPlaybackRate}`);
    audio.defaultPlaybackRate = 1;
    audio.playbackRate = 1;
  }
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

/** BGMを鳴らさない設定か(ミュート、またはBGMの音量が0) */
function isBgmSilenced(): boolean {
  const { muted, bgmVolume } = useSettingsStore.getState();
  return muted || bgmVolume <= 0;
}

/**
 * 音声セッションの種類を、BGMの有無に合わせる(Audio Session API。iOS 16.4以降のSafari)。
 * BGMを鳴らさない(ミュート・BGMの音量0)ときは "ambient" にして、効果音だけを、他の音楽アプリの再生を止めずに重ねて鳴らす。
 * BGMを鳴らすときは "auto"(既定)に戻す。使えない環境(古いiOS・PC)では、何もしない。
 */
function updateAudioSession(): void {
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (!session) return;
  try {
    session.type = isBgmSilenced() ? "ambient" : "auto";
  } catch {
    // 対応していない種類の設定は無視する
  }
}

/** アプリが見えていない(ホーム画面に戻った・画面ロック)あいだは、BGMを鳴らさない */
function isPageHidden(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "hidden";
}

/** BGM要素を再生する。見えていないあいだ・ミュート中は何もしない(戻ってきた/解除したとき ensureBgmPlaying が始める) */
function playBgmElement(audio: HTMLAudioElement): void {
  // 裏から戻って、AudioContext が動き出すのを待っているあいだは、再生しない(動き出したとき、いまの曲を、1回だけ始める)
  if (pendingStart) return;
  if (!isPageHidden() && !isBgmSilenced()) safePlay(audio);
}

/**
 * 曲が指定されているのに、止まったままのBGMを鳴らし直す(解禁の直後・ミュート解除・
 * AudioContext が動き出したとき・アプリに戻ったとき)。ミュート中は再生しない(止めたまま)。
 */
function ensureBgmPlaying(): void {
  if (bgmMethod === "buffer") {
    ensureBufferPlaying();
    return;
  }
  if (!bgmElement || !bgmSrc || !bgmElement.paused || backgroundHalted) return;
  // 音の受け皿(AudioContext)が止まっているあいだは、<audio> を再生しない(動き出したとき statechange が、ここを呼び直す)
  if (bgmGain && audioContext && audioContext.state !== "running") return;
  playBgmElement(bgmElement);
}

/** タップの中で、BGM要素を無音で一度再生しておく(unlockPlayback から呼ぶ) */
function primeBgmElement(): void {
  const audio = getBgmElement();
  attachBgmGain();
  if (bgmSrc !== null) return; // すでにBGMが鳴っている(または指定済み)なら触らない
  audio.src = SILENT_WAV;
  if (!isBgmSilenced()) safePlay(audio);
}

/** 導入曲が終わったらループ曲へ移るための待ち受け(曲が切り替わるとき・止めるときに外す) */
let introEndedHandler: (() => void) | null = null;
/** いま指定されている導入曲のURL(裏に回って戻ったとき、導入曲の途中なら、導入曲から入れ替える) */
let bgmIntroSrc: string | null = null;

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
  bgmTrackGain = bgmGainForUrl(introSrc ?? src); // この曲の補正(音量の差をそろえる)
  applyBgmLevel();
  bgmIntroSrc = introSrc ?? null;
  logAudioDebug("playBgm", (introSrc ?? src).split("/").pop());
  // 実験B(デバッグ項目のスイッチ。ふだんはオフ): <audio> ではなく、AudioBuffer で鳴らす
  if (isExperimentOn("buffer") && bgmGain && audioContext) {
    startBufferBgm(audio, src, introSrc);
    return;
  }
  if (bgmMethod === "buffer") leaveBufferBgm(); // AudioBuffer から、ふつうの方式に戻る(スイッチを切った)
  startBgmElement(audio, src, introSrc);
}

/** 導入曲が終わったら、くり返しの曲へ移る待ち受けを付ける(曲が切り替わるとき・止めるときに外す) */
function installIntroHandler(audio: HTMLAudioElement, src: string): void {
  introEndedHandler = () => {
    clearIntroHandler();
    audio.src = src;
    audio.loop = true;
    bgmTrackGain = bgmGainForUrl(src);
    applyBgmLevel();
    playBgmElement(audio);
  };
  audio.addEventListener("ended", introEndedHandler);
}

/** <audio> 要素で曲を鳴らし始める(ふつうの方式) */
function startBgmElement(audio: HTMLAudioElement, src: string, introSrc?: string): void {
  if (introSrc) {
    audio.src = introSrc;
    audio.loop = false;
    installIntroHandler(audio, src);
  } else {
    audio.src = src;
    audio.loop = true;
  }
  playBgmElement(audio);
  bgmSrc = src;
}

/** いま導入曲を鳴らしている途中か */
function inIntroPhase(): boolean {
  return bgmMethod === "buffer" ? bufferPhaseIntro : introEndedHandler !== null;
}

// ---------------------------------------------------------------------------
// 実験A・B(デバッグ項目の、2つのスイッチ。ふだんはオフ。lib/audioDebug.ts の isExperimentOn)。
// オフのあいだは、ここから下の処理は、どれも呼ばれない(呼ばれても、何もしない)。
// ---------------------------------------------------------------------------

/** 最後に <audio> 要素を作り直した時刻(ミリ秒)。MARK の行に出す */
let lastRebuildAt: number | null = null;

const describeElement = (audio: HTMLAudioElement) => `ready=${audio.readyState} net=${audio.networkState} paused=${audio.paused} t=${Math.round(audio.currentTime * 1000) / 1000}`;

/**
 * 実験A「復帰したら audio 要素を作り直す」。古い要素と MediaElementSource を捨て(接続を切り、src を空にして、参照を外す)、
 * 新しい要素と新しい MediaElementSource を作って、いまの GainNode につなぎ直し、いまの曲を、新しい要素で頭から鳴らし直す。
 * 呼ばれるのは、AudioContext が interrupted → running に戻ったときと、アプリが見える状態に戻って、audio の readyState が 0 だったとき。
 */
function rebuildBgmElement(reason: string): void {
  const old = bgmElement;
  const ctx = audioContext;
  if (!old || !ctx || !bgmGain || !bgmSrc || bgmMethod === "buffer") return;
  const before = describeElement(old);
  const wasIntro = introEndedHandler !== null; // 導入曲の途中なら、導入曲から入れ直す
  // 1. 古い要素と MediaElementSource を捨てる
  clearIntroHandler();
  try {
    bgmSourceNode?.disconnect();
  } catch {
    // すでに切れている
  }
  bgmSourceNode = null;
  old.pause();
  old.removeAttribute("src");
  try {
    old.load(); // 読み込み中のものを、やめさせる
  } catch {
    // 対応していない環境では、無視する
  }
  bgmElement = null;
  // 2. 新しい要素と MediaElementSource を作り、いまの GainNode につなぎ直す
  const audio = getBgmElement();
  try {
    bgmSourceNode = ctx.createMediaElementSource(audio);
    bgmSourceNode.connect(bgmGain);
    audio.volume = 1;
  } catch {
    // つなげなければ、要素の volume で代用する(attachBgmGain と同じ)
    bgmGain = null;
    bgmTargetLevel = -1;
    applyBgmLevel();
  }
  // 3. いまの曲を、新しい要素で、頭から鳴らし直す(ミュート・裏に回っている・AudioContext が止まっているあいだは、鳴らさない)
  if (wasIntro && bgmIntroSrc) {
    audio.src = bgmIntroSrc;
    audio.loop = false;
    installIntroHandler(audio, bgmSrc);
  } else {
    audio.src = bgmSrc;
    audio.loop = true;
  }
  lastRebuildAt = Date.now();
  logAudioDebug("rebuild", `reason=${reason} old(${before}) new(${describeElement(audio)})`);
  ensureBgmPlaying();
}

/** アプリが見える状態に戻ったとき、audio の readyState が 0(中身が空)なら、作り直す(実験A)。ふつうの再開処理(onPageVisible)より先に動く */
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (isPageHidden() || !isExperimentOn("rebuild")) return;
    if (bgmMethod === "audio" && bgmElement && bgmSrc && bgmElement.readyState === 0) rebuildBgmElement("visible, readyState=0");
  });
}

/** 実験B: AudioBuffer で鳴らす部品(いまのBGM1曲分のバッファだけを持つ) */
const bufferBgm = createBufferBgm();
/** いま曲を鳴らしている方式 */
let bgmMethod: "audio" | "buffer" = "audio";
/** 曲が替わったら増やす番号(古い読み込みの結果を、捨てるため) */
let bufferToken = 0;
let bufferLoop = true;
let bufferOnEnded: (() => void) | undefined;
let bufferPhaseIntro = false;
let bufferTrackNote = "";

const baseName = (url: string) => url.split("?")[0].split("/").pop() ?? url;
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

/** MARK の行に足す、再生まわりの情報(音のログが有効なときだけ呼ばれる) */
registerAudioProbe(() => ({
  method: bgmMethod,
  lastRebuildAt,
  bufferPosition: bgmMethod === "buffer" && audioContext && bufferBgm.hasBuffer() ? round3(bufferBgm.position(audioContext)) : null,
}));

/** 実験Bをやめて、ふつうの方式に戻る(バッファを捨てる) */
function leaveBufferBgm(): void {
  bufferToken++;
  bufferBgm.stop();
  bufferOnEnded = undefined;
  bufferPhaseIntro = false;
  bgmMethod = "audio";
}

/** AudioBuffer で鳴らしていれば、止める(止めた位置は覚える) */
function pauseBufferBgm(): void {
  if (bgmMethod === "buffer" && audioContext) bufferBgm.pause(audioContext);
}

/** AudioBuffer が失敗したので、ふつうの方式(<audio>)で、同じ曲を鳴らす */
function fallbackToElement(src: string, introSrc?: string): void {
  leaveBufferBgm();
  startBgmElement(getBgmElement(), src, introSrc);
}

function startBufferBgm(audio: HTMLAudioElement, src: string, introSrc?: string): void {
  audio.pause(); // <audio> は使わない(無音の準備用の曲を、鳴らしたままにしない)
  bufferToken++;
  bufferBgm.stop();
  bgmMethod = "buffer";
  bgmSrc = src;
  bufferPhaseIntro = introSrc !== undefined;
  const token = bufferToken;
  const onIntroEnded = () => {
    if (token !== bufferToken) return;
    bufferPhaseIntro = false;
    bgmTrackGain = bgmGainForUrl(src);
    applyBgmLevel();
    void loadAndPlayBuffer(src, true, token, undefined, () => fallbackToElement(src));
  };
  void loadAndPlayBuffer(introSrc ?? src, introSrc === undefined, token, introSrc ? onIntroEnded : undefined, () => fallbackToElement(src, introSrc));
}

/** 曲を読み込んで、デコードして(鳴らす直前に1回だけ)、鳴らせる状態なら鳴らす。失敗したら fallback を呼ぶ */
async function loadAndPlayBuffer(url: string, loop: boolean, token: number, onEnded: (() => void) | undefined, fallback: () => void): Promise<void> {
  const ctx = audioContext;
  if (!ctx) {
    fallback();
    return;
  }
  try {
    const loaded = await bufferBgm.load(ctx, url);
    if (token !== bufferToken) return; // 読み込んでいるあいだに、曲が替わった
    bufferBgm.set(loaded.buffer);
    bufferLoop = loop;
    bufferOnEnded = onEnded;
    const b = loaded.buffer;
    bufferTrackNote = `${baseName(url)} dur=${round3(b.duration)}s len=${b.length} sr=${b.sampleRate} ch=${b.numberOfChannels} bytes=${megabytes(bufferBytes(b))}`;
    logAudioDebug("buffer-loaded", `${bufferTrackNote} fetch=${loaded.fetchMs}ms decode=${loaded.decodeMs}ms`);
    ensureBufferPlaying();
  } catch (error) {
    if (token !== bufferToken) return;
    logAudioDebug("fallback", `buffer→audio ${baseName(url)}: ${error instanceof Error ? error.message : String(error)}`);
    fallback();
  }
}

/** AudioBuffer で、止まっている曲を鳴らす(鳴らしてよいときだけ。ensureBgmPlaying の、実験B版) */
function ensureBufferPlaying(): void {
  const ctx = audioContext;
  if (bgmMethod !== "buffer" || !bgmSrc || backgroundHalted || !bufferBgm.hasBuffer() || bufferBgm.isPlaying()) return;
  if (!ctx || !bgmGain || ctx.state !== "running" || pendingStart || isPageHidden() || isBgmSilenced()) return;
  const url = bgmSrc;
  try {
    const seam = bufferBgm.start(ctx, bgmGain, { loop: bufferLoop, onEnded: bufferOnEnded });
    logAudioDebug("buffer-play", `${bufferTrackNote} loop=${seam.loop} loopStart=${seam.loopStart} loopEnd=${round3(seam.loopEnd)}`);
  } catch (error) {
    logAudioDebug("fallback", `buffer→audio ${baseName(url)}: ${error instanceof Error ? error.message : String(error)}`);
    fallbackToElement(url, bufferPhaseIntro ? (bgmIntroSrc ?? undefined) : undefined);
  }
}

/** スイッチBを切り替えたとき、いま鳴らしている曲を、新しい方式で、頭から鳴らし直す */
let unsubscribeExperiment: (() => void) | null = null;
let lastBufferOn = false;
function subscribeExperimentChanges(): void {
  if (unsubscribeExperiment) return;
  lastBufferOn = isExperimentOn("buffer");
  unsubscribeExperiment = subscribeAudioDebug(() => {
    const on = isExperimentOn("buffer");
    if (on === lastBufferOn) return;
    lastBufferOn = on;
    const src = bgmSrc;
    if (!src) return;
    const introSrc = inIntroPhase() && bgmIntroSrc ? bgmIntroSrc : undefined;
    clearIntroHandler();
    bgmElement?.pause();
    if (bgmMethod === "buffer") leaveBufferBgm();
    bgmSrc = null;
    playBgm(src, introSrc);
  });
}

export function stopBgm(): void {
  clearIntroHandler();
  bgmElement?.pause();
  if (bgmMethod === "buffer") leaveBufferBgm();
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
const LONG_SE = new Set<SeKind>(["clear", "roundEnd", "subBossClear", "subBossPurify", "lastBossClear", "growth", "pageUnlock", "bonus"]);
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
// ミュートにしたときは、再生を実際に止める。ミュートを解除したときは、止まっていた AudioContext と BGM も動かし直す(解除のタップの中なので、iOSでも再開できる)。
useSettingsStore.subscribe((state, prev) => {
  // 音に関わる設定(BGMの音量・ミュート)が変わったときだけ、音量を書き直す(文字の大きさなど、ほかの設定の変更では触らない)
  if (state.bgmVolume !== prev.bgmVolume || state.muted !== prev.muted) {
    applyBgmLevel(0.02);
    updateAudioSession();
  }
  if (!prev.muted && state.muted) {
    haltPlayback(); // ミュート=音量0ではなく、実際に一時停止する
  } else if (prev.muted && !state.muted) {
    resumeAudioContext();
    ensureBgmPlaying();
  }
  // BGMだけ音量0にしたときは、BGMだけ止める(効果音は、そのまま鳴る)。0から戻したら、再開する
  const bgmWasOn = prev.bgmVolume > 0;
  const bgmIsOn = state.bgmVolume > 0;
  if (!state.muted) {
    if (bgmWasOn && !bgmIsOn) {
      bgmElement?.pause();
      pauseBufferBgm();
    } else if (!bgmWasOn && bgmIsOn) ensureBgmPlaying();
  }
});

// アプリがバックグラウンドに回ったら(ホーム画面に戻った・画面ロック)BGMを止め、戻ってきたら続きから鳴らす。
// ミュート中は、止めたままにする(解除すれば、続きから鳴る)。
if (typeof document !== "undefined") {
  // 3つのイベント(visibilitychange・pagehide・pageshow)は、どれも同じ2つの関数を呼ぶ。どちらも、すでにその状態なら何もしない
  document.addEventListener("visibilitychange", () => (isPageHidden() ? onPageHidden() : onPageVisible()));
}
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", onPageHidden);
  window.addEventListener("pageshow", onPageVisible);
}

// 解禁のあと、止まってしまった音(iOSの "interrupted"・読み込み直しのあとなど)を、画面をタップするたびに動かし直す。
// 音の再開は、ユーザー操作の中でないと、iOSが受け付けないことがあるため。
if (typeof document !== "undefined") {
  const wake = () => {
    if (!useSettingsStore.getState().audioUnlocked) return;
    resumeAudioContext();
    ensureBgmPlaying();
  };
  document.addEventListener("click", wake, true);
  document.addEventListener("touchend", wake, true);
}

/**
 * 音の後始末。データの初期化のあと、画面を読み込み直す前に呼ぶ。鳴っているBGMを止め、AudioContext を閉じて、
 * 古い音声の状態(iOSの音声セッション)を持ち越さないようにする。次に解禁したときは、新しく作り直される。
 */
export function shutdownAudio(): void {
  clearIntroHandler();
  if (duckTimer) clearTimeout(duckTimer);
  duckTimer = null;
  duckUntil = 0;
  duckFactor = 1;
  if (bgmElement) {
    bgmElement.pause();
    bgmElement.removeAttribute("src");
  }
  bgmElement = null;
  bgmSrc = null;
  bgmGain = null;
  bgmSourceNode = null;
  lastCtxState = "";
  unsubscribeExperiment?.();
  unsubscribeExperiment = null;
  if (bgmMethod === "buffer") leaveBufferBgm();
  bgmSourceTried = false;
  bgmTargetLevel = -1;
  bgmIntroSrc = null;
  backgroundHalted = false;
  pendingStart = null;
  if (resumeSettleTimer) clearTimeout(resumeSettleTimer);
  resumeSettleTimer = null;
  seBuffers.clear();
  sePreloadStarted = false;
  const ctx = audioContext;
  audioContext = null;
  void ctx?.close().catch(() => {});
}
