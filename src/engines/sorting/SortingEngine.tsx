import { useEffect, useRef, useState } from "react";
import type { SortingQuestion } from "@/data/schema";
import type { Answer } from "@/engines/core/judge";
import { Ruby } from "@/components/Ruby";
import { PosChip } from "@/components/PosChip";
import { findPartOfSpeech } from "@/data/partOfSpeech";

type SortingItem = SortingQuestion["items"][number];

interface Props {
  question: SortingQuestion;
  onAnswer: (answer: Answer) => void;
}

/** この距離(px)以上ポインターを動かしたら、タップではなくドラッグとして扱う */
const DRAG_THRESHOLD_PX = 8;

interface DragState {
  itemId: string;
  x: number;
  y: number;
  /** いまポインターの下にあるカゴ(なければ null) */
  overCategoryId: string | null;
}

/** ドラッグ中、画面の上下の端からこの距離(px)以内にポインターがあると、画面をスクロールする */
const EDGE_SCROLL_ZONE_PX = 80;

/** 画面上の座標にあるカゴ(data-category-id を持つ要素)の id */
function categoryAt(x: number, y: number): string | null {
  const element = typeof document.elementFromPoint === "function" ? document.elementFromPoint(x, y) : null;
  return element?.closest<HTMLElement>("[data-category-id]")?.dataset.categoryId ?? null;
}

/**
 * 仕分けゲームエンジン。品詞分類・自立語/付属語で使用(5章)。
 * 操作は2通り(どちらでも同じ結果になる):
 *  - ドラッグ&ドロップ: 単語をドラッグして、カゴに運ぶ(マウス・タッチ・ペン。Pointer Events)。
 *    入れた単語はカゴの中に並び、別のカゴへドラッグして入れ直せる。
 *  - タップ選択: 単語をタップして選び、カゴのボタンをタップして入れる(キーボードや、ドラッグしづらいときの代わり)。
 * 解答後は項目ごとの正誤と解説を表示する(7章: 無音でも伝わる視覚的フィードバック)。
 */
export function SortingEngine({ question, onAnswer }: Props) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);

  const submittedRef = useRef(false); // 再描画を待たずに続けて押されても、最初の1回だけにする
  /** 押した単語と開始位置。DRAG_THRESHOLD_PX を超えて動いたら active(ドラッグ中)になる */
  const pressRef = useRef<{ itemId: string; startX: number; startY: number; active: boolean } | null>(null);
  /** ドラッグの終わりに続けて届く click(タップ選択)を、1回だけ無視する */
  const suppressClickRef = useRef(false);

  /** ドラッグ中のポインターの位置。端に近いあいだ、画面を自動でスクロールする(カゴが画面に収まらないとき用) */
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

  function stopAutoScroll() {
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = null;
    pointerRef.current = null;
  }

  function startAutoScroll() {
    if (scrollFrameRef.current !== null) return;
    const tick = () => {
      const pointer = pointerRef.current;
      if (!pointer || !pressRef.current?.active) {
        scrollFrameRef.current = null;
        return;
      }
      const bottomEdge = window.innerHeight - EDGE_SCROLL_ZONE_PX;
      const dy =
        pointer.y < EDGE_SCROLL_ZONE_PX
          ? -Math.ceil((EDGE_SCROLL_ZONE_PX - pointer.y) / 6)
          : pointer.y > bottomEdge
            ? Math.ceil((pointer.y - bottomEdge) / 6)
            : 0;
      if (dy !== 0) {
        window.scrollBy(0, dy);
        // スクロールで、ポインターの下にあるカゴが変わる
        setDrag((d) => (d ? { ...d, overCategoryId: categoryAt(pointer.x, pointer.y) } : d));
      }
      scrollFrameRef.current = requestAnimationFrame(tick);
    };
    scrollFrameRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => stopAutoScroll, []);

  const allPlaced = question.items.every((item) => placements[item.id]);

  function placeItem(itemId: string, categoryId: string) {
    if (submittedRef.current) return;
    setPlacements((prev) => ({ ...prev, [itemId]: categoryId }));
    setSelectedItemId(null);
  }

  function selectItem(itemId: string) {
    if (submitted) return;
    setSelectedItemId(itemId);
  }

  function placeSelectedInCategory(categoryId: string) {
    if (submitted || !selectedItemId) return;
    placeItem(selectedItemId, categoryId);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>, itemId: string) {
    if (submitted || event.button !== 0) return; // 主ボタン(マウスの左・タッチ・ペンの接触)だけ
    pressRef.current = { itemId, startX: event.clientX, startY: event.clientY, active: false };
    try {
      event.currentTarget.setPointerCapture(event.pointerId); // 指・ポインターが要素の外へ出ても、動きを受け取り続ける
    } catch {
      // 対応していない環境では、そのまま続ける
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const press = pressRef.current;
    if (!press) return;
    if (!press.active) {
      if (Math.hypot(event.clientX - press.startX, event.clientY - press.startY) < DRAG_THRESHOLD_PX) return;
      press.active = true;
      setSelectedItemId(null);
    }
    pointerRef.current = { x: event.clientX, y: event.clientY };
    startAutoScroll();
    setDrag({
      itemId: press.itemId,
      x: event.clientX,
      y: event.clientY,
      overCategoryId: categoryAt(event.clientX, event.clientY),
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    const press = pressRef.current;
    pressRef.current = null;
    stopAutoScroll();
    if (!press?.active) return; // 動かなかった(タップ)なら、click で選択する
    setDrag(null);
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
    const categoryId = categoryAt(event.clientX, event.clientY);
    if (categoryId) placeItem(press.itemId, categoryId);
  }

  function handlePointerCancel() {
    pressRef.current = null;
    stopAutoScroll();
    setDrag(null);
  }

  function handleItemClick(itemId: string) {
    if (suppressClickRef.current) return; // ドラッグの終わりの click は、選択として扱わない
    selectItem(itemId);
  }

  function handleSubmit() {
    if (submittedRef.current) return; // 二重に判定しない
    submittedRef.current = true;
    setSubmitted(true);
    stopAutoScroll();
    setDrag(null);
    onAnswer({ engine: "sorting", placements });
  }

  const categoryLabel = (categoryId: string) =>
    question.categories.find((c) => c.id === categoryId)?.label;

  /** 単語のカード。プールにも、カゴの中にも同じものを出す(どちらからでもドラッグ・タップできる) */
  function renderItem(item: SortingItem) {
    const placedCategory = placements[item.id];
    const isCorrect = placedCategory === item.correctCategoryId;
    const resultClass = submitted ? (isCorrect ? "correct" : "incorrect") : "";
    return (
      <button
        key={item.id}
        type="button"
        disabled={submitted}
        className={[
          "sorting-item",
          selectedItemId === item.id ? "selected" : "",
          drag?.itemId === item.id ? "is-dragging" : "",
          resultClass,
        ]
          .filter(Boolean)
          .join(" ")}
        onPointerDown={(e) => handlePointerDown(e, item.id)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={() => handleItemClick(item.id)}
      >
        <Ruby text={item.text} />
        {submitted && (isCorrect ? " ◎" : " ×")}
      </button>
    );
  }

  const unplaced = question.items.filter((item) => !placements[item.id]);
  const draggedItem = drag ? question.items.find((item) => item.id === drag.itemId) : undefined;

  return (
    <div className="engine engine-sorting">
      <p className="engine-prompt">
        <Ruby text={question.instruction} />
      </p>

      <div className="sorting-items" aria-label="まだ 入れていない言葉">
        {unplaced.map(renderItem)}
        {unplaced.length === 0 && !submitted && <p className="sorting-empty">ぜんぶ 入れたよ!まちがいが ないか 見てから「こたえる」を おしてね。</p>}
      </div>

      <div className="sorting-categories">
        {question.categories.map((category) => (
          <div
            key={category.id}
            data-category-id={category.id}
            className={["sorting-basket", drag?.overCategoryId === category.id ? "is-over" : ""].filter(Boolean).join(" ")}
          >
            <button
              type="button"
              className="sorting-basket-label"
              disabled={submitted}
              onClick={() => placeSelectedInCategory(category.id)}
            >
              <Ruby text={category.label} />
            </button>
            <div className="sorting-basket-items">
              {question.items.filter((item) => placements[item.id] === category.id).map(renderItem)}
            </div>
          </div>
        ))}
      </div>

      {draggedItem && drag && (
        <div className="sorting-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <Ruby text={draggedItem.text} />
        </div>
      )}

      {!submitted && (
        <button type="button" data-no-tap disabled={!allPlaced} onClick={handleSubmit}>
          こたえる
        </button>
      )}

      {submitted && (
        <ul className="sorting-results">
          {question.items.map((item) => {
            const isCorrect = placements[item.id] === item.correctCategoryId;
            return (
              <li key={item.id} className={isCorrect ? "correct" : "incorrect"}>
                <p className="sorting-result-item">
                  <Ruby text={item.text} />
                  {" → "}
                  {isCorrect && findPartOfSpeech(item.correctCategoryId) ? (
                    // 正解が確定したあとなので、品詞の色をつけてよい(5・7章)
                    <PosChip posId={item.correctCategoryId} />
                  ) : categoryLabel(placements[item.id]) ? (
                    <Ruby text={categoryLabel(placements[item.id])!} />
                  ) : (
                    "(未回答)"
                  )}
                  {isCorrect ? " ◎" : ` ×(正解: `}
                  {!isCorrect &&
                    (findPartOfSpeech(item.correctCategoryId) ? (
                      <PosChip posId={item.correctCategoryId} />
                    ) : (
                      <Ruby text={categoryLabel(item.correctCategoryId)!} />
                    ))}
                  {!isCorrect && ")"}
                </p>
                {item.explanation && (
                  <p className="sorting-result-explanation">
                    <Ruby text={item.explanation} />
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
