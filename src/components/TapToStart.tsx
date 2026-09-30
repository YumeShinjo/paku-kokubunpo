import { useState } from "react";
import { unlockPlayback } from "@/lib/audio";
import { Mascot } from "@/features/mascot/Mascot";
import { splashPose } from "@/features/mascot/mood";
import { findImage, findTitleLogo, IMAGE } from "@/assets/registry";
import { useImagesReady } from "@/lib/useImagesReady";
import { useReviewStore } from "@/app/store/reviewStore";
import { hasUnseenAnnouncement, useAnnouncementStore } from "@/app/store/announcementStore";
import { useNavigationStore } from "@/app/store/navigationStore";
import { AnnouncementModal } from "@/components/AnnouncementModal";

/**
 * 起動直後、タイトル画面の前に挟む1枚の導入画面(9章)。背景・ロゴ・手を振るコトを重ね、画面のどこをタップしても始まる。
 * このタップ(クリック)の中で音声の解禁(BGMの開始を含む)を完了させてから、タイトル画面を出す。
 * これで、タイトル画面のどのボタンを最初に押しても、解禁済みであることを保証できる。
 * iOSは pointerdown / touchstart を有効なユーザー操作と認めないので、click で解禁する
 * (ボタンなので、キーボードの Enter / Space でも click になる)。
 *
 * 右上の「お知らせ」と、一番下のクレジット・プライバシーポリシーは、始まるボタンとは別のボタン。押しても、ゲームは始まらない
 * (クレジット・プライバシーポリシーだけは、音声を解禁してから、それぞれの画面へ進む)。
 * 配置は、画面の高さに対する割合(global.css の .splash-*)。星(苦手問題)が残っているときは、
 * 手を振る専用の絵ではなく、タイトル画面と同じ表情のコトを出す。
 * 雲・葉・キラキラ・コトの揺れは、飾りの動き(transform / opacity だけ。タップの邪魔をしない。動きを減らす設定では止まる)。
 */
export function TapToStart() {
  const goTo = useNavigationStore((s) => s.goTo);
  const closeSplash = useNavigationStore((s) => s.closeSplash);
  const starCount = useReviewStore((s) => s.starredQuestionIds.length);
  const seenIds = useAnnouncementStore((s) => s.seenIds);
  const markAllSeen = useAnnouncementStore((s) => s.markAllSeen);
  const [announceOpen, setAnnounceOpen] = useState(false);

  const bgUrl = findImage(IMAGE.splashBg);
  const logoUrl = findTitleLogo();
  const pose = splashPose(starCount);
  const waveUrl = pose === "wave" ? findImage(IMAGE.splashKoto) : undefined;

  const preload = [bgUrl, logoUrl, waveUrl].filter((u): u is string => u !== undefined);
  const ready = useImagesReady(preload);

  function openAnnouncements() {
    markAllSeen();
    setAnnounceOpen(true);
  }

  /** どこをタップしても始まる: 音声(BGM・タップ音)を解禁して、ホーム画面へ。戻ってきたときも、同じ */
  function start() {
    unlockPlayback();
    closeSplash();
  }

  function openCredits() {
    unlockPlayback();
    closeSplash();
    goTo({ name: "credits", next: { name: "title" } });
  }

  function openPrivacy() {
    unlockPlayback();
    closeSplash();
    goTo({ name: "privacy", next: { name: "title" } });
  }

  return (
    <div className="splash">
      <div className="splash-stage">
        <button type="button" data-no-tap className="tap-to-start" onClick={start}>
          {bgUrl && <img className="splash-bg" src={bgUrl} alt="" draggable={false} />}
          {/* 飾り: ゆっくり流れる雲 */}
          <span className="splash-sky" aria-hidden="true">
            <span className="splash-cloud splash-cloud-a" />
            <span className="splash-cloud splash-cloud-b" />
            <span className="splash-cloud splash-cloud-c" />
          </span>
          {/* 飾り: ふわふわ漂う葉とキラキラ */}
          <span className="splash-dust" aria-hidden="true">
            <span className="splash-leaf splash-leaf-a" />
            <span className="splash-leaf splash-leaf-b" />
            <span className="splash-leaf splash-leaf-c" />
            <span className="splash-sparkle splash-sparkle-a" />
            <span className="splash-sparkle splash-sparkle-b" />
            <span className="splash-sparkle splash-sparkle-c" />
            <span className="splash-sparkle splash-sparkle-d" />
          </span>
          {logoUrl ? (
            <img className="splash-logo" src={logoUrl} alt="パクっと国文法" draggable={false} />
          ) : (
            <span className="tap-to-start-name">パクっと国文法</span>
          )}
          <span className="splash-shadow" aria-hidden="true" />
          {waveUrl ? (
            <span className="splash-koto splash-koto-wave">
              <img src={waveUrl} alt="" draggable={false} />
            </span>
          ) : (
            <span className="splash-koto splash-koto-mascot">
              {/* 手を振る絵が置かれていないとき、または星が残っているときの、これまでのコト */}
              <Mascot expression={pose === "wave" ? undefined : pose} />
            </span>
          )}
          <span className="splash-bubble">
            いっしょに <br />
            ことばを あつめよう!
          </span>
          <span className={`tap-to-start-hint${ready ? " is-ready" : ""}`}>
            <span className="tap-to-start-hint-text">タッチして はじめる</span>
          </span>
        </button>

        <button type="button" className="splash-announce" onClick={openAnnouncements}>
          {hasUnseenAnnouncement(seenIds) && <span className="splash-new">NEW</span>}
          <span>お知らせ</span>
        </button>

        <div className="splash-footer">
          <span className="splash-version">v{__APP_VERSION__}</span>
          <span className="splash-dot" aria-hidden="true">
            ・
          </span>
          <button type="button" className="splash-credits" onClick={openCredits}>
            クレジット
          </button>
          <span className="splash-dot" aria-hidden="true">
            ・
          </span>
          <button type="button" className="splash-privacy" onClick={openPrivacy}>
            プライバシーポリシー
          </button>
        </div>
      </div>
      {announceOpen && <AnnouncementModal onClose={() => setAnnounceOpen(false)} />}
    </div>
  );
}
