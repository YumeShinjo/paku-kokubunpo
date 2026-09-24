import type { MascotForm } from "@/data/story/schema";
import { useMascotStore } from "@/app/store/mascotStore";
import { findImage, IMAGE, MASCOT_ACCESSORY_STAGES, type MascotExpression } from "@/assets/registry";

/**
 * マスコット表示(6章: ベース画像+アクセサリー画像のレイヤー方式)。
 * 素材(src/assets/images/mascot/)が置かれていればその画像を、なければ絵文字で仮表示する。
 *  - base + accessory-1〜N を重ねて表示(N=序章を除いてクリアしたエリア数。上限は MASCOT_ACCESSORY_STAGES=7)
 *  - true(本来の姿)は専用の1枚絵
 *
 * expression は表情の差分(喜び・しょんぼり・もぐもぐ・びっくり・眠そう)。素材(mascot/<表情>)があれば、ベースの代わりにその絵を出す
 * (なければ通常の絵のまま)。size で大きさを変える(small=アイコン程度 / large=見せ場)。
 *
 * form はストーリー演出用(2章「変身のタイミング」):
 *  - "glow": 宰相撃破の予兆として、成長姿のまま淡く光る
 *  - "true": ラスボス撃破後に取り戻す本来の姿(王女コレット)
 */
const growthEmoji = ["🥚", "🐣", "🐥", "🐤", "🐦", "🦜", "🦚", "👑"];
const TRUE_FORM_EMOJI = "👸";

export function Mascot({
  form,
  expression,
  size = "normal",
}: {
  form?: MascotForm;
  expression?: MascotExpression;
  size?: "small" | "normal" | "large";
}) {
  const growthStage = useMascotStore((s) => s.growthStage);

  const label = form === "true" ? "王女コレット" : `マスコット 成長段階${growthStage}`;
  const trueUrl = form === "true" ? findImage(IMAGE.mascotTrue) : undefined;
  const baseUrl =
    form !== "true"
      ? ((expression && findImage(IMAGE.mascotExpression(expression))) || findImage(IMAGE.mascotBase))
      : undefined;

  let body;
  if (trueUrl) {
    body = <img className="mascot-image" src={trueUrl} alt="" draggable={false} />;
  } else if (baseUrl) {
    // 成長アクセサリー7段階は、ことばの市場(1つ目)〜王座の間(7つ目)のクリアで1つずつ増える(SPEC 6章)。
    // growthStage は序章のクリアで1になるので、序章の分(1)を引く。
    const accessories = Array.from(
      { length: Math.min(Math.max(growthStage - 1, 0), MASCOT_ACCESSORY_STAGES) },
      (_, i) => findImage(IMAGE.mascotAccessory(i + 1)),
    ).filter((u): u is string => u !== undefined);
    body = (
      <span className="mascot-layers">
        <img className="mascot-image" src={baseUrl} alt="" draggable={false} />
        {accessories.map((url) => (
          <img key={url} className="mascot-image mascot-accessory" src={url} alt="" draggable={false} />
        ))}
      </span>
    );
  } else {
    const emoji =
      form === "true"
        ? TRUE_FORM_EMOJI
        : growthEmoji[Math.min(growthStage, growthEmoji.length - 1)];
    body = <span className="mascot-emoji">{emoji}</span>;
  }

  return (
    <div className={["mascot", form ? `mascot-${form}` : "", `mascot-${size}`].filter(Boolean).join(" ")} aria-label={label}>
      {body}
    </div>
  );
}

/**
 * マスコットの表情だけを、小さく出す(正誤フィードバック・結果画面・通知など)。表情の素材がなければ何も出さない
 * (絵文字の仮表示は、ここでは出さない)。アクセサリーは重ねない。
 */
export function MascotFace({ expression, size = "small" }: { expression: MascotExpression; size?: "small" | "normal" | "large" }) {
  const url = findImage(IMAGE.mascotExpression(expression));
  if (!url) return null;
  return (
    <span className={`mascot-face mascot-${size}`} aria-hidden="true">
      <img className="mascot-image" src={url} alt="" draggable={false} />
    </span>
  );
}
