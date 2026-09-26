import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useMascotStore } from "@/app/store/mascotStore";
import { SettingsScreen } from "./SettingsScreen";
import { TransferIssueScreen } from "./TransferIssueScreen";
import { TransferRestoreScreen } from "./TransferRestoreScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mount(node: React.ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return { container, done: () => (act(() => root.unmount()), container.remove()) };
}
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 30)); });
const byText = (c: HTMLElement, text: string) =>
  [...c.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent?.includes(text))!;
function typeInto(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("引き継ぎの画面", () => {
  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: ["prologue-stage1"], totalScore: 777 });
    useMascotStore.setState({ growthStage: 3 });
    useNavigationStore.setState({ screen: { name: "settings" } });
  });

  it("せっていから、「つくる」「いれる」の2つの画面へ進める", () => {
    const { container, done } = mount(<SettingsScreen />);
    act(() => byText(container, "ひきつぎコードを つくる").click());
    expect(useNavigationStore.getState().screen.name).toBe("transferIssue");
    act(() => byText(container, "ひきつぎコードを いれる").click());
    expect(useNavigationStore.getState().screen.name).toBe("transferRestore");
    done();
  });

  it("発行画面: コードが出て、コピーできる。人に見せない注意も出る", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { container, done } = mount(<TransferIssueScreen />);
    await flush();
    const code = container.querySelector<HTMLTextAreaElement>(".transfer-code")!.value;
    expect(code).toMatch(/^PAKU2/);
    expect(container.textContent).toContain("777");
    expect(container.textContent).toContain("見せないでね");
    await act(async () => byText(container, "コピーする").click());
    expect(writeText).toHaveBeenCalledWith(code);
    expect(container.textContent).toContain("コピーしたよ");
    done();
  });

  it("復元画面: 読み取ると、まず中身を見せる。「ふっきゅうする」を押すまで、データは変わらない", async () => {
    const issue = mount(<TransferIssueScreen />);
    await flush();
    const code = issue.container.querySelector<HTMLTextAreaElement>(".transfer-code")!.value;
    issue.done();

    // 新しい端末
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
    useMascotStore.setState({ growthStage: 0 });
    const { container, done } = mount(<TransferRestoreScreen />);
    typeInto(container.querySelector("textarea")!, code);
    await act(async () => byText(container, "よみとる").click());
    await flush();
    expect(container.querySelector(".transfer-confirm")).not.toBeNull();
    expect(container.textContent).toContain("777");
    expect(useProgressStore.getState().totalScore).toBe(0); // まだ書き換わらない

    act(() => byText(container, "やめる").click()); // やめる
    expect(container.querySelector(".transfer-confirm")).toBeNull();
    expect(useProgressStore.getState().totalScore).toBe(0);

    await act(async () => byText(container, "よみとる").click());
    await flush();
    act(() => byText(container, "ふっきゅうする").click());
    expect(useProgressStore.getState().totalScore).toBe(777);
    expect(useMascotStore.getState().growthStage).toBe(3);
    expect(container.textContent).toContain("ふっきゅうできたよ");
    done();
  });

  it("復元画面: 壊れたコードは、わかりやすいメッセージで断る。データは変わらない", async () => {
    const { container, done } = mount(<TransferRestoreScreen />);
    typeInto(container.querySelector("textarea")!, "PAKU1Z.abcdef.ZZZZ");
    await act(async () => byText(container, "よみとる").click());
    await flush();
    expect(container.querySelector(".transfer-error")?.textContent).toContain("読み取れなかった");
    expect(container.querySelector(".transfer-confirm")).toBeNull();
    expect(useProgressStore.getState().totalScore).toBe(777);
    done();
  });
});
