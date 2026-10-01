import { Leaf } from "lucide-react";
import { Rb } from "@/components/Rb";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { kojiQuestions, kotowazaQuestions, type IdiomQuestion } from "@/data/kotowaza";
import { IdiomText } from "@/features/kotonoha/IdiomText";

/** 集めた葉の1枚。完全な形を見出しにして、タップで、読み・意味・由来・ユライの一言が開く */
function CollectedLeaf({ question }: { question: IdiomQuestion }) {
  return (
    <li>
      <details className="leaf-card">
        <summary>
          <Leaf aria-hidden="true" size={16} />
          <IdiomText text={question.full} />
        </summary>
        <div className="leaf-detail">
          <p className="kotonoha-reading">{question.reading}</p>
          <p>
            <IdiomText text={question.meaning} />
          </p>
          {question.origin && (
            <p>
              <span className="kotonoha-origin-label">ゆらい</span>
              <IdiomText text={question.origin} />
            </p>
          )}
          <p className="leaf-yurai">
            <span className="leaf-yurai-name">ユライ</span>
            <IdiomText text={question.yuraiLine} />
          </p>
        </div>
      </details>
    </li>
  );
}

/** まだ集めていない葉: 薄い色の葉のシルエットと「？」だけ。答えが分かる文字は、出さない */
function EmptyLeaf() {
  return (
    <li className="leaf-card is-empty" aria-label="まだ集めていない葉">
      <Leaf aria-hidden="true" size={16} />
      <span aria-hidden="true">？</span>
    </li>
  );
}

function LeafSection({ title, questions, collected }: { title: string; questions: IdiomQuestion[]; collected: Set<string> }) {
  const count = questions.filter((q) => collected.has(q.id)).length;
  return (
    <section>
      <h3>
        <Rb t={title} /> ({count} / {questions.length})
      </h3>
      <ul className="leaf-list">
        {questions.map((q) => (collected.has(q.id) ? <CollectedLeaf key={q.id} question={q} /> : <EmptyLeaf key={q.id} />))}
      </ul>
    </section>
  );
}

/**
 * ことだまの書の「ことわざ・故事成語ずかん」タブ。言の葉の森で集めた葉の一覧。
 * 集めた数(N / 80)と、ことわざ・故事成語の見出しを分けた葉のカード。
 */
export function KotonohaTab() {
  const collectedIds = useKotonohaStore((s) => s.collectedIds);
  const collected = new Set(collectedIds);
  const total = kotowazaQuestions.length + kojiQuestions.length;
  const count = [...kotowazaQuestions, ...kojiQuestions].filter((q) => collected.has(q.id)).length;
  return (
    <div className="kotonoha-tab">
      <p className="kotonoha-leaf-count" aria-label={`集めた葉 ${count} / ${total}`}>
        <Leaf aria-hidden="true" size={18} className="inline-icon" />
        <span>
          {count} / {total}
        </span>
      </p>
      <LeafSection title="ことわざ" questions={kotowazaQuestions} collected={collected} />
      <LeafSection title="故事成語[こじせいご]" questions={kojiQuestions} collected={collected} />
    </div>
  );
}
