import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { useStorageStatus } from "@/lib/safeStorage";
import { useNavigationStore } from "@/app/store/navigationStore";
import { StorageWarning } from "./StorageWarning";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("保存できていないときのお知らせ", () => {
  it("保存に失敗しているときだけ出て、「ひきつぎコード」への案内と、閉じるボタンがある", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    useStorageStatus.setState({ saveFailed: false, dismissed: false });
    act(() => root.render(<StorageWarning />));
    expect(container.querySelector(".storage-warning")).toBeNull();

    act(() => useStorageStatus.getState().markFailed());
    expect(container.querySelector(".storage-warning")).not.toBeNull();
    act(() => [...container.querySelectorAll("button")].find((b) => b.textContent?.includes("ひきつぎコード"))!.click());
    expect(useNavigationStore.getState().screen.name).toBe("transferIssue");

    act(() => [...container.querySelectorAll("button")].find((b) => b.textContent === "とじる")!.click());
    expect(container.querySelector(".storage-warning")).toBeNull();
    act(() => root.unmount());
    container.remove();
  });
});
