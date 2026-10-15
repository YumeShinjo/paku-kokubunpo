import { useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import type { SortingQuestion } from "@/data/schema";
import { judgeSortingItems, type Answer } from "@/engines/core/judge";
import { Ruby } from "@/components/Ruby";
import { PosChip } from "@/components/PosChip";
import { TargetText } from "@/components/TargetText";
import { duplicateTargetMarks, targetOnly } from "@/data/targetText";
import { findPartOfSpeech } from "@/data/partOfSpeech";
import { Rb } from "@/components/Rb";

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
 *  - ドラッグ&ドロップ: 単語をドラッグして、カゴに運ぶ(マウス・ペンは Pointer Events、指は Touch Events)。
 *    入れた単語はカゴの中に並び、別のカゴへドラッグして入れ直せる。
 *  - タップ選択: 単語をタップして選び、カゴのボタンをタップして入れる(キーボードや、ドラッグしづらいときの代わり)。
 * 解答後は項目ごとの正誤と解説を表示する(7章: 無音でも伝わる視覚的フィードバック)。
 */
export function SortingEngine({ question, onAnswer }: Props) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  /**
   * 1回だけやり直せる。1回目に1枚でも外したら、外したカードだけをカゴから戻し、合っているカードは固定する(lockedIds)。
   * 2回目の「こたえる」で確定する。解答(onAnswer)は、確定のときに1回だけ、1回目の入れ方で通知する
   * (星・正答率・ボス戦のライフは、「1回目が全問正解か」で決まる)。画面の結果(◎×と解説)は、確定したときの入れ方で出す。
   */
  const [lockedIds, setLockedIds] = useState<string[]>([]);
  const [retryWrongCount, setRetryWrongCount] = useState(0);
  const firstPlacementsRef = useRef<Record<string, string> | null>(null);

  const submittedRef = useRef(false); // 再描画を待たずに続けて押されても、最初の1回だけにする
  /** 押した単語と開始位置。DRAG_THRESHOLD_PX を超えて動いたら active(ドラッグ中)になる */
  const pressRef = useRef<{ itemId: string; startX: number; startY: number; active: boolean } | null>(null);
  /** ドラッグの終わりに続けて届く click(タップ選択)を、1回だけ無視する */
  const suppressClickRef = useRef(false);

  /** ドラッグ中のポインターの位置。端に近いあいだ、画面を自動でスクロールする(カゴが画面に収まらないとき用) */
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  /** 描画のたびに最新の共通処理を入れておく(タッチのリスナーは、最初に1回だけ登録するため) */
  const pressHandlersRef = useRef({ beginPress, movePress, endPress, cancelPress });

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

  // 指(タッチ)のドラッグ。スクロールを止めるには touchmove の preventDefault が必要で、そのためには
  // passive: false で直接登録する必要がある(React の onTouchMove は passive なので使えない)。
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const touchOf = (event: TouchEvent, changed: boolean) => (changed ? event.changedTouches : event.touches)[0];
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return pressHandlersRef.current.cancelPress(); // 2本指以上はドラッグにしない
      const chip = (event.target as Element | null)?.closest<HTMLElement>("[data-item-id]");
      const touch = touchOf(event, false);
      if (chip?.dataset.itemId && touch) pressHandlersRef.current.beginPress(chip.dataset.itemId, touch.clientX, touch.clientY);
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = touchOf(event, false);
      // ドラッグになったら、画面のスクロールを止める(ドラッグ前の小さな動きは止めない=タップとして扱える)
      if (touch && pressHandlersRef.current.movePress(touch.clientX, touch.clientY) && event.cancelable) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      const touch = touchOf(event, true);
      // ドラッグだったときは、続けて届く click(タップ扱い)を止める
      if (touch && pressHandlersRef.current.endPress(touch.clientX, touch.clientY) && event.cancelable) event.preventDefault();
    };
    const onTouchCancel = () => pressHandlersRef.current.cancelPress();
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: false });
    root.addEventListener("touchcancel", onTouchCancel);
    return () => {
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchCancel);
    };
  }, []);

  // 取りこぼしの安全策(ウィンドウ全体): 要素の外で離した・別のウィンドウに切り替えた・右クリックなどで、
  // 「離した」「中断した」の合図が、カードに届かなかったときも、押したままの状態(ドラッグ中の表示)を残さない
  useEffect(() => {
    const release = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pressHandlersRef.current.endPress(event.clientX, event.clientY);
    };
    const abort = () => pressHandlersRef.current.cancelPress();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") abort();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", abort);
    window.addEventListener("blur", abort);
    window.addEventListener("contextmenu", abort);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", abort);
      window.removeEventListener("blur", abort);
      window.removeEventListener("contextmenu", abort);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  pressHandlersRef.current = { beginPress, movePress, endPress, cancelPress };

  const allPlaced = question.items.every((item) => placements[item.id]);
  /** 同じ表記の語のカード(例: 「ある」が2枚)に付ける番号。配置したあとも、カゴの中・ドラッグ中・結果に、同じ番号が残る */
  // 問題を開くたびに、番号の付け方をシャッフルする(番号の順が、答えの手がかりにならないように)
  const marks = useMemo(() => duplicateTargetMarks(question.items, Math.random), [question.items]);

  function placeItem(itemId: string, categoryId: string) {
    if (submittedRef.current) return;
    setPlacements((prev) => ({ ...prev, [itemId]: categoryId }));
    setSelectedItemId(null);
  }

  function selectItem(itemId: string) {
    if (submitted || lockedIds.includes(itemId)) return;
    setSelectedItemId(itemId);
  }

  function placeSelectedInCategory(categoryId: string) {
    if (submitted || !selectedItemId) return;
    placeItem(selectedItemId, categoryId);
  }

  /*
   * ドラッグの共通処理。マウス・ペンは Pointer Events、指(タッチ)は Touch Events から、同じ関数を呼ぶ。
   * iPhone(Safari)では、指の動きを Pointer Events だけに任せると、ドラッグが始まる前にブラウザがスクロールを
   * 始めて途切れることがある。そのため、指は touchmove の preventDefault(passive: false)でスクロールを止める
   * Touch Events で扱い、Pointer Events のほうは指(pointerType === "touch")を無視する(二重に処理しない)。
   */
  function beginPress(itemId: string, x: number, y: number) {
    if (submittedRef.current || lockedIds.includes(itemId)) return; // 確定した(固定の)カードは動かせない
    // 前の押下の「離した」が届かないまま、次の押下が始まったとき(ウィンドウの外で離した・切り替えなど)も、前のドラッグの表示を残さない
    if (pressRef.current?.active) {
      stopAutoScroll();
      setDrag(null);
    }
    pressRef.current = { itemId, startX: x, startY: y, active: false };
  }

  /** ポインターを動かした。ドラッグ中(しきい値を超えた)なら true */
  function movePress(x: number, y: number): boolean {
    const press = pressRef.current;
    if (!press) return false;
    if (!press.active) {
      if (Math.hypot(x - press.startX, y - press.startY) < DRAG_THRESHOLD_PX) return false;
      press.active = true;
      setSelectedItemId(null);
    }
    pointerRef.current = { x, y };
    startAutoScroll();
    setDrag({ itemId: press.itemId, x, y, overCategoryId: categoryAt(x, y) });
    return true;
  }

  /** ポインターを離した。ドラッグだったら true(そのあとの click は選択として扱わない) */
  function endPress(x: number, y: number): boolean {
    const press = pressRef.current;
    pressRef.current = null;
    stopAutoScroll();
    if (!press?.active) return false; // 動かなかった(タップ)なら、click で選択する
    setDrag(null);
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
    const categoryId = categoryAt(x, y);
    if (categoryId) placeItem(press.itemId, categoryId);
    return true;
  }

  function cancelPress() {
    pressRef.current = null;
    stopAutoScroll();
    setDrag(null);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLElement>, itemId: string) {
    if (event.pointerType === "touch" || submitted || event.button !== 0) return; // 指は Touch Events で扱う。主ボタンだけ
    beginPress(itemId, event.clientX, event.clientY);
    try {
      event.currentTarget.setPointerCapture(event.pointerId); // ポインターが要素の外へ出ても、動きを受け取り続ける
    } catch {
      // 対応していない環境では、そのまま続ける
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    // 主ボタンが、もう押されていない(離した合図を取りこぼした)のに動いている: カードが、カーソルに付いたまま
    // 「引っかかって」動かなくなるのを防ぐため、ここで終わらせる(離した位置に入れる)
    if (pressRef.current && (event.buttons & 1) === 0) {
      endPress(event.clientX, event.clientY);
      return;
    }
    movePress(event.clientX, event.clientY);
  }

  /** 取りこぼしの安全策: キャプチャを失った(要素が入れ替わった・ウィンドウの外へ出たなど)とき、押したままの状態を残さない */
  function handleLostPointerCapture(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    if (pressRef.current) cancelPress();
  }

  function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    endPress(event.clientX, event.clientY);
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    cancelPress();
  }

  function handleItemClick(itemId: string) {
    if (suppressClickRef.current) return; // ドラッグの終わりの click は、選択として扱わない
    selectItem(itemId);
  }

  function handleSubmit() {
    if (submittedRef.current) return; // 二重に判定しない
    stopAutoScroll();
    setDrag(null);
    setSelectedItemId(null);
    const first = firstPlacementsRef.current;
    const results = judgeSortingItems(question, placements);
    const wrongIds = question.items.filter((item) => !results[item.id]).map((item) => item.id);
    if (first === null && wrongIds.length > 0) {
      // 1回目に外した: 外したカードだけを戻し、合っているカードは固定して、もう1回(答えや品詞名は出さない)
      firstPlacementsRef.current = { ...placements };
      setLockedIds(question.items.filter((item) => results[item.id]).map((item) => item.id));
      setPlacements(Object.fromEntries(Object.entries(placements).filter(([id]) => results[id])));
      setRetryWrongCount(wrongIds.length);
      return;
    }
    // 確定: 全問正解の1回目、または2回目。解答は、1回目の入れ方で、1回だけ通知する
    submittedRef.current = true;
    setSubmitted(true);
    onAnswer({ engine: "sorting", placements: first ?? placements });
  }

  const categoryLabel = (categoryId: string) =>
    question.categories.find((c) => c.id === categoryId)?.label;

  /** 小さな表示(カゴの中・ドラッグ中): 対象の語だけをカードで出す。対象がない(単語だけの)ときは、そのまま */
  function renderCompact(item: SortingItem) {
    const target = targetOnly(item.text);
    const mark = marks.get(item.id);
    return target ? (
      <span className="target-card">
        <Ruby text={target} />
        {mark && <span className="target-mark">{mark}</span>}
      </span>
    ) : (
      <>
        <Ruby text={item.text} />
        {mark && <span className="target-mark">{mark}</span>}
      </>
    );
  }

  /** 単語のカード。まだ入れていないものは文全体、カゴの中に入れたものは対象の語だけを出す(どちらからでもドラッグ・タップできる) */
  function renderItem(item: SortingItem, compact = false) {
    const placedCategory = placements[item.id];
    const isCorrect = placedCategory === item.correctCategoryId;
    const resultClass = submitted ? (isCorrect ? "correct" : "incorrect") : "";
    const locked = !submitted && lockedIds.includes(item.id);
    return (
      <button
        key={item.id}
        type="button"
        data-item-id={item.id}
        disabled={submitted || locked}
        className={[
          "sorting-item",
          locked ? "is-locked" : "",
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
        onLostPointerCapture={handleLostPointerCapture}
        onDragStart={(e) => e.preventDefault()} // ブラウザ標準のドラッグ(文字・画像を引きずる動き)が割り込まないように
        onClick={() => handleItemClick(item.id)}
      >
        {compact ? renderCompact(item) : <TargetText text={item.text} mark={marks.get(item.id)} />}
        {locked && <Lock aria-label="確定" className="sorting-lock" size={12} />}
        {submitted && (isCorrect ? " ◎" : " ×")}
      </button>
    );
  }

  const unplaced = question.items.filter((item) => !placements[item.id]);
  const draggedItem = drag ? question.items.find((item) => item.id === drag.itemId) : undefined;

  return (
    <div className="engine engine-sorting" ref={rootRef}>
      <p className="engine-prompt">
        <Ruby text={question.instruction} />
      </p>

      {retryWrongCount > 0 && !submitted && (
        <p className="sorting-retry-note" role="status">
          あと{retryWrongCount}まい ちがうよ。もういちど、えらんでみよう!
        </p>
      )}

      <div className="sorting-items" aria-label="まだ 入れていない言葉">
        {unplaced.map((item) => renderItem(item))}
        {unplaced.length === 0 && !submitted && <p className="sorting-empty">
            <Rb t="ぜんぶ入れたよ!まちがいがないか見てから「こたえる」を押してね。" />
          </p>}
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
              {question.items.filter((item) => placements[item.id] === category.id).map((item) => renderItem(item, true))}
            </div>
          </div>
        ))}
      </div>

      {draggedItem && drag && (
        <div className="sorting-ghost" style={{ left: Math.min(Math.max(drag.x, 56), window.innerWidth - 56), top: drag.y }} aria-hidden="true">
          {renderCompact(draggedItem)}
        </div>
      )}

      {/* 「こたえる」は、カゴから離した画面の下に固定して、選択肢のすぐ下で押し間違えないようにする */}
      {!submitted && (
        <div className="answer-bar">
          <button type="button" className="answer-submit" data-no-tap disabled={!allPlaced} onClick={handleSubmit}>
            こたえる
          </button>
        </div>
      )}

      {submitted && (
        <ul className="sorting-results">
          {question.items.map((item) => {
            const isCorrect = placements[item.id] === item.correctCategoryId;
            return (
              <li key={item.id} className={isCorrect ? "correct" : "incorrect"}>
                <p className="sorting-result-item">
                  <TargetText text={item.text} mark={marks.get(item.id)} />
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
