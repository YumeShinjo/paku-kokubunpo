import { useEffect } from "react";
import { assetCredits, softwareCredits, staffCredits } from "@/data/credits";
import { creditsId } from "@/features/story/storyIds";
import { useNavigationStore, type Screen } from "@/app/store/navigationStore";
import { useStoryStore } from "@/app/store/storyStore";

const KIND_ORDER = ["画像", "BGM", "SE", "フォント"];
const KIND_LABEL: Record<string, string> = { 画像: "がぞう", BGM: "BGM", SE: "こうかおん", フォント: "フォント" };

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

  // 種別ごとに分けて並べる(表にない種別は最後にまとめる)
  const kinds = [
    ...KIND_ORDER,
    ...Array.from(new Set(assetCredits.map((c) => c.kind))).filter((k) => !KIND_ORDER.includes(k)),
  ].filter((k) => assetCredits.some((c) => c.kind === k));

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
      <h2>クレジット</h2>
      {ending && <p className="credits-lead">パクっと国文法を あそんでくれて ありがとう!</p>}

      <section className="credits-section">
        <h3>せいさく</h3>
        <ul className="credits-list">
          {staffCredits.map((s) => (
            <li key={s.role}>
              <span className="credits-role">{s.role}</span> {s.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="credits-section">
        <h3>しようした そざい</h3>
        {assetCredits.length === 0 ? (
          <p className="credits-placeholder">
            しゅってんは、そざいが そろいしだい ここに のるよ。(じゅんびちゅう)
          </p>
        ) : (
          kinds.map((kind) => (
            <div key={kind}>
              <h4>{KIND_LABEL[kind] ?? kind}</h4>
              <ul className="credits-list">
                {assetCredits
                  .filter((c) => c.kind === kind)
                  .map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="credits-asset-name">
                        {c.name}
                        {c.usage && <small>({c.usage})</small>}
                      </p>
                      <p className="credits-asset-detail">
                        出典: {c.source} / ライセンス: {c.license}
                      </p>
                    </li>
                  ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="credits-section">
        <h3>つかった ソフトウェア</h3>
        <ul className="credits-list">
          {softwareCredits.map((s) => (
            <li key={s.name}>
              {s.name} <small>({s.license})</small>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" onClick={close}>
        {ending ? "おわる" : "もどる"}
      </button>
    </div>
  );
}
