import { playableAreas } from "@/data/areas";
import { engineGuides } from "@/data/engineGuide";
import { PLAYER_ICONS } from "@/data/playerIcons";
import { getAllQuestions } from "@/data/questionLoader";
import { getStagesForArea } from "@/data/stages";
import { storyEvents } from "@/data/story/events";
import { UNIT_ACCURACY_WINDOW } from "@/features/zukan/unitAccuracy";
import {
  TransferError,
  checksum,
  collectTransferData,
  fromBase64Url,
  toBase64Url,
  validateTransferData,
  type TransferData,
} from "./transferCode";

/**
 * 引き継ぎコード 版2: ステージ・問題・ストーリーなどの id を、id そのものではなく、3バイトの「指紋」(ハッシュ)で持つ。
 * コードが約6分の1(全部遊び終えても約1000文字)になり、QRコードにも収まる。
 * 指紋は、アプリのいまの一覧と照らし合わせて id に戻す。一覧に無い指紋(データの更新で消えた id)は飛ばす。
 * id の追加・並び替えがあっても、別の版のアプリで復元できる(一覧の順番には頼っていない)。
 * 指紋の計算(fingerprint)は、ここから変えないこと。変えると、以前のコードが読めなくなる。
 */
export const TRANSFER_V2_PREFIX = "PAKU2";
/** 一度に扱う個数の上限(壊れた・悪意のあるコードで、処理が重くならないように) */
const MAX_ITEMS = 5000;

/** 文字列の指紋(FNV-1a の下位24ビット) */
export function fingerprint(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash & 0xffffff;
}

/** 種類ごとの、指紋 → id の対応表 */
export interface Lookups {
  stages: Map<number, string>;
  story: Map<number, string>;
  choiceKeys: Map<number, string>;
  questions: Map<number, string>;
  units: Map<number, string>;
  guides: Map<number, string>;
  icons: Map<number, string>;
}

/** 指紋が、同じ種類の id どうしでぶつかっている組(あってはならない。テストで確かめる) */
export function fingerprintCollisions(ids: Iterable<string>): string[][] {
  const seen = new Map<number, string>();
  const clashes: string[][] = [];
  for (const id of new Set(ids)) {
    const f = fingerprint(id);
    const other = seen.get(f);
    if (other !== undefined) clashes.push([other, id]);
    else seen.set(f, id);
  }
  return clashes;
}

export function knownIds() {
  const questions = getAllQuestions();
  return {
    stages: playableAreas.flatMap((a) => getStagesForArea(a.id)).map((s) => s.id),
    story: storyEvents.map((e) => e.id),
    choiceKeys: storyEvents.flatMap((e) => e.choice?.options.map((o) => o.key) ?? []),
    questions: questions.map((q) => q.id),
    units: [...new Set(questions.map((q) => q.unit))],
    guides: Object.keys(engineGuides),
    icons: PLAYER_ICONS.map((i) => i.id),
  };
}

function lookups(): Lookups {
  const ids = knownIds();
  const table = (list: string[]) => new Map(list.map((id) => [fingerprint(id), id]));
  return {
    stages: table(ids.stages),
    story: table(ids.story),
    choiceKeys: table(ids.choiceKeys),
    questions: table(ids.questions),
    units: table(ids.units),
    guides: table(ids.guides),
    icons: table(ids.icons),
  };
}

class ByteWriter {
  readonly bytes: number[] = [];
  byte(n: number) {
    this.bytes.push(n & 0xff);
  }
  varint(n: number) {
    let v = n;
    while (v >= 0x80) {
      this.bytes.push((v % 0x80) | 0x80);
      v = Math.floor(v / 0x80);
    }
    this.bytes.push(v);
  }
  fp(text: string) {
    const f = fingerprint(text);
    this.bytes.push((f >> 16) & 0xff, (f >> 8) & 0xff, f & 0xff);
  }
  ids(list: string[], known: Map<number, string>) {
    const kept = list.filter((id) => known.get(fingerprint(id)) === id);
    this.varint(kept.length);
    for (const id of kept) this.fp(id);
  }
}

class ByteReader {
  pos = 0;
  constructor(private readonly bytes: Uint8Array) {}
  byte(): number {
    if (this.pos >= this.bytes.length) throw new TransferError("broken");
    return this.bytes[this.pos++];
  }
  varint(): number {
    let result = 0;
    let scale = 1;
    for (let i = 0; i < 6; i++) {
      const b = this.byte();
      result += (b & 0x7f) * scale;
      if ((b & 0x80) === 0) return result;
      scale *= 0x80;
    }
    throw new TransferError("broken");
  }
  fp(): number {
    return (this.byte() << 16) | (this.byte() << 8) | this.byte();
  }
  count(): number {
    const n = this.varint();
    if (n > MAX_ITEMS) throw new TransferError("broken");
    return n;
  }
  ids(known: Map<number, string>): string[] {
    const n = this.count();
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const id = known.get(this.fp());
      if (id !== undefined) out.push(id); // 一覧に無い指紋(データの更新で消えた id)は、飛ばす
    }
    return out;
  }
  get atEnd() {
    return this.pos === this.bytes.length;
  }
}

/** データを、引き継ぎコード(版2)にする */
export function encodeTransferCodeV2(data: TransferData = collectTransferData()): string {
  const known = lookups();
  const w = new ByteWriter();
  w.varint(data.score);
  w.byte(data.growth);
  w.fp(data.icon);
  w.ids(data.cleared, known.stages);
  w.ids(data.seen, known.story);
  w.ids(data.starred, known.questions);
  w.ids(data.recent, known.questions);
  w.ids(data.guides, known.guides);
  const choices = Object.entries(data.choices).filter(
    ([story, key]) => known.story.get(fingerprint(story)) === story && known.choiceKeys.get(fingerprint(key)) === key,
  );
  w.varint(choices.length);
  for (const [story, key] of choices) {
    w.fp(story);
    w.fp(key);
  }
  const units = Object.entries(data.unitRecent).filter(([unit]) => known.units.get(fingerprint(unit)) === unit);
  w.varint(units.length);
  for (const [unit, bits] of units) {
    const recent = bits.slice(-UNIT_ACCURACY_WINDOW);
    w.fp(unit);
    w.byte(recent.length);
    let value = 0;
    for (let i = 0; i < recent.length; i++) if (recent[i] === "1") value |= 1 << i;
    w.byte(value & 0xff);
    w.byte((value >> 8) & 0xff);
  }
  const payload = toBase64Url(Uint8Array.from(w.bytes));
  return `${TRANSFER_V2_PREFIX}R.${payload}.${checksum(payload)}`;
}

/** 版2の本体(base64url の部分)を読み取る。確認用の文字の検査は、呼び出し側で済んでいる */
export function decodeTransferPayloadV2(payload: string): TransferData {
  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(payload);
  } catch {
    throw new TransferError("broken");
  }
  const known = lookups();
  const r = new ByteReader(bytes);
  const score = r.varint();
  const growth = r.byte();
  const icon = known.icons.get(r.fp());
  const cleared = r.ids(known.stages);
  const seen = r.ids(known.story);
  const starred = r.ids(known.questions);
  const recent = r.ids(known.questions);
  const guides = r.ids(known.guides);
  const choices: Record<string, string> = {};
  for (let i = 0, n = r.count(); i < n; i++) {
    const story = known.story.get(r.fp());
    const key = known.choiceKeys.get(r.fp());
    if (story !== undefined && key !== undefined) choices[story] = key;
  }
  const unitRecent: Record<string, string> = {};
  for (let i = 0, n = r.count(); i < n; i++) {
    const unit = known.units.get(r.fp());
    const length = r.byte();
    const value = r.byte() | (r.byte() << 8);
    if (length > 16) throw new TransferError("broken");
    if (unit !== undefined) {
      unitRecent[unit] = Array.from({ length }, (_, k) => (((value >> k) & 1) === 1 ? "1" : "0")).join("");
    }
  }
  if (!r.atEnd || icon === undefined) throw new TransferError("broken");
  const data = validateTransferData({ cleared, score, growth, seen, choices, starred, recent, unitRecent, guides, icon });
  if (!data) throw new TransferError("broken");
  return data;
}
