import { Volume2, VolumeX } from "lucide-react";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useNavigationStore } from "@/app/store/navigationStore";

/**
 * ミュートの固定アイコン(7章: ミュートへの導線は、画面端の固定アイコンなど常に分かりやすい場所に置く)。
 * 基本は画面の右下(ホーム画面だけ右上、会話シーンは左上)に常に表示する。タップでミュート/解除を切り替える(設定画面のミュートと同じ設定)。
 * 押した音が鳴らないよう data-no-tap を付けている。
 */
export function MuteButton() {
  const muted = useSettingsStore((s) => s.muted);
  const setMuted = useSettingsStore((s) => s.setMuted);
  // 会話シーンでは、送りの合図・テキストボックスのある下側から離して、左上に置く(操作の位置を役割ごとに分ける)
  const inStory = useNavigationStore((s) => s.screen.name === "story");
  // ホーム画面は、左上の戻るボタンと左右対称になるよう、右上に置く。言の葉の森(入口・出題)も、
  // 画面の下に「つぎへ」などの固定のボタンが来るので、ホーム画面と同じ、右上に置く
  const onHome = useNavigationStore((s) => ["title", "kotonoha", "kotonohaPlay"].includes(s.screen.name));
  return (
    <button
      type="button"
      data-no-tap
      className={`mute-button ${muted ? "is-muted" : ""} ${inStory ? "in-story" : ""} ${onHome ? "on-home" : ""}`
        .replace(/\s+/g, " ")
        .trim()}
      aria-pressed={muted}
      aria-label={muted ? "ミュートを解除する" : "音をミュートする"}
      onClick={() => setMuted(!muted)}
    >
      {muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
    </button>
  );
}
