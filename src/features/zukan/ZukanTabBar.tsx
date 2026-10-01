import { Fragment, useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Rb } from "@/components/Rb";

/**
 * ことだまの書のタブバー。押しやすい高さ(44px以上)の丸いタブを並べる。
 * 幅にあまりがあるときは、タブが幅いっぱいに広がる。タブが増えて入りきらなくなったら、横にスクロールできる
 * (はみ出している側に、うっすら見切れの影を出して、続きがあることを知らせる)。
 */
export function ZukanTabBar({
  tabs,
  selected,
  onSelect,
}: {
  tabs: { id: string; label: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ start: false, end: false });

  const updateFade = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setFade((f) => (f.start === start && f.end === end ? f : { start, end }));
  }, []);

  useEffect(() => {
    updateFade();
    const el = listRef.current;
    window.addEventListener("resize", updateFade);
    const observer = typeof ResizeObserver === "undefined" || !el ? undefined : new ResizeObserver(updateFade);
    if (el) observer?.observe(el);
    return () => {
      window.removeEventListener("resize", updateFade);
      observer?.disconnect();
    };
  }, [updateFade, tabs.length]);

  // 選んだタブが、見える範囲に入るようにする
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [selected]);

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
    <div className="zukan-tabs" data-fade-start={fade.start} data-fade-end={fade.end}>
      <div ref={listRef} className="zukan-tablist" role="tablist" aria-label="ことだまの書" onScroll={updateFade} onKeyDown={onKeyDown}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`zukan-tab-${tab.id}`}
            aria-selected={tab.id === selected}
            aria-controls={`zukan-panel-${tab.id}`}
            tabIndex={tab.id === selected ? 0 : -1}
            className="zukan-tab"
            onClick={() => onSelect(tab.id)}
          >
            <span className="zukan-tab-label">
              {tab.label.split("|").map((part, i) => (
                // 「|」は、幅がせまいときに折り返してよい場所(表示には出ない)
                <Fragment key={i}>
                  {i > 0 && <wbr />}
                  <Rb t={part} />
                </Fragment>
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
