import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";

const reset = vi.hoisted(() => ({
  resetAllData: vi.fn(async () => ({ removedKeys: [], ranking: "not-joined" as const })),
  reloadApp: vi.fn(),
}));
vi.mock("@/features/settings/resetData", () => reset);

import { SettingsScreen } from "./SettingsScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("設定画面: データの初期化", () => {
  let container: HTMLDivElement;
  let root: Root;
  const buttons = () => [...container.querySelectorAll("button")];
  const byText = (text: string) => buttons().find((b) => b.textContent?.includes(text));

  beforeEach(() => {
    reset.resetAllData.mockClear();
    reset.reloadApp.mockClear();
    useNavigationStore.setState({ screen: { name: "settings" } });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<SettingsScreen />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("「データを初期化する」を押しただけでは消さない。確認が出る", () => {
    act(() => byText("データを初期化")!.click());
    expect(container.querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(reset.resetAllData).not.toHaveBeenCalled();
  });

  it("確認で「やめる」を押すと、何も消さずにもとへ戻る", () => {
    act(() => byText("データを初期化")!.click());
    act(() => byText("やめる")!.click());
    expect(container.querySelector('[role="alertdialog"]')).toBeNull();
    expect(reset.resetAllData).not.toHaveBeenCalled();
    expect(reset.reloadApp).not.toHaveBeenCalled();
  });

  it("確認で「初期化する」を押すと、データを消して、画面を読み込み直す", async () => {
    act(() => byText("データを初期化")!.click());
    await act(async () => {
      container.querySelector<HTMLButtonElement>(".quit-yes")!.click();
    });
    expect(reset.resetAllData).toHaveBeenCalledTimes(1);
    expect(reset.reloadApp).toHaveBeenCalledTimes(1);
  });
});
