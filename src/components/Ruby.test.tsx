import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { HungryBadge } from "./HungryBadge";
import { Ruby } from "./Ruby";
import { useReviewStore } from "@/app/store/reviewStore";
import { rb } from "@/data/ruby";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("ふりがな付きテキストの折り返し", () => {
  it("全体が1つの要素(.ruby-text)にまとまる。親がflexでも、語ごとに別の行・別のマスにならない", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    // 親が縦並びの flex(バッジなど)のとき、直接の子が1つだけなら、1語ごとに改行されない
    act(() =>
      root.render(
        <div style={{ display: "flex", flexDirection: "column" }} id="flex">
          <Ruby text={rb("コトがお腹[なか]をすかせているよ!(苦手[にがて]問題[もんだい] 3問[もん])")} />
        </div>,
      ),
    );
    const flex = container.querySelector("#flex")!;
    expect(flex.children).toHaveLength(1);
    expect(flex.children[0].classList.contains("ruby-text")).toBe(true);
    expect(flex.textContent).toContain("コトがお腹なかをすかせているよ!");
    // ふりがな付きの語(ruby)と前後の文字は、同じ要素の中に、順番どおりに入っている
    expect(flex.children[0].querySelectorAll("ruby")).toHaveLength(4);
    act(() => root.unmount());
    container.remove();
  });

  it("縦並びのバッジ(ホーム画面の「おなかをすかせている」)は、本文が1つの塊で、追加の行は注釈(small)だけ", () => {
    useReviewStore.setState({ starredQuestionIds: ["a", "b"] });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<HungryBadge />));
    const badge = container.querySelector(".hungry-badge")!;
    expect(badge.children).toHaveLength(2); // 本文の塊 + small
    expect(badge.children[0].classList.contains("ruby-text")).toBe(true);
    act(() => root.unmount());
    container.remove();
    useReviewStore.setState({ starredQuestionIds: [] });
  });
});
