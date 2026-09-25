import { playableAreas } from "@/data/areas";
import { HungryBadge } from "@/components/HungryBadge";
import { areaAccentStyle } from "@/data/areaTheme";
import { buildAreaEntryScreen } from "@/features/story/storyFlow";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useStoryStore } from "@/app/store/storyStore";
import { Rb } from "@/components/Rb";
import { areaNameText, unitLabelText } from "@/data/areaText";
import { BackButton } from "@/components/BackButton";

/** エリア選択画面。出題データが組み込み済みのエリアを表示する。 */
export function AreaSelectScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const isAreaCleared = useProgressStore((s) => s.isAreaCleared);
  const isAreaUnlocked = useProgressStore((s) => s.isAreaUnlocked);
  const hasSeen = useStoryStore((s) => s.hasSeen);

  function enterArea(areaId: string) {
    goTo(buildAreaEntryScreen(areaId, hasSeen));
  }

  return (
    <div className="screen screen-area-select">
      <BackButton onClick={() => goTo({ name: "title" })} />
      <h2>
        エリアをえらぼう
      </h2>
      <HungryBadge />
      <ul className="area-list">
        {playableAreas.map((area, index) => {
          // エリアは固定の順番でしか進めない。1つ前のエリアの関門(小ボス撃破。序章はクリア)を越えるまで、入れない
          const unlocked = isAreaUnlocked(area.id);
          const previous = index > 0 ? playableAreas[index - 1] : undefined;
          return (
          <li key={area.id} style={areaAccentStyle(area.id)}>
            <button type="button" disabled={!unlocked} onClick={() => enterArea(area.id)}>
              <strong>
                <Rb t={areaNameText(area)} />
              </strong>
              <span>
                <Rb t={unitLabelText(area)} />
              </span>
              {isAreaCleared(area.id) && (
                <span>
                  {" "}
                  ✓クリア済み
                </span>
              )}
              {!unlocked && previous && (
                <span className="area-locked">
                  <Rb t={`🔒 ${areaNameText(previous)}${previous.subBoss ? "の小ボスを浄化[じょうか]" : "をクリア"}すると開[ひら]くよ`} />
                </span>
              )}
            </button>
          </li>
          );
        })}
      </ul>
      <button type="button" onClick={() => goTo({ name: "zukan" })}>
        ことだまの書
      </button>
    </div>
  );
}
