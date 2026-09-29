import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { PrivacyPolicyScreen } from "./PrivacyPolicyScreen";
import { TitleScreen } from "./TitleScreen";
import { SettingsScreen } from "./SettingsScreen";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("プライバシーポリシーの画面", () => {
  let container: HTMLDivElement;
  let root: Root;

  const mount = (node: React.ReactElement) => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(node));
  };
  const rubyOf = (el: Element | null) => [...(el?.querySelectorAll("rt") ?? [])].map((rt) => rt.textContent);

  beforeEach(() => {
    window.scrollTo = () => {};
    useNavigationStore.setState({ screen: { name: "privacy", next: { name: "settings" } } });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("見出し・表・箇条書きで表示し、運営者向けメモは表示しない", () => {
    mount(<PrivacyPolicyScreen next={{ name: "title" }} />);
    expect(container.querySelector("h2")?.textContent).toBe("プライバシーポリシー");
    expect(container.querySelectorAll(".policy-article")).toHaveLength(10);
    expect(container.querySelectorAll("table")).toHaveLength(2);
    expect(container.querySelectorAll(".policy-summary li")).toHaveLength(5);
    expect(container.querySelector(".policy-article ol")).not.toBeNull();
    expect(container.textContent).not.toContain("運営者向けメモ");
    expect(container.querySelector("strong")).not.toBeNull();
  });

  it("「かんたんに言うと」の節は、第1条以降と区別できる別の枠(.policy-summary)に、先に出る", () => {
    mount(<PrivacyPolicyScreen next={{ name: "title" }} />);
    const summary = container.querySelector(".policy-summary")!;
    expect(summary.querySelector("h3")?.textContent).toBe("かんたんに言うと");
    const firstArticle = container.querySelector(".policy-article")!;
    expect(summary.compareDocumentPosition(firstArticle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(summary.contains(firstArticle)).toBe(false);
  });

  it("ふりがなは、かんたんに言うと・見出し・第4条と第7条の本文に付き、第2条の本文には付かない", () => {
    mount(<PrivacyPolicyScreen next={{ name: "title" }} />);
    expect(rubyOf(container.querySelector(".policy-summary"))).toEqual(expect.arrayContaining(["かいせき", "たんまつ", "ほんみょう"]));
    const article = (n: number) => [...container.querySelectorAll(".policy-article")].find((a) => a.querySelector("h3")?.textContent?.startsWith(`第${n}条`))!;
    // 見出しには、すべての条で付く
    expect(rubyOf(article(1).querySelector("h3"))).toContain("てきようはんい");
    expect(rubyOf(article(2).querySelector("h3"))).toContain("しゅとく");
    // 第4条・第7条の本文には付く
    expect(rubyOf(article(4))).toEqual(expect.arrayContaining(["すいそく", "ほんみょう"]));
    expect(rubyOf(article(7))).toEqual(expect.arrayContaining(["さくじょ", "しょきか"]));
    // 第2条の本文(段落・箇条書き・表)には付かない。小見出し(h4)は見出しなので、付く
    const body = [...article(2).children].filter((c) => !/^H[34]$/.test(c.tagName));
    expect(body.length).toBeGreaterThan(3);
    expect(rubyOf(article(2).querySelector("h4"))).toContain("たんまつ");
    for (const el of body) expect(rubyOf(el), el.textContent ?? "").toEqual([]);
  });

  it("「もどる」で、渡された画面へ戻る", () => {
    mount(<PrivacyPolicyScreen next={{ name: "settings" }} />);
    act(() => container.querySelector<HTMLButtonElement>(".back-button")!.click());
    expect(useNavigationStore.getState().screen.name).toBe("settings");
  });
});

describe("プライバシーポリシーの入口", () => {
  let container: HTMLDivElement;
  let root: Root;
  const mount = (node: React.ReactElement) => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(node));
  };
  const clickByText = (text: string) =>
    act(() => [...container.querySelectorAll("button")].find((b) => b.textContent?.trim() === text)!.click());

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("タイトル画面から開ける。もどると、タイトル画面へ戻る", () => {
    useNavigationStore.setState({ screen: { name: "title" } });
    mount(<TitleScreen />);
    clickByText("プライバシーポリシー");
    expect(useNavigationStore.getState().screen).toEqual({ name: "privacy", next: { name: "title" } });
  });

  it("設定画面から開ける。もどると、設定画面へ戻る", () => {
    useNavigationStore.setState({ screen: { name: "settings" } });
    mount(<SettingsScreen />);
    clickByText("プライバシーポリシー");
    expect(useNavigationStore.getState().screen).toEqual({ name: "privacy", next: { name: "settings" } });
  });
});
