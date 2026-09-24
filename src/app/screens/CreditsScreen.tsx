import { useEffect } from "react";
import { assetCredits, buildCreditGroups, softwareCredits, staffCredits } from "@/data/credits";
import { creditsId } from "@/features/story/storyIds";
import { useNavigationStore, type Screen } from "@/app/store/navigationStore";
import { useStoryStore } from "@/app/store/storyStore";
import { Rb } from "@/components/Rb";
import { BackButton } from "@/components/BackButton";

const KIND_LABEL: Record<string, string> = {
  画像: "がぞう",
  BGM: "BGM",
  SE: "こうかおん",
  フォント: "フォント",
};

/**
 * クレジット画面(10章)。使用素材の出典は docs/ASSET_CREDITS.md の素材管理表から自動で表示される。
 * 設定・タイトルからいつでも見られる。エンディング後(ending)は、ねぎらいの一言つきで表示し、
 * 閉じたときに視聴済みにして next へ進む。
 */
export function CreditsScreen({
  next,
  areaId,
  ending,
}: {
  next: Screen;
  areaId?: string;
  ending?: boolean;
}) {
  const goTo = useNavigationStore((s) => s.goTo);
  const markSeen = useStoryStore((s) => s.markSeen);

  // ネタバレ防止のため、曲名・ファイル名・使用箇所は出さず、出典だけを種別ごとにまとめて出す
  const groups = buildCreditGroups(assetCredits);

  // エンディング直後のスクロール位置を引き継がないよう、先頭に戻す
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function close() {
    if (ending && areaId) markSeen(creditsId(areaId));
    goTo(next);
  }

  return (
    <div className="screen screen-credits">
      {!ending && <BackButton onClick={close} />}
      <h2>クレジット</h2>
      {ending && (
        <p className="credits-lead">
          パクっと国文法を遊んでくれてありがとう!
        </p>
      )}

      <section className="credits-section">
        <h3>
          せいさく
        </h3>
        <ul className="credits-list">
          {staffCredits.map((s) => (
            <li key={s.role}>
              <span className="credits-role">{s.role}</span> {s.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="credits-section">
        <h3>
          しようした そざい
        </h3>
        {assetCredits.length === 0 ? (
          <p className="credits-placeholder">
            <Rb t="出典[しゅってん]は、素材[そざい]が揃[そろ]い次第[しだい]ここに載[の]るよ。(準備中[じゅんびちゅう])" />
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.kind}>
              <h4>{KIND_LABEL[group.kind] ?? group.kind}</h4>
              <ul className="credits-list">
                {group.lines.map((line) => (
                  <li key={line}>
                    <p className="credits-asset-detail">{line}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="credits-section">
        <h3>
          つかった ソフトウェア
        </h3>
        <ul className="credits-list">
          {softwareCredits.map((s) => (
            <li key={s.name}>
              {s.name} <small>({s.license})</small>
            </li>
          ))}
        </ul>
      </section>

      {ending && (
        <button type="button" onClick={close}>
          おわる
        </button>
      )}
    </div>
  );
}
