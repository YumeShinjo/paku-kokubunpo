/**
 * 素材(画像・BGM・効果音)の受け皿(10章)。
 *
 * 素材は src/assets/ の決まった場所・決まったファイル名で置くだけで、ビルドのときに自動で見つかり、
 * コードを変えずに画面へ反映される。置いていない素材は「なし」として扱い、仮表示(絵文字・単色・
 * 合成音)のままになる。置き方の一覧は src/assets/README.md を参照。
 *
 * 名前は「フォルダからの相対パス(拡張子なし)」で指定する。例: "mascot/base" は
 *   src/assets/images/mascot/base.png(または .webp / .jpg など)に対応する。
 */

const IMAGE_EXTS = ["webp", "png", "jpg", "jpeg", "gif", "svg"];
const AUDIO_EXTS = ["mp3", "m4a", "ogg", "wav"];

const imageModules = import.meta.glob("./images/**/*.{webp,png,jpg,jpeg,gif,svg}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const audioModules = import.meta.glob("./audio/**/*.{mp3,m4a,ogg,wav}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** "./images/mascot/base.png" → { name: "mascot/base", ext: "png" } */
function splitPath(path: string, root: string): { name: string; ext: string } | null {
  const match = path.match(new RegExp(`^\\./${root}/(.+)\\.([A-Za-z0-9]+)$`));
  return match ? { name: match[1], ext: match[2].toLowerCase() } : null;
}

/** 同じ名前で拡張子違いが複数あるときは、exts の並びが先のものを使う */
function buildIndex(modules: Record<string, string>, root: string, exts: string[]): Map<string, string> {
  const rank = (ext: string) => {
    const i = exts.indexOf(ext);
    return i === -1 ? exts.length : i;
  };
  const best = new Map<string, { url: string; rank: number }>();
  for (const [path, url] of Object.entries(modules)) {
    const parsed = splitPath(path, root);
    if (!parsed) continue;
    const current = best.get(parsed.name);
    const r = rank(parsed.ext);
    if (!current || r < current.rank) best.set(parsed.name, { url, rank: r });
  }
  return new Map([...best].map(([name, v]) => [name, v.url]));
}

const imageIndex = buildIndex(imageModules, "images", IMAGE_EXTS);
const audioIndex = buildIndex(audioModules, "audio", AUDIO_EXTS);

/** 画像の実ファイルのURL。置かれていなければ undefined(呼び出し側が仮表示にする)。 */
export const findImage = (name: string): string | undefined => imageIndex.get(name);
/** 音声の実ファイルのURL。置かれていなければ undefined。 */
export const findAudio = (name: string): string | undefined => audioIndex.get(name);

/** 置かれている素材の名前一覧(確認・テスト用) */
export const listImages = (): string[] => [...imageIndex.keys()].sort();
export const listAudio = (): string[] => [...audioIndex.keys()].sort();

/* ---------------- 素材の名前(置き場所とファイル名の取り決め) ---------------- */

/** 画像の名前。src/assets/images/<名前>.png など */
export const IMAGE = {
  /** マスコットのベース(成長に関わらず常に下に敷く) */
  mascotBase: "mascot/base",
  /** 成長アクセサリー。stage 1〜7。stage N のときは 1〜N を重ねて表示する */
  mascotAccessory: (stage: number) => `mascot/accessory-${stage}`,
  /** 本来の姿(真エンディング用の1枚) */
  mascotTrue: "mascot/true",
  /** 小ボスの共通ベース。役職ごとの装飾差分を上に重ねる */
  subBossBase: "boss/subboss-base",
  /** 小ボスの役職ごとの装飾差分(エリアidごと) */
  subBossRole: (areaId: string) => `boss/subboss-${areaId}`,
  /** ラスボス(王様)。取り憑かれた姿 */
  lastBossPossessed: "boss/lastboss-possessed",
  /** ラスボス(王様)。浄化後の元の姿 */
  lastBossPurified: "boss/lastboss-purified",
  /** 背景。エリアidごと + タイトル */
  background: (areaIdOrTitle: string) => `bg/${areaIdOrTitle}`,
  /** タイトルロゴ */
  titleLogo: "ui/title-logo",
  /** 称号バッジ。選択肢のキー(castle / journey)ごと */
  titleBadge: (choiceKey: string) => `ui/badge-${choiceKey}`,
} as const;

/** マスコットの成長アクセサリーの段階数(エリア数 7 + 序章分は素体のまま) */
export const MASCOT_ACCESSORY_STAGES = 7;

/** BGMの場面。src/assets/audio/bgm/<場面>.mp3 など */
export const BGM_SCENES = [
  "title",
  "explore",
  "talk",
  "stage",
  "subBoss",
  "lastBoss",
  "truth",
  "ending",
] as const;
export type BgmScene = (typeof BGM_SCENES)[number];

/**
 * その場面の専用曲がなければ、順に代わりの曲を探す(全部そろっていなくても鳴らせる)。
 * 例: ラスボス戦の曲がなければ小ボス戦の曲、それもなければ出題中の曲。
 */
export const BGM_FALLBACK: Record<BgmScene, BgmScene[]> = {
  title: [],
  explore: ["title"],
  talk: ["explore", "title"],
  stage: ["explore", "title"],
  subBoss: ["stage", "explore", "title"],
  lastBoss: ["subBoss", "stage", "explore", "title"],
  truth: ["explore", "title"],
  ending: ["explore", "title"],
};

/**
 * 場面で鳴らす曲。`intro` があれば、それを1回鳴らしてから `loop` をくり返す
 * (例: 通常探索は「始まりの村 A → B → B…」。A が intro、B が loop)。
 */
export interface BgmTrack {
  intro?: string;
  loop: string;
}

/** 場面に使うBGM。専用曲も代わりの曲もなければ undefined(無音)。導入曲は `bgm/<場面>-intro` に置く。 */
export function findBgm(scene: BgmScene): BgmTrack | undefined {
  for (const s of [scene, ...BGM_FALLBACK[scene]]) {
    const loop = findAudio(`bgm/${s}`);
    if (loop) return { intro: findAudio(`bgm/${s}-intro`), loop };
  }
  return undefined;
}

/** 効果音のファイル。src/assets/audio/se/<種類>.mp3 など(種類は audio.ts の SeKind) */
export const seAssetName = (kind: string) => `se/${kind}`;
