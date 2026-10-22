import { useEffect, useState } from "react";
import { ExternalLink, Eye } from "lucide-react";
import { assetCredits } from "@/data/credits";
import { buildSourceGroups } from "@/data/sources";
import { rb } from "@/data/ruby";
import { useNavigationStore, type Screen } from "@/app/store/navigationStore";
import { BackButton } from "@/components/BackButton";
import { CourseProof } from "@/components/CourseProof";
import { Ruby } from "@/components/Ruby";
import { useDebugUnlock } from "@/lib/debugUnlock";

/**
 * 「くわしい出典」ページ。独立した画面(Screen の "sources")。クレジット・設定・あそびかたの最後のカードから開き、
 * 「もどる」で、開いた元の画面(next)に戻る。言の葉の森の画面・部品の中には入っていない。
 * 使った素材すべての、名前・作者・入手元(リンク)・条件の要点(1行)を、区分ごとに、短く並べる。
 * 曲名・名前から、ストーリーの内容が分かってしまうことがあるので、最初は警告だけを出し、「ひらく」を押すまで一覧を見せない。
 */
export function SourcesScreen({ next }: { next: Screen }) {
  const goTo = useNavigationStore((s) => s.goTo);
  const [opened, setOpen] = useState(false);
  // 全解放がオンのときは、ネタバレの隠し(「ひらく」を押すまで一覧を見せない)も外れる
  const debugUnlocked = useDebugUnlock();
  const open = opened || debugUnlocked;
  const groups = buildSourceGroups(assetCredits);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="screen screen-sources">
      <BackButton onClick={() => goTo(next)} />
      <h2>くわしい出典</h2>

      <div className="sources-warning" role="note">
        <p>
          <Ruby text={rb("ストーリーのネタバレを含[ふく]みます。クリア後[ご]に見[み]ることをおすすめします")} />
        </p>
      </div>

      {!open ? (
        <button type="button" className="sources-open" onClick={() => setOpen(true)}>
          <Eye aria-hidden="true" size={22} />
          <span>ひらく</span>
        </button>
      ) : (
        <>
          {/* 区分へ飛ぶボタン(高さ44px以上) */}
          <nav className="sources-jump" aria-label="区分へ移動">
            {groups.map((group) => (
              <button key={group.id} type="button" onClick={() => document.getElementById(`sources-${group.id}`)?.scrollIntoView({ block: "start" })}>
                {group.title}
              </button>
            ))}
          </nav>

          {groups.map((group) => (
            <section key={group.id} className="sources-section" aria-labelledby={`sources-${group.id}`}>
              <h3 id={`sources-${group.id}`}>{group.title}</h3>
              <ul className="sources-list">
                {group.items.map((item, i) => (
                  <li key={`${item.name}-${i}`} className="sources-item">
                    <p className="sources-head">
                      <span className="sources-name">{item.name}</span>
                      {item.mustCredit && <span className="sources-badge">表記必須</span>}
                    </p>
                    <p className="sources-by">{item.source}</p>
                    <p className="sources-links">
                      {item.urls.map((url) => (
                        <a key={url} className="sources-link" href={url} target="_blank" rel="noopener noreferrer">
                          <span>{url.replace(/^https?:\/\//, "")}</span>
                          <ExternalLink aria-hidden="true" size={14} />
                        </a>
                      ))}
                      {item.urlUnknown && <span className="sources-unknown">入手元: 要確認</span>}
                      {!item.urlUnknown && item.urls.length === 0 && item.note !== "" && <span className="sources-unknown">入手元: {item.note}</span>}
                    </p>
                    <p className="sources-summary">{item.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      {/* 講義の自作証明。ページの最後に置く */}
      <CourseProof className="sources-proof" />
    </div>
  );
}
