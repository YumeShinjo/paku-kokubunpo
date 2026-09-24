import { useMemo } from "react";
import { areas } from "@/data/areas";
import { getAvailableUnitIds } from "@/data/questionLoader";
import { unitMetas } from "@/data/units";
import { buildUnitAccuracyRows, UNIT_ACCURACY_WINDOW } from "@/features/zukan/unitAccuracy";
import { Ruby } from "@/components/Ruby";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { EngineGuide } from "@/features/quiz/EngineGuide";
import { useStatsStore } from "@/app/store/statsStore";
import { useStoryStore } from "@/app/store/storyStore";
import { useReviewStore } from "@/app/store/reviewStore";
import { getAllQuestions } from "@/data/questionLoader";
import { TitleBadge } from "@/components/TitleBadge";
import { ZukanPages } from "@/features/zukan/ZukanPages";
import { StoryArchive } from "@/features/zukan/StoryArchive";
import { ENDING_CHOICE_EVENT_ID, getEndingTitle } from "@/data/titles";
import { buildEndingReplayScreen } from "@/features/story/storyFlow";
import { Rb } from "@/components/Rb";
import { areaNameText } from "@/data/areaText";

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
  const guideSeen = useTutorialStore((s) => s.seenGuides.includes("zukan"));
  const markGuideSeen = useTutorialStore((s) => s.markSeen);
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
      <h2>
        <Rb t="ことだまの書[しょ]" />
      </h2>
      {/* 初回だけ、使い方を出す(設定の「操作の説明をもう一度見る」でもう一度出せる) */}
      {!guideSeen && <EngineGuide guideKey="zukan" onDismiss={() => markGuideSeen("zukan")} />}
      <p className="zukan-title">
        <Rb t="称号[しょうごう]:" />{" "}
        {title ? (
          <TitleBadge title={title} />
        ) : (
          <span className="zukan-title-none">
            <Rb t="？？？(エンディングで手[て]に入[はい]るよ)" />
          </span>
        )}
      </p>
      {canReplayEnding && (
        <div className="zukan-replay">
          <button
            type="button"
            onClick={() => goTo(buildEndingReplayScreen("ohzaNoMa", { name: "zukan" }))}
          >
            <Rb t="エンディングをもう一度[いちど]見[み]る" />
          </button>
          <p className="settings-note">
            <Rb t="分[わ]かれ道[みち]で選[えら]びなおすと、称号[しょうごう]も変[か]わるよ。" />
          </p>
        </div>
      )}
      <p className="zukan-review">
        <Rb t="⭐ 苦手[にがて]問題[もんだい]:" /> <strong>{starredIds.length}</strong>
        <Rb t="問[もん](コトの好物[こうぶつ]!正解[せいかい]すると克服[こくふく]できるよ)" />
      </p>
      <ZukanPages />

      <StoryArchive />

      <h3>
        <Rb t="単元[たんげん]ごとの正答率[せいとうりつ]" />
      </h3>
      <p className="zukan-lead">
        <Rb t={`単元[たんげん]ごとの、直近[ちょっきん]${UNIT_ACCURACY_WINDOW}問[もん]の正答率[せいとうりつ]。行[ぎょう]をタップすると、その単元[たんげん]を自由[じゆう]練習[れんしゅう]できるよ!`} />
      </p>

      {areaOrder.map((area) => (
        <section key={area.id} className="zukan-area">
          <h3>
            <Rb t={areaNameText(area)} />
          </h3>
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
                        {row.weak && (
                          <span className="zukan-weak">
                            <Rb t="苦手[にがて]" />
                          </span>
                        )}
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
        <Rb t="戻[もど]る" />
      </button>
    </div>
  );
}
