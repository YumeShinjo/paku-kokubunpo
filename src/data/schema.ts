/**
 * データ駆動設計の核となる型定義(9章)。
 * 出題データはこの型に従い、各問題が自身の描画エンジン(engine)を指定する(5章)。
 * 新しい単元を追加する場合は、この型に沿ったデータファイルを data/questions/ 配下に
 * 追加するだけでよい(ふりがなの書きやすさのため .ts + ruby.ts の rb() で記述する。
 * コードから分離されたデータという位置づけは変わらない)。
 */

/** ふりがな付きテキスト。<ruby> タグで描画するためセグメント単位で保持する(9章: 追加ライブラリ不要)。 */
export interface RubySegment {
  text: string;
  /** 指定時のみ <ruby>text<rt>ruby</rt></ruby> として描画する */
  ruby?: string;
}
export type RubyText = RubySegment[];

/**
 * 出題エンジンは3つに保つ(5章)。文中タップは独立したエンジンではなく、
 * 選択式(choice)の表示モードの1つとして扱う(ChoiceQuestion.display)。
 */
export type EngineType = "sorting" | "assembly" | "choice";

interface QuestionBase {
  id: string;
  /** 出題単元マッピング(4章)の細目キー。例: "hinshi-doushi" */
  unit: string;
  /** 復習システム(6章)で「星」を付与する際に使う難度・タグ等の拡張余地 */
  tags?: string[];
  /** 正誤判定後に表示する解説。図鑑・復習画面での表示を想定 */
  explanation?: RubyText;
}

/** 仕分けゲーム: 品詞分類・自立語/付属語など、語をカゴに分類する */
export interface SortingQuestion extends QuestionBase {
  engine: "sorting";
  instruction: RubyText;
  categories: { id: string; label: RubyText }[];
  items: {
    id: string;
    text: RubyText;
    correctCategoryId: string;
    /** 正誤判定後にこの項目単位で表示する解説 */
    explanation?: RubyText;
  }[];
}

/** 組み立てパズル: カード並べ替え・穴埋め(活用・音便・助詞など) */
export interface AssemblyQuestion extends QuestionBase {
  engine: "assembly";
  mode: "reorder" | "fillBlank";
  instruction: RubyText;
  /** fillBlank のとき、空欄を含む文。空欄は "___" で表す */
  sentenceTemplate?: RubyText;
  cards: { id: string; text: RubyText }[];
  /** 正解となるカードidの並び順 */
  correctOrder: string[];
}

/**
 * 選択式: 助動詞識別・紛らわしい語・敬語(場面説明付き)・文節相互の関係など。
 * display で表示モードを切り替える(判定ロジック・解答の形はどちらも同じ):
 *  - "list"(既定): 選択肢を縦に並べてタップして選ぶ
 *  - "tapInSentence": 文中の語・文節を直接タップして選ぶ(絆の間)。
 *    choices を文の語順どおりの文節として並べ、1文として表示する。
 *    given: true の文節は「問いの基準になる語」で、強調表示されタップ対象にならない。
 */
export interface ChoiceQuestion extends QuestionBase {
  engine: "choice";
  display?: "list" | "tapInSentence";
  prompt: RubyText;
  /** 敬語問題などで使う場面説明 */
  situation?: RubyText;
  choices: { id: string; text: RubyText; given?: boolean }[];
  correctChoiceId: string;
}

export type Question = SortingQuestion | AssemblyQuestion | ChoiceQuestion;

/** エリア内のステージ種別(3章) */
export type StageType = "normal" | "subBoss" | "lastBoss";

export interface Stage {
  id: string;
  areaId: string;
  type: StageType;
  /** ステージ一覧画面での表示名。例:「ステージ1」「侍女見習い」 */
  title: string;
  /**
   * このステージの問題プール。通常ステージでは出題する問題そのもの(8〜10問)。
   * 小ボスではエリア全体のプールで、pickCount 問を層化抽出して出題する(5章)。
   */
  questionIds: string[];
  /** プールから実際に出題する問題数。省略時は questionIds 全件 */
  pickCount?: number;
  /**
   * このステージに挑戦するために、先にクリアしておくステージのid(解放条件)。
   * 省略時は最初から挑戦できる。ラスボスは同じエリアの小ボスのクリアが条件(3章)。
   */
  requires?: string[];
}

export interface AreaMeta {
  id: string;
  /** 進行順(0=序章) */
  order: number;
  name: string;
  /** 単元(大分類)の表示名 */
  unitLabel: string;
  /** 小ボスの役職名。序章のように小ボスがいないエリアは undefined */
  subBoss?: string;
  /** 小ボスの名前(STORY.md のキャラクター名)。役職と並べてボス戦の表示に使う */
  subBossName?: string;
  /** ラスボス(王座の間のみ)。全エリアの内容を複合出題する総仕上げ(3章) */
  finalBoss?: string;
  /** 出題データが組み込み済みで、エリア選択に表示するか */
  implemented: boolean;
}
