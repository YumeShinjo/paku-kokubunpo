import { areas } from "@/data/areas";
import { findPartOfSpeech } from "@/data/partOfSpeech";
import { zukanPages, type ExampleWord } from "@/data/zukanPages";
import { autoRuby } from "@/data/furigana";
import { rb } from "@/data/ruby";
import { Ruby } from "@/components/Ruby";
import { PosChip } from "@/components/PosChip";
import { partsOfSpeech } from "@/data/partOfSpeech";
import { useProgressStore } from "@/app/store/progressStore";
import { Rb } from "@/components/Rb";
import { areaNameText } from "@/data/areaText";

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
 * ことだまの書のページ(6章)。エリアをクリアすると、そのエリアのページが開く。
 * 品詞ごとの色分け(5・7章)は、正解がわかったあとのこの画面でだけ使う。
 */
export function ZukanPages() {
  const isAreaCleared = useProgressStore((s) => s.isAreaCleared);
  // クリア済みステージの変化で再描画するため、購読しておく
  useProgressStore((s) => s.clearedStageIds);

  const unlocked = zukanPages.filter((p) => isAreaCleared(p.areaId)).length;

  return (
    <section className="zukan-pages">
      <h3>
        ことばの ずかん
      </h3>
      <p className="zukan-pages-lead">
        <Rb t={`エリアをクリアすると、ページが増[ふ]えるよ。(${unlocked} / ${zukanPages.length}ページ)`} />
      </p>
      {zukanPages.map((page) => {
        const area = areas.find((a) => a.id === page.areaId);
        if (!isAreaCleared(page.areaId)) {
          return (
            <p key={page.areaId} className="zukan-page-locked">
              🔒 {area ? <Rb t={areaNameText(area)} /> : page.title}{" "}
                <small>
                  クリアすると ひらくよ
                </small>
            </p>
          );
        }
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
