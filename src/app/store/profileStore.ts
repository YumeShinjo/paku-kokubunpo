import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/safeStorage";
import { DEFAULT_ICON_ID, isPlayerIconId } from "@/data/playerIcons";

/**
 * 主人公のプロフィール(2章): 選んだアイコン。端末ローカルに保存する(アカウント不要)。
 * 名前は専用の設定を持たず、ランキングのニックネーム(rankingStore)をそのまま呼び名として使う。
 * ランキングに参加中なら、アイコンは順位表にも表示される(scoreSync が変更を送る)。
 */
interface ProfileState {
  iconId: string;
  setIcon: (iconId: string) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      iconId: DEFAULT_ICON_ID,
      // 一覧にない id は受け付けない(壊れた保存内容・古い版の値で、知らない id を送らないため)
      setIcon: (iconId) => set(isPlayerIconId(iconId) ? { iconId } : {}),
    }),
    {
      name: "paku-kokubunpo:profile",
      storage: safeJSONStorage,
      // 保存内容に一覧にない id が入っていたら、標準のアイコンに戻す
      merge: (persisted, current) => {
        const saved = (persisted as { iconId?: unknown } | undefined)?.iconId;
        return { ...current, iconId: isPlayerIconId(saved) ? saved : current.iconId };
      },
    },
  ),
);
