import type { RubyText } from "@/data/schema";

/** データの表記(RubyText)どおりに、ふりがなをつけて描く。"___" は、空欄(四角)として描く */
export function IdiomText({ text }: { text: RubyText }) {
  return (
    <span className="ruby-text">
      {text.map((seg, i) => {
        if (seg.ruby) {
          return (
            <ruby key={i}>
              {seg.text}
              <rt>{seg.ruby}</rt>
            </ruby>
          );
        }
        const parts = seg.text.split("___");
        return (
          <span key={i}>
            {parts.map((part, j) => (
              <span key={j}>
                {j > 0 && <span className="kotonoha-blank" role="img" aria-label="空欄" />}
                {part}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}
