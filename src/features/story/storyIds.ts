/**
 * ストーリーイベントidの命名規則。エリアidから一意に導出する。
 * 新しいエリアを追加するときも、この規則に沿ってイベントを足すだけでよい。
 *
 * 共通(全エリア): intro / subboss-intro(小ボス戦の前) / subboss-clear / area-clear
 * 王座の間の複数フェーズ(小ボス撃破→真相究明→ラスボス前→ラスボス撃破後→エンディング分岐→締め):
 *   subboss-clear → truth → (ラスボス挑戦時) lastboss-intro → (ラスボス撃破後)
 *   lastboss-clear → ending-choice → ending-* → epilogue → area-clear
 * ending-* の分岐先は、選択肢を持つイベント(ending-choice)のデータ側で id を指定する。
 */
export const introStoryId = (areaId: string) => `${areaId}-intro`;
/** 小ボス戦の前(取り憑かれて混乱した台詞)。戦闘開始の画面(「○○が あらわれた!」)の直前に流す */
export const subBossIntroStoryId = (areaId: string) => `${areaId}-subboss-intro`;
export const subBossClearStoryId = (areaId: string) => `${areaId}-subboss-clear`;
export const areaClearStoryId = (areaId: string) => `${areaId}-area-clear`;

/** 小ボス撃破のあと、続けて流す真相究明(王座の間) */
export const truthStoryId = (areaId: string) => `${areaId}-truth`;
/** ラスボス戦に挑む直前(初回のみ) */
export const lastBossIntroStoryId = (areaId: string) => `${areaId}-lastboss-intro`;
export const lastBossClearStoryId = (areaId: string) => `${areaId}-lastboss-clear`;
/** エンディング分岐(選択の瞬間)。選択肢を持つイベント */
export const endingChoiceStoryId = (areaId: string) => `${areaId}-ending-choice`;
/** 分岐のあと、選択に関わらず共通で流す後日談(宰相の追加台詞) */
export const epilogueStoryId = (areaId: string) => `${areaId}-epilogue`;

/**
 * エンディングの後段(ストーリーイベントではなく専用画面)。視聴済みの記録には
 * storyStore の seenStoryIds を流用し、途中で中断しても続きから再開できるようにする。
 *   area-clear(共通の締め) → ending-result(称号の授与) → credits(クレジット) → ステージ選択
 */
export const endingResultId = (areaId: string) => `${areaId}-ending-result`;
export const creditsId = (areaId: string) => `${areaId}-credits`;
