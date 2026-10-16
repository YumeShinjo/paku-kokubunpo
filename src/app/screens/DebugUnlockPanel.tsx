import { setDebugUnlock, useDebugUnlock } from "@/lib/debugUnlock";

/**
 * 設定画面の「全解放」の項目(隠しデバッグ項目。音のログと同じ領域に並べる)。
 * 出すのは、`v0.0.1` を2秒以内に5回タップしたあと、または、全解放がオンのとき(SettingsScreen が決める)。
 * オンのあいだ、画面を出すときの「解放済みか」の判定だけを、すべて「解放済み」に見せる(進行データは、書き換えない。lib/debugUnlock.ts)。
 */
export function DebugUnlockPanel() {
  const on = useDebugUnlock();
  return (
    <section className="settings-section debug-unlock-panel" aria-labelledby="settings-unlock-heading">
      <h3 className="settings-heading" id="settings-unlock-heading">
        全解放{on && <span className="settings-heading-sub debug-unlock-on">オン</span>}
      </h3>
      <label className="settings-switch-row">
        <span>全解放</span>
        <input
          type="checkbox"
          role="switch"
          className="settings-switch"
          checked={on}
          onChange={(e) => setDebugUnlock(e.target.checked)}
        />
      </label>
      <p className="settings-note">全解放は、初期化では解除されません</p>
    </section>
  );
}
