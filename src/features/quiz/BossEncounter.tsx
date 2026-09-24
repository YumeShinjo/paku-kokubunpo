import { BossPortrait } from "./BossPortrait";
import { Rb } from "@/components/Rb";

/**
 * 小ボス戦の始まりの画面(バトル開始の様式): 「○○が 現[あらわ]れた!」+ 立ち絵 + HPゲージ(満タン)。
 * ストーリーの「取り憑かれた混乱した台詞」のあと、出題(戦闘)の直前に出す。「たたかう」で出題へ進む。
 */
export function BossEncounter({
  areaId,
  bossName,
  label,
  title,
  hpMax,
  onStart,
}: {
  areaId: string;
  bossName: string;
  /** 例: 「小ボス」 */
  label: string;
  /** 例: 「鍛冶見習い・レル」 */
  title: string;
  hpMax: number;
  onStart: () => void;
}) {
  return (
    <div className="screen screen-boss-encounter">
      <div className="boss-panel boss-encounter-panel">
        <BossPortrait type="subBoss" areaId={areaId} />
        <p className="boss-encounter-message" role="status">
          {bossName}が <Rb t="現[あらわ]れた!" />
        </p>
        <p className="boss-name">
          <Rb t={`${label}: ${title}`} />
        </p>
        <div
          className="hp-gauge"
          role="progressbar"
          aria-label="ボスのHP"
          aria-valuemin={0}
          aria-valuemax={hpMax}
          aria-valuenow={hpMax}
        >
          <div className="hp-fill" style={{ width: "100%" }} />
        </div>
        <p className="hp-text">
          HP {hpMax} / {hpMax}
        </p>
      </div>
      <button type="button" onClick={onStart}>
        <Rb t="戦[たたか]う" />
      </button>
    </div>
  );
}
