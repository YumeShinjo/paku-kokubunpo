import { useNavigationStore } from "@/app/store/navigationStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { playSe, unlockPlayback } from "@/lib/audio";

/** 設定画面。BGM/SE音量とミュートを端末ローカルに保存する(7章)。 */
export function SettingsScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const { bgmVolume, seVolume, muted, setBgmVolume, setSeVolume, setMuted } =
    useSettingsStore();

  const resetGuides = useTutorialStore((s) => s.resetGuides);
  const guidesPending = useTutorialStore((s) => s.seenGuides.length === 0);

  // せっていに直接来た場合(タイトルの「はじめる」を通らない導線)でも
  // 音量スライダーの試聴音が鳴るよう、ここでも解禁しておく(9章)。
  function handleTestSe() {
    unlockPlayback();
    playSe("correct");
  }

  return (
    <div className="screen screen-settings">
      <h2>せってい</h2>

      <label>
        BGMおんりょう
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={bgmVolume}
          onChange={(e) => setBgmVolume(Number(e.target.value))}
        />
      </label>

      <label>
        こうかおんおんりょう
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={seVolume}
          onChange={(e) => setSeVolume(Number(e.target.value))}
        />
      </label>
      <button type="button" onClick={handleTestSe}>
        こうかおんをためす
      </button>

      <label>
        <input
          type="checkbox"
          checked={muted}
          onChange={(e) => setMuted(e.target.checked)}
        />
        ミュート
      </label>

      <button type="button" onClick={resetGuides} disabled={guidesPending}>
        そうさの せつめいを もういちど 見る
      </button>
      {guidesPending && <p className="settings-note">つぎに あそぶとき、せつめいが 出るよ。</p>}

      <button type="button" onClick={() => goTo({ name: "credits", next: { name: "settings" } })}>
        クレジット
      </button>

      <button type="button" onClick={() => goTo({ name: "title" })}>
        もどる
      </button>
    </div>
  );
}
