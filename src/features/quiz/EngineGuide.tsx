import { engineGuides, guideFooter, type GuideKey } from "@/data/engineGuide";
import { Ruby } from "@/components/Ruby";

/**
 * 初回プレイ時だけ、その出題形式の操作を問題の上に出すカード。
 * 問題の画面は隠さない(実際の操作部品を見ながら読める)。「わかった!」で閉じて既読にする。
 */
export function EngineGuide({ guideKey, onDismiss }: { guideKey: GuideKey; onDismiss: () => void }) {
  const guide = engineGuides[guideKey];
  return (
    <aside className="engine-guide" aria-label="操作の説明">
      <p className="engine-guide-title">
        💡 <Ruby text={guide.title} />
      </p>
      <ol className="engine-guide-steps">
        {guide.steps.map((step, i) => (
          <li key={i}>
            <Ruby text={step} />
          </li>
        ))}
      </ol>
      <p className="engine-guide-footer">
        <Ruby text={guide.footer ?? guideFooter} />
      </p>
      <button type="button" onClick={onDismiss}>
        わかった!
      </button>
    </aside>
  );
}
