import { findPartOfSpeech } from "@/data/partOfSpeech";
import { zukanPages, type ExampleWord } from "@/data/zukanPages";
import { autoRuby } from "@/data/furigana";
import { rb } from "@/data/ruby";
import { Ruby } from "@/components/Ruby";
import { PosChip } from "@/components/PosChip";
import { partsOfSpeech } from "@/data/partOfSpeech";
import { Rb } from "@/components/Rb";

const t = (text: string) => <Ruby text={rb(autoRuby(text))} />;

/** 例文の1語。品詞がわかっている語には、品詞の色と品詞名をそえる(色だけに頼らない) */
function Word({ word }: { word: ExampleWord }) {
  const pos = findPartOfSpeech(word.pos);
  if (!pos) return <span className="zukan-word zukan-word-plain">{word.text}</span>;
  return (
    <span className="zukan-word" style={{ background: pos.color }}>
      <span className="zukan-word-text">{word.text}</span>
      <small className="zukan-word-pos">{pos.label}</small>
    </span>
  );
}

/**
 * ことだまの書のページ(6章)。エリアをクリアしなくても、すべてのページをいつでも読める(バトル中からも開く)。
 * 品詞ごとの色分け(5・7章)は、正解がわかったあとのこの画面でだけ使う。
 */
export function ZukanPages() {
  return (
    <section className="zukan-pages">
      <h3>
        ことばの ずかん
      </h3>
      <p className="zukan-pages-lead">
        <Rb t="わからなくなったら、いつでも見[み]られるよ。(バトル中[ちゅう]も「📖 ずかん」から開[ひら]けるよ)" />
      </p>
      {zukanPages.map((page) => {
        return (
          <details key={page.areaId} className="zukan-page">
            <summary>📖 {page.title}</summary>
            <p className="zukan-page-intro">{page.intro}</p>
            {page.areaId === "kotobaNoIchiba" && (
              <p className="zukan-pos-legend" aria-label="品詞のいろ">
                {partsOfSpeech.map((p) => (
                  <PosChip key={p.id} posId={p.id} />
                ))}
              </p>
            )}
            <dl className="zukan-entries">
              {page.entries.map((entry) => (
                <div key={entry.term} className="zukan-entry">
                  <dt>{t(entry.term)}</dt>
                  <dd>
                    <p>{t(entry.meaning)}</p>
                    {entry.example && (
                      <p className="zukan-example">
                        {entry.example.map((word, i) => (
                          <Word key={i} word={word} />
                        ))}
                      </p>
                    )}
                    {entry.exampleNote && <p className="zukan-example-note">{entry.exampleNote}</p>}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        );
      })}
    </section>
  );
}
