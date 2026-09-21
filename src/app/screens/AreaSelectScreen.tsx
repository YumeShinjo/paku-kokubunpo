import { playableAreas } from "@/data/areas";
import { HungryBadge } from "@/components/HungryBadge";
import { areaAccentStyle } from "@/data/areaTheme";
import { buildAreaEntryScreen } from "@/features/story/storyFlow";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";

/** エリア選択画面。出題データが組み込み済みのエリアを表示する。 */
export function AreaSelectScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const isAreaCleared = useProgressStore((s) => s.isAreaCleared);
  const hasSeen = useStoryStore((s) => s.hasSeen);

  function enterArea(areaId: string) {
    goTo(buildAreaEntryScreen(areaId, hasSeen));
  }

  return (
    <div className="screen screen-area-select">
      <h2>エリアをえらぼう</h2>
      <HungryBadge />
      <ul className="area-list">
        {playableAreas.map((area) => (
          <li key={area.id} style={areaAccentStyle(area.id)}>
            <button type="button" onClick={() => enterArea(area.id)}>
              <strong>{area.name}</strong>
              <span>{area.unitLabel}</span>
              {isAreaCleared(area.id) && <span> ✓クリア済み</span>}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => goTo({ name: "zukan" })}>
        ことだまの書
      </button>
      <button type="button" onClick={() => goTo({ name: "title" })}>
        もどる
      </button>
    </div>
  );
}
