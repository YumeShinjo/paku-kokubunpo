import { useStorageStatus } from "@/lib/safeStorage";
import { useNavigationStore } from "@/app/store/navigationStore";
import { Rb } from "@/components/Rb";

/**
 * 端末に進み具合を保存できていないときの、画面上部のお知らせ(lib/safeStorage.ts)。
 * 遊びは続けられるが、アプリを閉じると消えてしまうので、「ひきつぎコード」で控えておくよう案内する。
 */
export function StorageWarning() {
  const failed = useStorageStatus((s) => s.saveFailed);
  const dismissed = useStorageStatus((s) => s.dismissed);
  const dismiss = useStorageStatus((s) => s.dismiss);
  const goTo = useNavigationStore((s) => s.goTo);
  if (!failed || dismissed) return null;
  return (
    <div className="storage-warning" role="alert">
      <p>
        <Rb t="この端末[たんまつ]に、進[すす]み具合[ぐあい]を保存[ほぞん]できていないよ。アプリを閉[と]じると消[き]えてしまうかも。「ひきつぎコード」でひかえておいてね。" />
      </p>
      <div className="storage-warning-buttons">
        <button type="button" onClick={() => goTo({ name: "transferIssue" })}>
          ひきつぎコードを つくる
        </button>
        <button type="button" onClick={dismiss}>
          とじる
        </button>
      </div>
    </div>
  );
}
