import { useEffect } from "react";
import { X as CloseIcon } from "lucide-react";
import { announcements, formatAnnouncementDate } from "@/data/announcements";
import { Rb } from "@/components/Rb";

/** お知らせの一覧(モーダル)。新しいものが上。とじるボタン・背景のタップ・Escで閉じる */
export function AnnouncementModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="announce-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="announce-modal" role="dialog" aria-modal="true" aria-label="お知らせ">
        <h2 className="announce-heading">お知らせ</h2>
        <div className="announce-list">
          {announcements.map((a) => (
            <section key={a.id} className="announce-item">
              <p className="announce-date">{formatAnnouncementDate(a.date)}</p>
              <h3 className="announce-title">
                <Rb t={a.title} />
              </h3>
              <ul>
                {a.body.map((line) => (
                  <li key={line}>
                    <Rb t={line} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <button type="button" className="announce-close" onClick={onClose}>
          <CloseIcon aria-hidden="true" size={16} />
          <span>とじる</span>
        </button>
      </div>
    </div>
  );
}
