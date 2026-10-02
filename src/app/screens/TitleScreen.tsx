import { useEffect, useState } from "react";
import { BookOpen, Footprints, House, Settings, Trophy } from "lucide-react";
import { useNavigationStore } from "@/app/store/navigationStore";
import { unlockPlayback } from "@/lib/audio";
import { Mascot } from "@/features/mascot/Mascot";
import { ScreenBackground } from "@/components/ScreenBackground";
import { findImage, IMAGE } from "@/assets/registry";
import { TitleBadge } from "@/components/TitleBadge";
import { HungryBadge } from "@/components/HungryBadge";
import { ForestEntry } from "@/features/kotonoha/ForestEntry";
import { MasteryProgress } from "@/components/MasteryProgress";
import { useReviewStore } from "@/app/store/reviewStore";
import { Rb } from "@/components/Rb";
import { homeLineText, nextTapLine, statusLine, type HomeLine } from "@/data/homeLines";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { useProgressStore } from "@/app/store/progressStore";
import { KOTONOHA_UNLOCK_AREA_ID } from "@/features/kotonoha/unlock";
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
  const leafCount = useKotonohaStore((s) => s.collectedIds.length);

  // コトの吹き出し。開いたときは、状況の一言(上から順に判定)。コトをタップすると、別の一言に替わる(直前と同じものは出さない)。
  // 時間では消さず、元に戻すタイマーもない(次にタップするか、ホームを開き直すまで、そのまま)
  const [line, setLine] = useState<HomeLine>(() =>
    statusLine({
      starCount: useReviewStore.getState().starredQuestionIds.length,
      prologueCleared: useProgressStore.getState().isAreaCleared(KOTONOHA_UNLOCK_AREA_ID),
      forestUnlocked: useProgressStore.getState().isAreaCleared(KOTONOHA_UNLOCK_AREA_ID),
      leafCount: useKotonohaStore.getState().collectedIds.length,
    }),
  );

  // 吹き出しで使う表情の画像を、ホームを開いたときに、一度だけ先に読み込む(タップで替わるときの、遅れ・ちらつきを防ぐ)
  useEffect(() => {
    for (const expression of ["combo", "hungry", "sleepy"] as const) {
      const url = findImage(IMAGE.mascotExpression(expression));
      if (url) new Image().src = url;
    }
  }, []);

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
      {/* 右上: せってい(歯車)。音量ボタン(右上の端)の左に並ぶ */}
      <button type="button" className="title-settings" aria-label="せってい" onClick={handleSettings}>
        <Settings aria-hidden="true" size={22} />
      </button>
      {/* 画面の名前(見えない見出し)。ロゴは、最初の「タッチして はじめる」画面にあるので、ここには出さない */}
      <h1 className="visually-hidden">パクっと国文法</h1>
      {/* コトと吹き出し。吹き出しは、コトの頭の上。コトの絵全体が、タップできる(別の一言に替わる)。コトの後ろに光の輪、足元に影(どちらも静止した飾り) */}
      <div className="title-hero">
        <div className="title-bubble" role="status">
          <p key={line.id} className="title-bubble-text">
            {/* 句読点(。、?!)のところで折り返す(単語の途中で、折り返さない)。1つの区切りは、ひとかたまり */}
            {homeLineText(line, leafCount)
              .split(/(?<=[。、?!])/)
              .map((part, i) => (
                <span key={i} className="title-bubble-part">
                  <Rb t={part} />
                </span>
              ))}
          </p>
        </div>
        <div className="title-koto">
          <div className="title-koto-stage">
            <span className="title-koto-glow" aria-hidden="true" />
            <span className="title-koto-shadow" aria-hidden="true" />
            <Mascot size="large" expression={line.expression} />
            <button
              type="button"
              className="title-koto-tap"
              aria-label="コトに話しかける"
              onClick={() => setLine((current) => nextTapLine(current.id))}
            />
          </div>
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
      {/* 言の葉の森(ことわざ・故事成語のミニゲーム)への入口。序章をクリアするまでは、鍵つきで遊べる条件を出す */}
      <ForestEntry />
      {/* サブ機能(ことだまの書・ランキング)は、ひと回り小さく、2つ並べる。左に、色つきの丸いバッジ(アイコンの土台) */}
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
      </div>
      {/* フッター: クレジットとプライバシーポリシー。最初の画面のフッターと同じ形(小さい文字で、中央に1行) */}
      <div className="title-footer">
        <button type="button" className="title-credits" onClick={() => goTo({ name: "credits", next: { name: "title" } })}>
          クレジット
        </button>
        <span className="title-footer-dot" aria-hidden="true">
          ・
        </span>
        <button type="button" className="title-privacy" onClick={() => goTo({ name: "privacy", next: { name: "title" } })}>
          プライバシーポリシー
        </button>
      </div>
    </div>
  );
}
