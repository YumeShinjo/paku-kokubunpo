import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { areas } from "@/data/areas";
import { subBossTitleText } from "@/data/areaText";
import { bossHpMax } from "./bossRules";
import { BossEncounter } from "./BossEncounter";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("小ボス戦の始まりの画面", () => {
  it("「○○が あらわれた!」+ボス名+HPゲージ(満タン)を出し、「たたかう」で出題へ進む", () => {
    const area = areas.find((a) => a.id === "sugatakaeNoKajiba")!;
    const onStart = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const hpMax = bossHpMax(15);
    act(() =>
      root.render(
        <BossEncounter
          areaId={area.id}
          bossName={area.subBossName!}
          label="小ボス"
          title={subBossTitleText(area)}
          hpMax={hpMax}
          onStart={onStart}
        />,
      ),
    );
    expect(container.querySelector(".boss-encounter-message")?.textContent).toContain("レル");
    expect(container.querySelector(".boss-encounter-message")?.textContent).toContain("現");
    expect(container.querySelector(".boss-name")?.textContent).toContain("鍛冶");
    expect(container.querySelector(".hp-text")?.textContent).toBe(`HP ${hpMax} / ${hpMax}`);
    expect(container.querySelector<HTMLElement>(".hp-fill")?.style.width).toBe("100%");
    expect(onStart).not.toHaveBeenCalled();
    act(() => container.querySelector<HTMLButtonElement>("button")!.click());
    expect(onStart).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
    container.remove();
  });

  it("小ボスの出題数15問のとき、倒すには9問の正解が必要(HPは9)", () => {
    expect(bossHpMax(15)).toBe(9);
  });
});
