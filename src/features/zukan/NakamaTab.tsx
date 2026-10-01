import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserRound, Users, X as CloseIcon } from "lucide-react";
import { findImage } from "@/assets/registry";
import { Rb } from "@/components/Rb";
import { hasEnteredForest, useKotonohaStore } from "@/app/store/kotonohaStore";
import { useStoryStore } from "@/app/store/storyStore";
import {
  resolveCharacters,
  nakamaRuby,
  type CharacterVersion,
  type ResolvedCharacter,
  type UnlockState,
} from "@/data/zukanCharacters";

/** 立ち絵。素材がなければ、人影のアイコン。silhouette は、解放前の黒い影(読み上げない) */
function Portrait({ image, silhouette = false, className = "" }: { image?: string; silhouette?: boolean; className?: string }) {
  const url = image ? findImage(image) : undefined;
  const classes = ["nakama-portrait", silhouette ? "is-silhouette" : "", className].filter(Boolean).join(" ");
  return (
    <span className={classes} aria-hidden="true">
      {url ? <img src={url} alt="" draggable={false} loading="lazy" /> : <UserRound size={36} />}
    </span>
  );
}

/** 見出し「名前(注記)」 */
function Heading({ version, id }: { version: CharacterVersion; id?: string }) {
  return (
    <h3 className="nakama-name" id={id}>
      <Rb t={nakamaRuby(version.name)} />
      {version.nameNote && (
        <span className="nakama-name-note">
          (<Rb t={nakamaRuby(version.nameNote)} />)
        </span>
      )}
    </h3>
  );
}

/** 詳細(モーダル)。立ち絵・見出し・名前の由来・役職と持ち場・ひとこと・メモ・ことばの ひとくち */
function NakamaDetail({ character, onClose }: { character: ResolvedCharacter; onClose: () => void }) {
  const version = character.version!;
  const [showBefore, setShowBefore] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasBefore = version.imageBefore !== undefined;
  const image = hasBefore && showBefore ? version.imageBefore : version.image;
  const place = [version.role, version.place].filter(Boolean).join(" / ");
  const titleId = `nakama-detail-${character.slot.id}`;

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="nakama-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="nakama-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="nakama-modal-body">
          <Portrait image={image} className="nakama-portrait-large" />
          {hasBefore && (
            <div className="nakama-view-switch" role="group" aria-label="立ち絵の すがた">
              <button type="button" aria-pressed={!showBefore} onClick={() => setShowBefore(false)}>
                <Rb t="浄化[じょうか]後" />
              </button>
              <button type="button" aria-pressed={showBefore} onClick={() => setShowBefore(true)}>
                <Rb t="浄化[じょうか]前" />
              </button>
            </div>
          )}
          <Heading version={version} id={titleId} />
          <dl className="nakama-facts">
            {version.origin && (
              <div>
                <dt>名前の由来</dt>
                <dd>
                  <Rb t={nakamaRuby(version.origin)} />
                </dd>
              </div>
            )}
            {place && (
              <div>
                <dt>役職・持ち場</dt>
                <dd>
                  <Rb t={nakamaRuby(place)} />
                </dd>
              </div>
            )}
          </dl>
          <section className="nakama-section" aria-label="ひとこと">
            <p className="nakama-label">ひとこと</p>
            <p className="nakama-bubble">
              <Rb t={nakamaRuby(version.hitokoto)} />
            </p>
          </section>
          <section className="nakama-section" aria-label={`${version.memoBy}のメモ`}>
            <p className="nakama-label">{version.memoBy}のメモ</p>
            <div className="nakama-memo">
              {version.memo.map((paragraph) => (
                <p key={paragraph}>
                  <Rb t={nakamaRuby(paragraph)} />
                </p>
              ))}
            </div>
          </section>
          {version.hitokuchi && (
            <section className="nakama-section" aria-label="ことばの ひとくち">
              <p className="nakama-label">ことばの ひとくち</p>
              <p className="nakama-hitokuchi">
                <Rb t={nakamaRuby(version.hitokuchi)} />
              </p>
            </section>
          )}
        </div>
        <button type="button" className="nakama-close" ref={closeRef} onClick={onClose}>
          <CloseIcon aria-hidden="true" size={16} />
          <span>とじる</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * ことだまの書の「なかまの ずかん」タブ。出会ったなかまの立ち絵を並べた一覧(タップで詳細)。
 * 出会っていないなかまは、黒い影と「？？？」。王様の枠は、解放されるまで、存在ごと出さない(総数にも数えない)。
 * 解放の判定は、見たストーリーの記録(storyStore)と、言の葉の森への入場(kotonohaStore)。
 */
export function NakamaTab() {
  const seenStoryIds = useStoryStore((s) => s.seenStoryIds);
  const enteredForest = useKotonohaStore(hasEnteredForest);
  const [openId, setOpenId] = useState<string | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const state: UnlockState = { hasSeen: (id) => seenStoryIds.includes(id), enteredForest };
  const characters = resolveCharacters(state);
  const count = characters.filter((c) => c.version).length;
  const open = characters.find((c) => c.slot.id === openId && c.version);

  function close() {
    setOpenId(null);
    openerRef.current?.focus();
  }

  return (
    <div className="nakama-tab">
      <p className="nakama-count" aria-label={`であった なかま ${count} / ${characters.length}`}>
        <Users aria-hidden="true" size={18} className="inline-icon" />
        <span>
          {count} / {characters.length}
        </span>
      </p>
      <ul className="nakama-grid">
        {characters.map((c) =>
          c.version ? (
            <li key={c.slot.id}>
              <button
                type="button"
                className="nakama-card"
                aria-label={c.version.name}
                onClick={(e) => {
                  openerRef.current = e.currentTarget;
                  setOpenId(c.slot.id);
                }}
              >
                <Portrait image={c.version.image} />
                <span className="nakama-card-name" aria-hidden="true">
                  {c.version.name}
                </span>
              </button>
            </li>
          ) : (
            <li key={c.slot.id} className="nakama-card is-locked" aria-label="まだ であっていない なかま">
              <Portrait image={c.slot.silhouette} silhouette />
              <span className="nakama-card-name" aria-hidden="true">
                ？？？
              </span>
            </li>
          ),
        )}
      </ul>
      {open && <NakamaDetail character={open} onClose={close} />}
    </div>
  );
}
