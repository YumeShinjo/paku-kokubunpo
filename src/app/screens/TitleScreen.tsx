import { useNavigationStore } from "@/app/store/navigationStore";
import { unlockPlayback } from "@/lib/audio";
import { Mascot } from "@/features/mascot/Mascot";
import { ScreenBackground } from "@/components/ScreenBackground";
import { findImage, IMAGE } from "@/assets/registry";
import { TitleBadge } from "@/components/TitleBadge";
import { HungryBadge } from "@/components/HungryBadge";
import { useReviewStore } from "@/app/store/reviewStore";
import { titleExpression } from "@/features/mascot/mood";
import { getEndingTitle } from "@/data/titles";
import { useStoryStore } from "@/app/store/storyStore";
import { Rb } from "@/components/Rb";

/**
 * タイトル画面。9章のモバイル音声自動再生制約対応として、
 * ここでの最初のタップで unlockPlayback() を呼び、以降BGM/SEの再生を解禁する。
 * (App.tsx にも取りこぼし防止の全画面共通リスナーがあるが、
 *  タイトル画面のボタンはユーザーが最初に触る要素として最も確実なので明示的に呼ぶ)
 */
export function TitleScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const title = getEndingTitle(useStoryStore((s) => s.choices));
  const logoUrl = findImage(IMAGE.titleLogo);
  const starCount = useReviewStore((s) => s.starredQuestionIds.length); // 星の問題がたくさん(5問以上)残っているときだけ眠そう

  function handleStart() {
    unlockPlayback();
    goTo({ name: "areaSelect" });
  }

  function handleSettings() {
    unlockPlayback();
    goTo({ name: "settings" });
  }

  return (
    <div className="screen screen-title">
      <ScreenBackground name="title" soft={false} />
      <h1>
        {logoUrl ? (
          <img className="title-logo" src={logoUrl} alt="パクっと国文法" draggable={false} />
        ) : (
          <Rb t="パクっと国文法[こくぶんぽう]" />
        )}
      </h1>
      <Mascot size="large" expression={titleExpression(starCount)} />
      <HungryBadge />
      {title && (
        <p className="title-owned">
          <TitleBadge title={title} />
        </p>
      )}
      <button type="button" onClick={handleStart}>
        <Rb t="始[はじ]める" />
      </button>
      <button
        type="button"
        onClick={() => {
          unlockPlayback();
          goTo({ name: "zukan" });
        }}
      >
        <Rb t="ことだまの書[しょ]" />
      </button>
      <button type="button" onClick={() => goTo({ name: "ranking" })}>
        ランキング
      </button>
      <button type="button" onClick={handleSettings}>
        <Rb t="設定[せってい]" />
      </button>
      <button type="button" onClick={() => goTo({ name: "credits", next: { name: "title" } })}>
        クレジット
      </button>
    </div>
  );
}
