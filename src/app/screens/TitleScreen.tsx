import { BookOpen, Footprints, House, Info, Settings, Trophy } from "lucide-react";
import { useNavigationStore } from "@/app/store/navigationStore";
import { unlockPlayback } from "@/lib/audio";
import { Mascot } from "@/features/mascot/Mascot";
import { ScreenBackground } from "@/components/ScreenBackground";
import { findImage, findTitleLogo, IMAGE } from "@/assets/registry";
import { TitleBadge } from "@/components/TitleBadge";
import { HungryBadge } from "@/components/HungryBadge";
import { MasteryProgress } from "@/components/MasteryProgress";
import { useReviewStore } from "@/app/store/reviewStore";
import { titleExpression } from "@/features/mascot/mood";
import { getEndingTitle } from "@/data/titles";
import { useStoryStore } from "@/app/store/storyStore";

/**
 * タイトル画面。9章のモバイル音声自動再生制約対応として、
 * ここでの最初のタップで unlockPlayback() を呼び、以降BGM/SEの再生を解禁する。
 * (App.tsx にも取りこぼし防止の全画面共通リスナーがあるが、
 *  タイトル画面のボタンはユーザーが最初に触る要素として最も確実なので明示的に呼ぶ)
 */
export function TitleScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const openSplash = useNavigationStore((s) => s.openSplash);
  const bgUrl = findImage(IMAGE.splashBg); // 最初の画面の背景を、ぼかして薄く敷く
  const title = getEndingTitle(useStoryStore((s) => s.choices));
  const logoUrl = findTitleLogo(); // 最初の画面と同じ、縁取り付きのロゴ
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
      {bgUrl && <img className="title-bg" src={bgUrl} alt="" draggable={false} />}
      {/* 左上: 最初の「タッチして はじめる」画面へ戻る */}
      <button type="button" className="title-back" aria-label="タイトルへもどる" onClick={openSplash}>
        <House aria-hidden="true" size={22} />
      </button>
      {/* ロゴ+マスコットを、ひとかたまりの「顔」として見せる。コトの後ろに光の輪、足元に影(どちらも静止した飾り) */}
      <div className="title-hero">
        <h1>
          {logoUrl ? (
            <img className="title-logo" src={logoUrl} alt="パクっと国文法" draggable={false} />
          ) : (
            "パクっと国文法"
          )}
        </h1>
        <div className="title-koto">
          <span className="title-koto-glow" aria-hidden="true" />
          <span className="title-koto-shadow" aria-hidden="true" />
          <Mascot size="large" expression={titleExpression(starCount)} />
        </div>
      </div>
      {/* 状態表示(バッジ・称号・進捗)をひとまとめにする。バッジが出たり消えたりしても、
          下の「はじめる」ボタンがズレないよう、バッジの場所はあらかじめ確保しておく。
          称号・進捗バー・正解数は、ひとつのカードにまとめる */}
      <div className="title-status">
        <div className="hungry-badge-slot">
          <HungryBadge />
        </div>
        <div className="title-card">
          {title && (
            <p className="title-owned">
              <TitleBadge title={title} />
            </p>
          )}
          <MasteryProgress className="title-mastery" />
        </div>
      </div>
      {/* いちばん大きい主役のボタン。立体的な厚みがあり、押している間は厚みの分だけ沈む */}
      <button type="button" className="title-primary" onClick={handleStart}>
        <Footprints aria-hidden="true" size={26} />
        <span>はじめる</span>
      </button>
      {/* サブ機能は、ひと回り小さく、2×2のグリッドにまとめる。左に、色つきの丸いバッジ(アイコンの土台) */}
      <div className="title-sub-buttons">
        <button
          type="button"
          className="sub-book"
          onClick={() => {
            unlockPlayback();
            goTo({ name: "zukan" });
          }}
        >
          <span className="sub-badge">
            <BookOpen aria-hidden="true" size={17} />
          </span>
          ことだまの書
        </button>
        <button type="button" className="sub-rank" onClick={() => goTo({ name: "ranking" })}>
          <span className="sub-badge">
            <Trophy aria-hidden="true" size={17} />
          </span>
          ランキング
        </button>
        <button type="button" className="sub-settings" onClick={handleSettings}>
          <span className="sub-badge">
            <Settings aria-hidden="true" size={17} />
          </span>
          せってい
        </button>
        <button type="button" className="sub-credits" onClick={() => goTo({ name: "credits", next: { name: "title" } })}>
          <span className="sub-badge">
            <Info aria-hidden="true" size={17} />
          </span>
          クレジット
        </button>
      </div>
      <button type="button" className="title-privacy" onClick={() => goTo({ name: "privacy", next: { name: "title" } })}>
        プライバシーポリシー
      </button>
    </div>
  );
}
