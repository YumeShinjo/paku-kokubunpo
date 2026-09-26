import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, describe, expect, it } from "vitest";
import { getAllQuestions } from "@/data/questionLoader";
import { playableAreas } from "@/data/areas";
import { getStagesForArea } from "@/data/stages";
import { storyEvents } from "@/data/story/events";
import { useProgressStore } from "@/app/store/progressStore";
import { TransferIssueScreen } from "@/app/screens/TransferIssueScreen";
import { TransferRestoreScreen } from "@/app/screens/TransferRestoreScreen";
import { decodeTransferCode, encodeTransferCode, type TransferData } from "./transferCode";
import { buildQrMatrix, matrixToImageData, matrixToPath, scanQr } from "./qr";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function fullData(): TransferData {
  const stages = playableAreas.flatMap((a) => getStagesForArea(a.id));
  const questions = getAllQuestions();
  return {
    cleared: stages.map((s) => s.id),
    score: 45230,
    growth: 7,
    seen: storyEvents.map((e) => e.id),
    choices: {},
    starred: questions.slice(0, 60).map((q) => q.id),
    recent: questions.slice(0, 20).map((q) => q.id),
    unitRecent: Object.fromEntries([...new Set(questions.map((q) => q.unit))].map((u) => [u, "1011011101"])),
    guides: ["sorting", "assembly", "choice", "tapInSentence", "zukan"],
    icon: "gold-star",
  };
}

describe("引き継ぎコードの QRコード", () => {
  it("全部を遊び終えたデータのコードも、QRコード1つに収まる。大きさ(型番)は、カメラで読める範囲", async () => {
    const code = await encodeTransferCode(fullData());
    const matrix = buildQrMatrix(code);
    expect(matrix).not.toBeNull();
    // 1辺の点の数。型番Vで 17+4V 点。型番30(137点)までなら、スマホの画面で、ふつうに読める
    expect(matrix!.length).toBeLessThanOrEqual(137);
  });

  it("QRコードに表示した内容を、読み取り(jsQR)で、そっくりコードに戻せる。そのまま復元できる", async () => {
    const data = fullData();
    const code = await encodeTransferCode(data);
    const matrix = buildQrMatrix(code)!;
    const { data: pixels, width, height } = matrixToImageData(matrix, 4);
    const scanned = await scanQr(pixels, width, height);
    expect(scanned).toBe(code);
    expect(await decodeTransferCode(scanned!)).toEqual(data);
  });

  it("読み取り側は、空白の画像や、QRでない画像を、null(読めない)にする", async () => {
    expect(await scanQr(new Uint8ClampedArray(200 * 200 * 4).fill(255), 200, 200)).toBeNull();
  });

  it("長すぎて QR にできない文字列は、null(表示しない)", () => {
    expect(buildQrMatrix("x".repeat(4000))).toBeNull();
  });

  it("SVGのパスは、黒い点の数だけの面積になる(横に続く点はまとめる)", () => {
    const matrix = [
      [true, true, false],
      [false, true, true],
    ];
    expect(matrixToPath(matrix)).toBe("M0 0h2v1h-2zM1 1h2v1h-2z");
  });
});

describe("引き継ぎの画面の QRコード", () => {
  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: ["prologue-stage1"], totalScore: 500 });
  });
  const mount = (node: React.ReactNode) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(node));
    return { container, done: () => (act(() => root.unmount()), container.remove()) };
  };
  const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 30)); });

  it("発行画面: 文字列のコードと、同じ内容の QRコードの両方が出る", async () => {
    const { container, done } = mount(<TransferIssueScreen />);
    await flush();
    expect(container.querySelector<HTMLTextAreaElement>(".transfer-code")!.value).toMatch(/^PAKU2/);
    expect(container.querySelector("svg.qr-code")).not.toBeNull();
    done();
  });

  it("復元画面: 手入力の欄とボタンは残したまま、カメラ・写真からの読み取りが選べる", () => {
    const { container, done } = mount(<TransferRestoreScreen />);
    const labels = [...container.querySelectorAll("button, label")].map((e) => e.textContent);
    expect(container.querySelector("textarea")).not.toBeNull();
    expect(labels.some((t) => t?.includes("コードを よみとる"))).toBe(true);
    expect(labels.some((t) => t?.includes("カメラで QRコード"))).toBe(true);
    expect(labels.some((t) => t?.includes("写真から"))).toBe(true);
    done();
  });

  it("復元画面: カメラが許可されない・使えないときは、わかりやすく伝えて、手入力に戻れる", async () => {
    const original = navigator.mediaDevices;
    const camera = (impl: unknown) => Object.defineProperty(navigator, "mediaDevices", { value: impl, configurable: true });
    const open = async () => {
      const view = mount(<TransferRestoreScreen />);
      await act(async () => {
        [...view.container.querySelectorAll("button")].find((b) => b.textContent?.includes("カメラで"))!.click();
      });
      await flush();
      return view;
    };

    camera({ getUserMedia: () => Promise.reject(Object.assign(new Error("no"), { name: "NotAllowedError" })) });
    let view = await open();
    expect(view.container.querySelector(".transfer-error")?.textContent).toContain("許可");
    expect(view.container.querySelector("textarea")).not.toBeNull();
    view.done();

    camera(undefined);
    view = await open();
    expect(view.container.querySelector(".transfer-error")?.textContent).toContain("カメラが使えない");
    view.done();

    Object.defineProperty(navigator, "mediaDevices", { value: original, configurable: true });
  });
});
