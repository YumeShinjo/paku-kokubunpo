import { useState } from "react";
import { unlockPlayback } from "@/lib/audio";
import { Mascot } from "@/features/mascot/Mascot";
import { splashPose } from "@/features/mascot/mood";
import { findImage, IMAGE } from "@/assets/registry";
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
 * 画面の一番下のバージョン表記(お知らせを開く)とクレジットは、始まるボタンとは別のボタン。押しても、ゲームは始まらない
 * (クレジットだけは、音声を解禁してから、クレジット画面へ進む)。
 * 配置は、画面の高さに対する割合(global.css の .splash-*)。星(苦手問題)が残っているときは、
 * 手を振る専用の絵ではなく、タイトル画面と同じ表情のコトを出す。
 */
export function TapToStart() {
  const goTo = useNavigationStore((s) => s.goTo);
  const starCount = useReviewStore((s) => s.starredQuestionIds.length);
  const seenIds = useAnnouncementStore((s) => s.seenIds);
  const markAllSeen = useAnnouncementStore((s) => s.markAllSeen);
  const [announceOpen, setAnnounceOpen] = useState(false);

  const bgUrl = findImage(IMAGE.splashBg);
  const logoUrl = findImage(IMAGE.splashLogo) ?? findImage(IMAGE.splashLogoHyphen) ?? findImage(IMAGE.titleLogo);
  const pose = splashPose(starCount);
  const waveUrl = pose === "wave" ? findImage(IMAGE.splashKoto) : undefined;

  const preload = [bgUrl, logoUrl, waveUrl].filter((u): u is string => u !== undefined);
  const ready = useImagesReady(preload);

  function openAnnouncements() {
    markAllSeen();
    setAnnounceOpen(true);
  }

  function openCredits() {
    unlockPlayback();
    goTo({ name: "credits", next: { name: "title" } });
  }

  return (
    <div className="splash">
      <div className="splash-stage">
        <button type="button" data-no-tap className="tap-to-start" onClick={unlockPlayback}>
          {bgUrl && <img className="splash-bg" src={bgUrl} alt="" draggable={false} />}
          {logoUrl ? (
            <img className="splash-logo" src={logoUrl} alt="パクっと国文法" draggable={false} />
          ) : (
            <span className="tap-to-start-name">パクっと国文法</span>
          )}
          <span className="splash-shadow" aria-hidden="true" />
          {waveUrl ? (
            <img className="splash-koto splash-koto-wave" src={waveUrl} alt="" draggable={false} />
          ) : (
            <span className="splash-koto splash-koto-mascot">
              {/* 手を振る絵が置かれていないとき、または星が残っているときの、これまでのコト */}
              <Mascot expression={pose === "wave" ? undefined : pose} />
            </span>
          )}
          <span className={`tap-to-start-hint${ready ? " is-ready" : ""}`}>タッチして はじめる</span>
        </button>

        <div className="splash-footer">
          <button type="button" className="splash-version" onClick={openAnnouncements}>
            <span>v{__APP_VERSION__}</span>
            {hasUnseenAnnouncement(seenIds) && <span className="splash-new">NEW</span>}
            <span className="splash-footer-label">お知らせ</span>
          </button>
          <button type="button" className="splash-credits" onClick={openCredits}>
            クレジット
          </button>
        </div>
      </div>
      {announceOpen && <AnnouncementModal onClose={() => setAnnounceOpen(false)} />}
    </div>
  );
}
