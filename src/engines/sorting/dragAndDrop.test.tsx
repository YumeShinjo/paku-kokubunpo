import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SortingQuestion } from "@/data/schema";
import type { Answer } from "@/engines/core/judge";
import { SortingEngine } from "./SortingEngine";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const t = (text: string) => [{ text }];

const question: SortingQuestion = {
  id: "t-dnd",
  unit: "u",
  engine: "sorting",
  instruction: t("仕分け"),
  categories: [
    { id: "c1", label: t("動詞") },
    { id: "c2", label: t("名詞") },
  ],
  items: [
    { id: "i1", text: t("走る"), correctCategoryId: "c1", explanation: t("解説") },
    { id: "i2", text: t("山"), correctCategoryId: "c2", explanation: t("解説") },
  ],
};

/**
 * 仕分けのドラッグ&ドロップ。jsdom にはレイアウトがないので、ポインターの座標から「どのカゴの上か」を
 * document.elementFromPoint の偽物で決める(x が 100 未満なら動詞のカゴ、100 以上なら名詞のカゴ、-1 なら何もない場所)。
 */
describe("仕分け: ドラッグ&ドロップ", () => {
  let container: HTMLDivElement;
  let root: Root;
  let onAnswer: ReturnType<typeof vi.fn<(a: Answer) => void>>;

  const buttons = () => [...container.querySelectorAll("button")];
  const chip = (text: string) => buttons().find((b) => b.classList.contains("sorting-item") && b.textContent?.includes(text))!;
  const basket = (id: string) => container.querySelector<HTMLElement>(`[data-category-id="${id}"]`)!;
  const basketTexts = (id: string) => [...basket(id).querySelectorAll(".sorting-basket-items button")].map((b) => b.textContent);
  const poolTexts = () => [...container.querySelectorAll(".sorting-items button")].map((b) => b.textContent);

  function pointer(el: Element, type: "pointerdown" | "pointermove" | "pointerup", x: number, y = 300) {
    act(() => {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
    });
  }

  /** 単語を (fromX) で押して、途中を通って (toX) で離す */
  function drag(el: Element, toX: number) {
    pointer(el, "pointerdown", 50);
    pointer(el, "pointermove", 60);
    pointer(el, "pointermove", toX);
    pointer(el, "pointerup", toX);
  }

  beforeEach(() => {
    onAnswer = vi.fn();
    (document as unknown as { elementFromPoint: (x: number, y: number) => Element | null }).elementFromPoint = (x) =>
      x < 0 ? container : x < 100 ? basket("c1") : basket("c2");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<SortingEngine question={question} onAnswer={onAnswer} />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete (document as unknown as { elementFromPoint?: unknown }).elementFromPoint;
  });

  it("単語をカゴまでドラッグすると、そのカゴに入り、単語はカゴの中に並ぶ", () => {
    drag(chip("走る"), 40);
    expect(basketTexts("c1")).toEqual(["走る"]);
    expect(poolTexts()).toEqual(["山"]);
    // ドラッグ中に出るゴーストは、離したら消える
    expect(container.querySelector(".sorting-ghost")).toBeNull();
  });

  it("ドラッグ中は、指(ポインター)の下のカゴが強調され、単語のゴーストがついてくる", () => {
    const el = chip("山");
    pointer(el, "pointerdown", 50);
    pointer(el, "pointermove", 150);
    expect(basket("c2").classList.contains("is-over")).toBe(true);
    expect(basket("c1").classList.contains("is-over")).toBe(false);
    expect(container.querySelector(".sorting-ghost")?.textContent).toBe("山");
    pointer(el, "pointermove", 20);
    expect(basket("c1").classList.contains("is-over")).toBe(true);
    expect(basket("c2").classList.contains("is-over")).toBe(false);
    pointer(el, "pointerup", -1); // カゴのない場所で離す
    expect(basket("c1").classList.contains("is-over")).toBe(false);
  });

  it("カゴのない場所で離したら、入らずにそのまま(もとの場所)", () => {
    drag(chip("走る"), -1);
    expect(poolTexts()).toEqual(["走る", "山"]);
    expect(basketTexts("c1")).toEqual([]);
  });

  it("ほとんど動かさない(タップ)ときは、ドラッグにならず、選択になる。そのあとカゴのボタンで入れられる", () => {
    const el = chip("走る");
    pointer(el, "pointerdown", 50);
    pointer(el, "pointermove", 52); // 8px 未満
    pointer(el, "pointerup", 52);
    act(() => el.click());
    expect(el.classList.contains("selected")).toBe(true);
    expect(container.querySelector(".sorting-ghost")).toBeNull();
    act(() => buttons().find((b) => b.classList.contains("sorting-basket-label") && b.textContent === "動詞")!.click());
    expect(basketTexts("c1")).toEqual(["走る"]);
  });

  it("ドラッグの終わりに続けて届く click は、選択として扱わない", () => {
    const el = chip("山");
    drag(el, 150); // 名詞のカゴへ
    // 入れたあとの単語(カゴの中の同じ単語)に届く click は無視される
    act(() => chip("山").click());
    expect(chip("山").classList.contains("selected")).toBe(false);
    expect(basketTexts("c2")).toEqual(["山"]);
  });

  it("カゴの中の単語を、べつのカゴへドラッグして入れなおせる", () => {
    drag(chip("走る"), 40);
    expect(basketTexts("c1")).toEqual(["走る"]);
    drag(chip("走る"), 150);
    expect(basketTexts("c1")).toEqual([]);
    expect(basketTexts("c2")).toEqual(["走る"]);
  });

  it("全部入れると「こたえる」が押せる。ドラッグで入れた結果が、そのまま解答になる(1回だけ)", () => {
    const submit = () => buttons().find((b) => b.textContent?.includes("こたえる"))!;
    drag(chip("走る"), 40);
    expect(submit().disabled).toBe(true);
    drag(chip("山"), 150);
    expect(submit().disabled).toBe(false);
    act(() => submit().click());
    act(() => submit()?.click());
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith({ engine: "sorting", placements: { i1: "c1", i2: "c2" } });
  });

  it("答え合わせのあとは、ドラッグしても動かない(単語もカゴも押せない)", () => {
    drag(chip("走る"), 150); // 間違い: 動詞を名詞のカゴへ
    drag(chip("山"), 150);
    act(() => buttons().find((b) => b.textContent?.includes("こたえる"))!.click());
    for (const b of buttons()) expect(b.disabled).toBe(true);
    drag(chip("走る"), 40);
    expect(basketTexts("c2")).toEqual(["走る ×", "山 ◎"]);
    expect(basketTexts("c1")).toEqual([]);
  });

  it("マウスの右ボタンでは、ドラッグが始まらない", () => {
    const el = chip("走る");
    act(() => {
      el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 50, clientY: 300, button: 2 }));
    });
    pointer(el, "pointermove", 150);
    pointer(el, "pointerup", 150);
    expect(basketTexts("c2")).toEqual([]);
  });

  it("ドラッグ中に画面の下の端へ寄ると、画面がスクロールする(上の端では逆向き)。離すと止まる", () => {
    vi.useFakeTimers();
    const scrollBy = vi.fn();
    window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
    try {
      const el = chip("走る");
      pointer(el, "pointerdown", 50);
      pointer(el, "pointermove", 60, window.innerHeight - 10); // 下の端
      act(() => void vi.advanceTimersByTime(100));
      expect(scrollBy).toHaveBeenCalled();
      expect(scrollBy.mock.calls.every(([, dy]) => dy > 0)).toBe(true);
      pointer(el, "pointermove", 60, 5); // 上の端
      scrollBy.mockClear();
      act(() => void vi.advanceTimersByTime(100));
      expect(scrollBy.mock.calls.every(([, dy]) => dy < 0)).toBe(true);
      pointer(el, "pointerup", 60, 5);
      scrollBy.mockClear();
      act(() => void vi.advanceTimersByTime(200));
      expect(scrollBy).not.toHaveBeenCalled(); // 離したあとは動かない
    } finally {
      vi.useRealTimers();
    }
  });

  it("画面の真ん中でドラッグしているあいだは、スクロールしない", () => {
    vi.useFakeTimers();
    const scrollBy = vi.fn();
    window.scrollBy = scrollBy as unknown as typeof window.scrollBy;
    try {
      const el = chip("走る");
      pointer(el, "pointerdown", 50);
      pointer(el, "pointermove", 60, 300);
      act(() => void vi.advanceTimersByTime(200));
      expect(scrollBy).not.toHaveBeenCalled();
      pointer(el, "pointerup", 60, 300);
    } finally {
      vi.useRealTimers();
    }
  });

  describe("指(タッチ)でのドラッグ(iPhone実機の不具合の再発防止。Touch Events で扱う)", () => {
    type TouchType = "touchstart" | "touchmove" | "touchend" | "touchcancel";

    /** jsdom には Touch がないので、touches / changedTouches を持つイベントを作って送る。cancelable なので preventDefault の有無を見られる */
    function touch(el: Element, type: TouchType, x: number, y = 300, fingers = 1) {
      const point = { clientX: x, clientY: y, identifier: 0 };
      const event = new Event(type, { bubbles: true, cancelable: true });
      const list = type === "touchend" || type === "touchcancel" ? [] : Array.from({ length: fingers }, () => point);
      Object.assign(event, { touches: list, changedTouches: [point], targetTouches: list });
      act(() => {
        el.dispatchEvent(event);
      });
      return event;
    }

    it("単語を指でドラッグしてカゴで離すと、そのカゴに入る", () => {
      const el = chip("走る");
      touch(el, "touchstart", 50);
      touch(el, "touchmove", 60);
      touch(el, "touchmove", 40);
      touch(el, "touchend", 40);
      expect(basketTexts("c1")).toEqual(["走る"]);
      expect(poolTexts()).toEqual(["山"]);
      expect(container.querySelector(".sorting-ghost")).toBeNull();
    });

    it("ドラッグ中は、画面のスクロールを止める(touchmove の既定動作を止める)。ドラッグの終わりの click も止める", () => {
      const el = chip("山");
      touch(el, "touchstart", 50);
      const small = touch(el, "touchmove", 52); // しきい値未満(タップの範囲)
      expect(small.defaultPrevented).toBe(false);
      const moved = touch(el, "touchmove", 150);
      expect(moved.defaultPrevented).toBe(true);
      expect(container.querySelector(".sorting-ghost")?.textContent).toBe("山");
      expect(basket("c2").classList.contains("is-over")).toBe(true);
      const end = touch(el, "touchend", 150);
      expect(end.defaultPrevented).toBe(true);
      expect(basketTexts("c2")).toEqual(["山"]);
    });

    it("ほとんど動かさない(タップ)ときは、何も止めず、選択になる(そのあとカゴのボタンで入れられる)", () => {
      const el = chip("走る");
      touch(el, "touchstart", 50);
      const end = touch(el, "touchend", 51);
      expect(end.defaultPrevented).toBe(false);
      act(() => el.click());
      expect(el.classList.contains("selected")).toBe(true);
    });

    it("カゴのない場所で離すと入らない。touchcancel でもドラッグをやめて、そのまま", () => {
      let el = chip("走る");
      touch(el, "touchstart", 50);
      touch(el, "touchmove", 200);
      touch(el, "touchend", -1);
      expect(poolTexts()).toEqual(["走る", "山"]);
      el = chip("山");
      touch(el, "touchstart", 50);
      touch(el, "touchmove", 200);
      touch(el, "touchcancel", 200);
      expect(container.querySelector(".sorting-ghost")).toBeNull();
      expect(poolTexts()).toEqual(["走る", "山"]);
    });

    it("2本指(ピンチなど)では、ドラッグにしない", () => {
      const el = chip("走る");
      touch(el, "touchstart", 50, 300, 2);
      const moved = touch(el, "touchmove", 150, 300, 2);
      expect(container.querySelector(".sorting-ghost")).toBeNull();
      expect(moved.defaultPrevented).toBe(false);
    });

    it("指のポインターイベント(pointerType=touch)は無視する(Touch Events と二重に処理しない)", () => {
      const el = chip("走る");
      const send = (type: string, x: number) =>
        act(() => {
          const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: 300, button: 0 });
          Object.defineProperty(e, "pointerType", { value: "touch" });
          el.dispatchEvent(e);
        });
      send("pointerdown", 50);
      send("pointermove", 150);
      send("pointerup", 150);
      expect(basketTexts("c2")).toEqual([]);
      expect(container.querySelector(".sorting-ghost")).toBeNull();
    });

    it("答え合わせのあとは、指でドラッグしても動かない", () => {
      drag(chip("走る"), 40);
      drag(chip("山"), 150);
      act(() => buttons().find((b) => b.textContent?.includes("こたえる"))!.click());
      touch(chip("走る"), "touchstart", 50);
      touch(chip("走る"), "touchmove", 150);
      touch(chip("走る"), "touchend", 150);
      expect(basketTexts("c1")).toEqual(["走る ◎"]);
      expect(basketTexts("c2")).toEqual(["山 ◎"]);
    });
  });
});

