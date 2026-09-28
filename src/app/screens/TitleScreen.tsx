import { BookOpen, Info, Settings, Trophy } from "lucide-react";
import { useNavigationStore } from "@/app/store/navigationStore";
import { unlockPlayback } from "@/lib/audio";
import { Mascot } from "@/features/mascot/Mascot";
import { ScreenBackground } from "@/components/ScreenBackground";
import { findImage, IMAGE } from "@/assets/registry";
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
      {/* ロゴ+マスコットを、ひとかたまりの「顔」として見せる */}
      <div className="title-hero">
        <h1>
          {logoUrl ? (
            <img className="title-logo" src={logoUrl} alt="パクっと国文法" draggable={false} />
          ) : (
            "パクっと国文法"
          )}
        </h1>
        <Mascot size="large" expression={titleExpression(starCount)} />
      </div>
      {/* 状態表示(バッジ・称号・進捗)をひとまとめにする。バッジが出たり消えたりしても、
          下の「はじめる」ボタンがズレないよう、場所をあらかじめ確保しておく */}
      <div className="title-status">
        <div className="hungry-badge-slot">
          <HungryBadge />
        </div>
        <p className="title-owned">{title && <TitleBadge title={title} />}</p>
        <MasteryProgress className="title-mastery" />
      </div>
      {/* いちばん大きい主役のボタン。ほかより縦幅が大きく、やや濃いミントで、優先アクションだと分かるようにする */}
      <button type="button" className="title-primary" onClick={handleStart}>
        はじめる
      </button>
      {/* サブ機能は、ひと回り小さく、2×2のグリッドにまとめる */}
      <div className="title-sub-buttons">
        <button
          type="button"
          onClick={() => {
            unlockPlayback();
            goTo({ name: "zukan" });
          }}
        >
          <BookOpen aria-hidden="true" size={18} />
          ことだまの書
        </button>
        <button type="button" onClick={() => goTo({ name: "ranking" })}>
          <Trophy aria-hidden="true" size={18} />
          ランキング
        </button>
        <button type="button" onClick={handleSettings}>
          <Settings aria-hidden="true" size={18} />
          せってい
        </button>
        <button type="button" onClick={() => goTo({ name: "credits", next: { name: "title" } })}>
          <Info aria-hidden="true" size={18} />
          クレジット
        </button>
      </div>
    </div>
  );
}
