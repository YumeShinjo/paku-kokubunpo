import { useMemo } from "react";
import { areas } from "@/data/areas";
import { getAvailableUnitIds } from "@/data/questionLoader";
import { unitMetas } from "@/data/units";
import { buildUnitAccuracyRows, UNIT_ACCURACY_WINDOW } from "@/features/zukan/unitAccuracy";
import { Ruby } from "@/components/Ruby";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useStatsStore } from "@/app/store/statsStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { useMascotStore } from "@/app/store/mascotStore";
import { getAllQuestions } from "@/data/questionLoader";
import { TitleBadge } from "@/components/TitleBadge";
import { ZukanPages } from "@/features/zukan/ZukanPages";
import { StoryArchive } from "@/features/zukan/StoryArchive";
import { ENDING_CHOICE_EVENT_ID, getEndingTitle } from "@/data/titles";
import { buildEndingReplayScreen } from "@/features/story/storyFlow";

/**
 * ことだまの書(図鑑)。6章の「苦手単元の可視化・自由練習」:
 * 単元ごとの正答率を横棒グラフで一覧し、各行をタップするとその単元の自由練習に入る。
 * 正答率は単元ごとの直近10問ベース(累計ではなく、今の得意・苦手を映す)。
 * 単一系列なので凡例は置かず、数値(正答率と正解数/解答数)は行のテキストとして常に表示する。
 */
export function ZukanScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const unitRecent = useStatsStore((s) => s.unitRecent);
  const choices = useStoryStore((s) => s.choices);
  const starredIds = useReviewStore((s) => s.starredQuestionIds);
  const bonusCount = useMascotStore((s) => s.bonusAccessoryIds.length);
  // 単元ごとの星の数(単元名の横に表示)
  const starsByUnit = useMemo(() => {
    const unitOf = new Map(getAllQuestions().map((q) => [q.id, q.unit]));
    const counts = new Map<string, number>();
    for (const id of starredIds) {
      const unit = unitOf.get(id);
      if (unit) counts.set(unit, (counts.get(unit) ?? 0) + 1);
    }
    return counts;
  }, [starredIds]);
  const title = getEndingTitle(choices);
  // エンディングの分岐まで進んでいれば、見返せる(選びなおして称号を変えることもできる)
  const canReplayEnding = choices[ENDING_CHOICE_EVENT_ID] !== undefined;

  const rows = useMemo(
    () => buildUnitAccuracyRows(unitMetas, unitRecent, getAvailableUnitIds()),
    [unitRecent],
  );
  const areaOrder = areas.filter((a) => rows.some((r) => r.areaId === a.id));

  return (
    <div className="screen screen-zukan">
      <h2>ことだまの書</h2>
      <p className="zukan-title">
        しょうごう:{" "}
        {title ? (
          <TitleBadge title={title} />
        ) : (
          <span className="zukan-title-none">？？？(エンディングで てにはいるよ)</span>
        )}
      </p>
      {canReplayEnding && (
        <div className="zukan-replay">
          <button
            type="button"
            onClick={() => goTo(buildEndingReplayScreen("ohzaNoMa", { name: "zukan" }))}
          >
            エンディングを もういちど 見る
          </button>
          <p className="settings-note">分かれ道でえらびなおすと、しょうごうも かわるよ。</p>
        </div>
      )}
      <p className="zukan-review">
        ⭐ ふくしゅうちゅう: <strong>{starredIds.length}</strong>もん(コトの こうぶつ!
        せいかいすると こくふくして、アクセサリーが ふえるよ)
        {bonusCount > 0 && (
          <>
            {" "}
            ✨ ボーナスアクセサリー: <strong>{bonusCount}</strong>こ
          </>
        )}
      </p>
      <ZukanPages />

      <StoryArchive />

      <h3>たんげんごとの せいとうりつ</h3>
      <p className="zukan-lead">
        たんげんごとの、ちょっきん{UNIT_ACCURACY_WINDOW}もんの せいとうりつ。ぎょうを タップすると、その たんげんを じゆうれんしゅう できるよ!
      </p>

      {areaOrder.map((area) => (
        <section key={area.id} className="zukan-area">
          <h3>{area.name}</h3>
          <ul className="zukan-list">
            {rows
              .filter((r) => r.areaId === area.id)
              .map((row) => {
                const percent = row.rate === null ? 0 : Math.round(row.rate * 100);
                return (
                  <li key={row.unitId}>
                    <button
                      type="button"
                      className="zukan-row"
                      onClick={() => goTo({ name: "freePractice", unitId: row.unitId })}
                    >
                      <span className="zukan-row-label">
                        <Ruby text={row.label} />
                        {row.weak && <span className="zukan-weak">にがて</span>}
                        {(starsByUnit.get(row.unitId) ?? 0) > 0 && (
                          <span className="zukan-stars">⭐{starsByUnit.get(row.unitId)}</span>
                        )}
                      </span>
                      <span className="zukan-bar" aria-hidden="true">
                        <span className="zukan-bar-fill" style={{ width: `${percent}%` }} />
                      </span>
                      <span className="zukan-row-value">
                        {row.rate === null ? (
                          "まだ"
                        ) : (
                          <>
                            <strong>{percent}%</strong>
                            <small>
                              {row.correct}/{row.total}
                            </small>
                          </>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      <button type="button" onClick={() => goTo({ name: "title" })}>
        もどる
      </button>
    </div>
  );
}
