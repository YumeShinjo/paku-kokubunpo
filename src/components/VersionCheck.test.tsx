import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VersionCheck } from "./VersionCheck";
import { VERSION_CHECK_MESSAGE } from "@/lib/versionCheck";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const current = { version: "0.9.0", commit: "abc1234", buildTime: "2026-10-23 12:34" };
const respond = (body: unknown, ok = true) => vi.fn(async () => ({ ok, json: async () => body }) as Response) as unknown as typeof fetch;

describe("最新の版をたしかめる(ボタン)", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const button = () => container.querySelector("button")!;
  const status = () => container.querySelector<HTMLElement>('[role="status"]')!;
  const press = async () => {
    await act(async () => {
      button().click();
    });
  };
  const mount = (props: Parameters<typeof VersionCheck>[0]) => act(() => root.render(<VersionCheck className="settings-row" {...props} />));

  it("押す前は、結果の文は空(場所をとらない)。ボタンの名前は「最新の版をたしかめる」", () => {
    mount({ current, fetchImpl: respond({ ...current }) });
    expect(button().textContent).toBe("最新の版をたしかめる");
    expect(status().textContent).toBe("");
    expect(status().getAttribute("aria-live")).toBe("polite");
  });

  it("同じ版なら「最新の版です」。更新も再読み込みもしない", async () => {
    const applyUpdate = vi.fn(async () => {});
    mount({ current, fetchImpl: respond({ ...current }), applyUpdate });
    await press();
    expect(status().textContent).toBe("最新の版です");
    expect(applyUpdate).not.toHaveBeenCalled();
  });

  it("違う版なら「新しい版があります。再読み込みします」と出して、更新の準備と再読み込みをする(1回だけ)", async () => {
    const applyUpdate = vi.fn(async () => {});
    mount({ current, fetchImpl: respond({ ...current, commit: "def5678" }), applyUpdate });
    await press();
    expect(status().textContent).toBe("新しい版があります。再読み込みします");
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });

  it("通信できないとき・version.json が読めないときは「たしかめられませんでした」。再読み込みはしない。もう一度押せる", async () => {
    const applyUpdate = vi.fn(async () => {});
    const failing = vi.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    mount({ current, fetchImpl: failing, applyUpdate });
    await press();
    expect(status().textContent).toBe("たしかめられませんでした");
    expect(applyUpdate).not.toHaveBeenCalled();
    expect(button().disabled).toBe(false);
    mount({ current, fetchImpl: respond({}, false), applyUpdate });
    await press();
    expect(status().textContent).toBe("たしかめられませんでした");
  });

  it("確認しているあいだは、ボタンを押せない(二重に押しても、取りに行くのは1回)", async () => {
    let release: (v: Response) => void = () => {};
    const slow = vi.fn(() => new Promise<Response>((resolve) => (release = resolve))) as unknown as typeof fetch;
    mount({ current, fetchImpl: slow });
    act(() => button().click());
    expect(status().textContent).toBe(VERSION_CHECK_MESSAGE.checking);
    expect(button().disabled).toBe(true);
    act(() => button().click());
    expect(slow).toHaveBeenCalledTimes(1);
    await act(async () => release({ ok: true, json: async () => ({ ...current }) } as Response));
    expect(status().textContent).toBe("最新の版です");
  });

  it("文言に、ネタバレ語と絵文字がない", () => {
    for (const text of Object.values(VERSION_CHECK_MESSAGE)) {
      for (const word of ["ラスボス", "王様", "ヴェルバルト", "コレット", "王女"]) expect(text).not.toContain(word);
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
