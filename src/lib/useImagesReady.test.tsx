import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IMAGES_READY_TIMEOUT_MS, useImagesReady } from "./useImagesReady";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** 読み込みの終わりを、テストから決められる偽の Image */
class FakeImage {
  static all: FakeImage[] = [];
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = "";
  constructor() {
    FakeImage.all.push(this);
  }
}

function Probe({ urls }: { urls: string[] }) {
  return <p data-ready={String(useImagesReady(urls))} />;
}

describe("useImagesReady", () => {
  let container: HTMLDivElement;
  const ready = () => container.querySelector("p")!.dataset.ready;

  beforeEach(() => {
    vi.useFakeTimers();
    FakeImage.all = [];
    vi.stubGlobal("Image", FakeImage);
    container = document.createElement("div");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("すべての画像の読み込みが終わってから true になる(失敗した画像も終わりとして数える)", () => {
    const root = createRoot(container);
    act(() => root.render(<Probe urls={["a.webp", "b.webp"]} />));
    expect(ready()).toBe("false");
    act(() => FakeImage.all[0].onload?.());
    expect(ready()).toBe("false");
    act(() => FakeImage.all[1].onerror?.());
    expect(ready()).toBe("true");
    act(() => root.unmount());
  });

  it("画像がなければ、すぐ true", () => {
    const root = createRoot(container);
    act(() => root.render(<Probe urls={[]} />));
    expect(ready()).toBe("true");
    act(() => root.unmount());
  });

  it("読み込みが終わらなくても、一定時間たてば true にする(案内が薄いままにならない)", () => {
    const root = createRoot(container);
    act(() => root.render(<Probe urls={["a.webp"]} />));
    expect(ready()).toBe("false");
    act(() => vi.advanceTimersByTime(IMAGES_READY_TIMEOUT_MS));
    expect(ready()).toBe("true");
    act(() => root.unmount());
  });
});
