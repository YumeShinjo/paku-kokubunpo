/**
 * 「もどる」ボタン。画面の一番上に置き、スクロールしても常に見える位置にとどまる(sticky)。
 * 画面の一番下までスクロールしないと戻れない、という不便をなくすため、下部ではなく上部に置く。
 */
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="back-button" onClick={onClick}>
      ◀ もどる
    </button>
  );
}
