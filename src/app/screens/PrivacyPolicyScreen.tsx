import { Fragment, useEffect, type ReactNode } from "react";
import { useNavigationStore, type Screen } from "@/app/store/navigationStore";
import { BackButton } from "@/components/BackButton";
import { Rb } from "@/components/Rb";
import { addPrivacyRuby } from "@/data/privacyRuby";
import { bodyHasRuby, privacyPolicySections, type PolicyBlock } from "@/data/privacyPolicy";

/** **太字** を <strong> にし、ruby=true のときは、辞書の語にふりがなを付ける(ふりがなは Rb が方針で絞る) */
function inline(text: string, ruby: boolean): ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => {
    const content = ruby ? <Rb t={addPrivacyRuby(part)} /> : part;
    return i % 2 === 1 ? <strong key={i}>{content}</strong> : <Fragment key={i}>{content}</Fragment>;
  });
}

function Block({ block, ruby }: { block: PolicyBlock; ruby: boolean }) {
  switch (block.type) {
    case "h3":
      return <h4 className="policy-subheading">{inline(block.text, true)}</h4>;
    case "p":
      return (
        <p>
          {block.lines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {inline(line, ruby)}
            </Fragment>
          ))}
        </p>
      );
    case "ul":
    case "ol": {
      const List = block.type;
      return (
        <List>
          {block.items.map((item) => (
            <li key={item.text}>
              {inline(item.text, ruby)}
              {item.children.length > 0 && (
                <ul>
                  {item.children.map((child) => (
                    <li key={child}>{inline(child, ruby)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </List>
      );
    }
    case "table":
      return (
        <div className="policy-table-wrap">
          <table className="policy-table">
            <thead>
              <tr>
                {block.header.map((cell) => (
                  <th key={cell}>{inline(cell, ruby)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={i}>{inline(cell, ruby)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

/**
 * プライバシーポリシーの画面。文章は docs/PRIVACY_POLICY.md(data/privacyPolicy.ts が読み込む)。
 * 冒頭の「かんたんに言うと」は目立つ枠に、第1条以降の本文とは区別して出す。
 * ふりがなは、「かんたんに言うと」・すべての見出し・第4条と第7条の本文にだけ付ける(条文の本文全体には付けない)。
 */
export function PrivacyPolicyScreen({ next }: { next: Screen }) {
  const goTo = useNavigationStore((s) => s.goTo);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="screen screen-policy">
      <BackButton onClick={() => goTo(next)} />
      <article className="policy">
        {privacyPolicySections.map((section, index) => {
          const ruby = bodyHasRuby(section);
          const body = section.blocks.map((block, i) => <Block key={i} block={block} ruby={ruby} />);
          if (section.kind === "title") {
            return (
              <header key={index} className="policy-header">
                <h2>{section.heading}</h2>
                {body}
              </header>
            );
          }
          if (section.kind === "summary") {
            return (
              <section key={index} className="policy-summary" aria-label={section.heading}>
                <h3>{inline(section.heading ?? "", true)}</h3>
                {body}
              </section>
            );
          }
          if (section.kind === "article") {
            return (
              <section key={index} className="policy-article">
                <h3>{inline(section.heading ?? "", true)}</h3>
                {body}
              </section>
            );
          }
          return (
            <footer key={index} className="policy-footer">
              {body}
            </footer>
          );
        })}
      </article>
    </div>
  );
}
