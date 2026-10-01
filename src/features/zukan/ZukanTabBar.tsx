import { useRef, type KeyboardEvent } from "react";

/**
 * ことだまの書のタブバー。幅が同じ(等分)の、1行のタブを並べる。高さは44px以上。
 * 表示する文字は、短い表示ラベル(shortLabel。なければ label)。タブの名前(読み上げ)は、長い label。
 * 文字サイズ「大」で、タブが4つ以上のときは、2×2のように、2列に並べる(CSS)。
 */
export function ZukanTabBar({
  tabs,
  selected,
  onSelect,
}: {
  tabs: { id: string; label: string; shortLabel?: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((t) => t.id === selected);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    onSelect(tabs[next].id);
    listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div className="zukan-tabs">
      <div
        ref={listRef}
        className="zukan-tablist"
        role="tablist"
        aria-label="ことだまの書"
        data-count={tabs.length}
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        onKeyDown={onKeyDown}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`zukan-tab-${tab.id}`}
            aria-selected={tab.id === selected}
            aria-controls={`zukan-panel-${tab.id}`}
            aria-label={tab.label}
            tabIndex={tab.id === selected ? 0 : -1}
            className="zukan-tab"
            onClick={() => onSelect(tab.id)}
          >
            {tab.shortLabel ?? tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
