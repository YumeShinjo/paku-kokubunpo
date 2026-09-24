import { PLAYER_ICONS } from "@/data/playerIcons";
import { PlayerIcon } from "@/components/PlayerIcon";

/** アイコンを選ぶ一覧(設定画面・ランキング画面で使う)。選んでいるものは押された状態(aria-pressed)で示す */
export function IconPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (iconId: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="icon-picker" role="group" aria-label="アイコンをえらぶ">
      {PLAYER_ICONS.map((icon) => (
        <button
          key={icon.id}
          type="button"
          className={`icon-choice ${icon.id === value ? "is-selected" : ""}`.trim()}
          aria-pressed={icon.id === value}
          aria-label={icon.label}
          title={icon.label}
          disabled={disabled}
          onClick={() => onChange(icon.id)}
        >
          <PlayerIcon iconId={icon.id} size={32} />
        </button>
      ))}
    </div>
  );
}
