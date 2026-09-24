import { findPlayerIcon, type IconShape } from "@/data/playerIcons";

/** 図形の形(24x24の枠の中)。色は fill で塗る */
const SHAPES: Record<IconShape, string> = {
  circle: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z",
  heart: "M12 21C5 15.5 3 12 3 8.8A4.8 4.8 0 0 1 12 6.6A4.8 4.8 0 0 1 21 8.8C21 12 19 15.5 12 21z",
  star: "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z",
  square: "M4.5 4.5h15a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1z",
  triangle: "M12 3.5l9 16H3z",
  diamond: "M12 2.5l8 9.5-8 9.5-8-9.5z",
  drop: "M12 2.5C8 8 5.5 11 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 11 16 8 12 2.5z",
  moon: "M15.5 3a9 9 0 1 0 5.5 12.5A7.5 7.5 0 0 1 15.5 3z",
};

/**
 * 主人公のアイコン(色と図形だけの仮アイコン)。id を渡すと、その図形を描く。
 * 知らない id のときは標準のアイコンにする(将来増えたアイコンを、古い版の画面が受け取ったときなど)。
 */
export function PlayerIcon({ iconId, size = 28, label }: { iconId?: string | null; size?: number; label?: string }) {
  const icon = findPlayerIcon(iconId);
  return (
    <svg
      className="player-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={SHAPES[icon.shape]} fill={icon.color} stroke="#4b3a2e" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
