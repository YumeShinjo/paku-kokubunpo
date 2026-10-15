import { useEffect, useState } from "react";
import { ExternalLink, Eye } from "lucide-react";
import { assetCredits } from "@/data/credits";
import { buildSourceGroups, requiredCredits } from "@/data/sources";
import { rb } from "@/data/ruby";
import { useNavigationStore, type Screen } from "@/app/store/navigationStore";
import { BackButton } from "@/components/BackButton";
import { CourseProof } from "@/components/CourseProof";
import { Ruby } from "@/components/Ruby";
import { Rb } from "@/components/Rb";

/**
 * 「くわしい出典」ページ(クレジット画面から開く)。使った素材すべての、名前・作者・入手元URL・ライセンスの要点を、区分ごとに出す。
 * 曲名・名前から、ストーリーの内容が分かってしまうことがあるので、最初は警告だけを出し、「ひらく」を押すまで一覧を見せない。
 * (クレジット画面は、ネタバレ防止のため、曲名などを出さない作りのまま。ここだけが、くわしい)
 */
export function SourcesScreen({ next }: { next: Screen }) {
  const goTo = useNavigationStore((s) => s.goTo);
  const [open, setOpen] = useState(false);
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
          <p className="sources-lead">
            <Rb t="このアプリで使[つか]った音楽[おんがく]・効果音[こうかおん]・画像[がぞう]・フォント・ライブラリの出典[しゅってん]です。" />
          </p>

          {/* 長いページなので、区分へ飛ぶボタン(タップできる大きさ)を並べる */}
          <nav className="sources-jump" aria-label="区分へ移動">
            {groups.map((group) => (
              <button key={group.id} type="button" onClick={() => document.getElementById(`sources-${group.id}`)?.scrollIntoView({ block: "start" })}>
                {group.title.replace(/\(.*\)$/, "")}
              </button>
            ))}
          </nav>

          <section className="sources-section" aria-labelledby="sources-required">
            <h3 id="sources-required">
              <Rb t="表記[ひょうき]が必要[ひつよう]・希望[きぼう]されている素材[そざい]" />
            </h3>
            <ul className="sources-required-list">
              {requiredCredits.map((r) => (
                <li key={r.id} className="sources-required-item">
                  <span className="sources-required-kind">
                    {r.kind}({r.basis === "必須" ? "規約で必要" : "作者の希望"})
                  </span>
                  <span className="sources-required-line">{r.line}</span>
                  <span className="sources-required-note">{r.note}</span>
                </li>
              ))}
            </ul>
          </section>

          {groups.map((group) => (
            <section key={group.id} className="sources-section" aria-labelledby={`sources-${group.id}`}>
              <h3 id={`sources-${group.id}`}>{group.title}</h3>
              <ul className="sources-list">
                {group.items.map((item, i) => (
                  <li key={`${item.name}-${i}`} className="sources-item">
                    <p className="sources-name">{item.name}</p>
                    <dl className="sources-detail">
                      <dt>作者・提供元</dt>
                      <dd>{item.source}</dd>
                      <dt>入手元</dt>
                      <dd>
                        {item.urls.length > 0 && (
                          <span className="sources-links">
                            {item.urls.map((url) => (
                              <a key={url} className="sources-link" href={url} target="_blank" rel="noopener noreferrer">
                                <span>{url}</span>
                                <ExternalLink aria-hidden="true" size={16} />
                              </a>
                            ))}
                          </span>
                        )}
                        {item.urlNote !== "" && <span className="sources-url-note">{item.urlNote}</span>}
                      </dd>
                      <dt>ライセンス・条件</dt>
                      <dd>{item.license}</dd>
                      <dt>使った場所</dt>
                      <dd>{item.usage}</dd>
                    </dl>
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
