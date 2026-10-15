/**
 * 実験B「BGMを AudioBuffer で鳴らす」の部品(デバッグ項目のスイッチをオンにしたときだけ使う。ふだんのBGMは、<audio> 要素で鳴らす)。
 *
 * fetch → decodeAudioData → AudioBufferSourceNode(loop) で、BGMを鳴らす。<audio> 要素と MediaElementSource を通らないので、
 * 「プレーヤー側と出力側の受け渡し」が原因のピッチの異常かどうかを、切り分けられる。
 *  - デコードは、鳴らす直前に1回だけ(load)。デコード済みのバッファは、いまのBGM1曲分だけ持つ(曲を替えたら捨てる)
 *  - 一時停止(pause)は、止めたときの位置を覚えて、source を捨てる(AudioBufferSourceNode は、止めたあとに再開できないため)。
 *    再開(start)は、その位置から、新しい source で始める
 *  - ループは、loopStart = 0・loopEnd = バッファの長さ(source.loop = true)
 * 時間を測る・繰り返す処理(setInterval・rAF)は、使わない。
 */

export interface LoadedBuffer {
  buffer: AudioBuffer;
  fetchMs: number;
  decodeMs: number;
}

/** デコード済みバッファの、メモリの大きさ(バイト): サンプル数 × チャンネル数 × 4(32ビット浮動小数) */
export function bufferBytes(buffer: AudioBuffer): number {
  return buffer.length * buffer.numberOfChannels * 4;
}

export interface BufferBgm {
  /** 読み込んで、デコードする(鳴らす直前に1回だけ)。バッファは、set で渡すまで、持たない */
  load(ctx: AudioContext, url: string): Promise<LoadedBuffer>;
  /** いまのBGMのバッファを置く(前のバッファは、捨てる) */
  set(buffer: AudioBuffer): void;
  hasBuffer(): boolean;
  isPlaying(): boolean;
  /** バッファの長さ(秒)。なければ 0 */
  duration(): number;
  /** その位置から、新しい source で鳴らし始める */
  start(ctx: AudioContext, dest: AudioNode, options: { loop: boolean; onEnded?: () => void }): { loopStart: number; loopEnd: number; loop: boolean };
  /** 止める。止めたときの位置を覚える(次の start は、そこから) */
  pause(ctx: AudioContext): void;
  /** 次の start を、頭からにする */
  rewind(): void;
  /** バッファの中の、いまの位置(秒) */
  position(ctx: AudioContext): number;
  /** 止めて、バッファも捨てる */
  stop(): void;
}

export function createBufferBgm(): BufferBgm {
  let buffer: AudioBuffer | null = null;
  let source: AudioBufferSourceNode | null = null;
  let loop = true;
  /** offset 0 の位置が、AudioContext の時計で、いつだったか(いまの位置 = ctx.currentTime - startedAt) */
  let startedAt = 0;
  /** 止めているときの位置(秒) */
  let offset = 0;

  const detach = () => {
    const s = source;
    source = null;
    if (!s) return;
    s.onended = null; // 自分で止めたときの ended は、曲の終わりとして扱わない
    try {
      s.stop();
    } catch {
      // まだ始まっていない・すでに止まっている
    }
    try {
      s.disconnect();
    } catch {
      // すでに切れている
    }
  };

  const position = (ctx: AudioContext): number => {
    if (!buffer) return 0;
    if (!source) return offset;
    const elapsed = Math.max(0, ctx.currentTime - startedAt);
    return loop ? elapsed % buffer.duration : Math.min(elapsed, buffer.duration);
  };

  return {
    async load(ctx, url) {
      // 前の曲のバッファは、デコードを始める前に捨てる(同時に2曲ぶんを持たない)
      detach();
      buffer = null;
      const t0 = performance.now();
      const response = await fetch(url);
      if ((response as { ok?: boolean }).ok === false) throw new Error(`fetch failed: ${(response as { status?: number }).status ?? ""}`);
      const data = await response.arrayBuffer();
      const t1 = performance.now();
      const decoded = await ctx.decodeAudioData(data);
      const t2 = performance.now();
      return { buffer: decoded, fetchMs: Math.round(t1 - t0), decodeMs: Math.round(t2 - t1) };
    },
    set(next) {
      detach();
      buffer = next;
      offset = 0;
    },
    hasBuffer: () => buffer !== null,
    isPlaying: () => source !== null,
    duration: () => (buffer ? buffer.duration : 0),
    start(ctx, dest, options) {
      if (!buffer) throw new Error("no buffer");
      detach();
      const s = ctx.createBufferSource();
      s.buffer = buffer;
      s.loop = options.loop;
      const loopStart = 0;
      const loopEnd = buffer.duration;
      if (options.loop) {
        s.loopStart = loopStart;
        s.loopEnd = loopEnd;
      }
      s.connect(dest);
      if (options.onEnded) {
        const onEnded = options.onEnded;
        s.onended = () => {
          if (source !== s) return; // すでに捨てた source
          source = null;
          offset = 0;
          onEnded();
        };
      }
      const from = offset >= buffer.duration ? 0 : offset;
      loop = options.loop;
      startedAt = ctx.currentTime - from;
      source = s;
      s.start(0, from);
      return { loopStart, loopEnd, loop: options.loop };
    },
    pause(ctx) {
      if (!source) return;
      offset = position(ctx);
      detach();
    },
    rewind() {
      offset = 0;
    },
    position,
    stop() {
      detach();
      buffer = null;
      offset = 0;
    },
  };
}
