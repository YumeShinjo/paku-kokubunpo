import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/safeStorage";
import { announcements, type Announcement } from "@/data/announcements";

/**
 * お知らせを見たかどうかの記録(端末ローカル)。見ていないお知らせがあるあいだ、バージョン表記の近くに「NEW」を出す。
 */
interface AnnouncementState {
  seenIds: string[];
  /** いま出ているお知らせを、すべて見たことにする(お知らせの画面を開いたとき) */
  markAllSeen: () => void;
}

export function hasUnseenAnnouncement(seenIds: readonly string[], list: readonly Announcement[] = announcements): boolean {
  return list.some((a) => !seenIds.includes(a.id));
}

export const useAnnouncementStore = create<AnnouncementState>()(
  persist(
    (set) => ({
      seenIds: [],
      markAllSeen: () => set({ seenIds: announcements.map((a) => a.id) }),
    }),
    { name: "paku-kokubunpo:announcements", storage: safeJSONStorage },
  ),
);
