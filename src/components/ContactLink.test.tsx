import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useNavigationStore } from "@/app/store/navigationStore";
import { PrivacyPolicyScreen } from "@/app/screens/PrivacyPolicyScreen";
import { SettingsScreen } from "@/app/screens/SettingsScreen";
import { TitleScreen } from "@/app/screens/TitleScreen";
import { CONTACT_FORM_URL, ContactLink } from "./ContactLink";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const css = readFileSync("src/styles/global.css", "utf-8");

describe("お問い合わせのリンク", () => {
  let container: HTMLDivElement;
  let root: Root;
  const mount = (node: React.ReactElement) => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(node));
  };
  const links = (selector = "a.contact-link") => [...container.querySelectorAll<HTMLAnchorElement>(selector)];

  beforeEach(() => {
    window.scrollTo = () => {};
    useNavigationStore.setState({ screen: { name: "settings" }, splashOpen: false });
  });

  afterEach(() => {
    if (root) act(() => root.unmount());
    container?.remove();
    root = undefined as unknown as Root;
  });

  it("フォームのURLは、プライバシーポリシー第10条に書いたものと同じ", () => {
    expect(CONTACT_FORM_URL).toBe("https://forms.gle/dtyC4R6VM1JJMpEs9");
    expect(readFileSync("docs/PRIVACY_POLICY.md", "utf-8")).toContain(CONTACT_FORM_URL);
  });

  it("外部のブラウザ(別のタブ)で開く: target=_blank・rel=noopener noreferrer。絵文字はなく、アイコン(svg)がある", () => {
    mount(<ContactLink />);
    const [a] = links();
    expect(a.getAttribute("href")).toBe(CONTACT_FORM_URL);
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    expect(a.textContent).toContain("お問い合わせ");
    expect(a.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
    expect(a.querySelector(".visually-hidden")!.textContent).toContain("新しいタブ");
  });

  it("タップできる高さは44px以上(CSS)", () => {
    const start = css.indexOf("\n.contact-link {");
    const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
    expect(Number(body.match(/min-height: ([\d.]+)rem/)![1])).toBeGreaterThanOrEqual(2.75);
  });

  it("せってい画面にある", () => {
    mount(<SettingsScreen />);
    expect(links()).toHaveLength(1);
    expect(links()[0].href).toBe(CONTACT_FORM_URL);
  });

  it("プライバシーポリシー画面にある(ボタンと、第10条の中のURLのリンク)。どちらも、別のタブで開く", () => {
    mount(<PrivacyPolicyScreen next={{ name: "title" }} />);
    expect(links()).toHaveLength(1);
    const policyLinks = links("a.policy-link");
    expect(policyLinks).toHaveLength(1);
    expect(policyLinks[0].getAttribute("href")).toBe(CONTACT_FORM_URL);
    expect(policyLinks[0].getAttribute("target")).toBe("_blank");
    expect(policyLinks[0].getAttribute("rel")).toBe("noopener noreferrer");
    // 第10条の中に、URLの文字が出る
    const tenth = [...container.querySelectorAll(".policy-article")].find((s) => s.querySelector("h3")?.textContent?.startsWith("第10条"))!;
    expect(tenth.textContent).toContain(CONTACT_FORM_URL);
    expect(tenth.textContent).not.toContain("準備中");
  });

  it("ホーム画面のフッターには、増やしていない(クレジットとプライバシーポリシーだけ。お問い合わせのリンクもない)", () => {
    mount(<TitleScreen />);
    expect([...container.querySelectorAll(".title-footer button")].map((b) => b.textContent?.trim())).toEqual(["クレジット", "プライバシーポリシー"]);
    expect(links()).toHaveLength(0);
    expect(container.textContent).not.toContain("お問い合わせ");
  });
});
