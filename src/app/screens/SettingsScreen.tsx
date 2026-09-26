import { useNavigationStore } from "@/app/store/navigationStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { playSe, unlockPlayback } from "@/lib/audio";
import { useState } from "react";
import { reloadApp, resetAllData } from "@/features/settings/resetData";
import { Rb } from "@/components/Rb";
import { BackButton } from "@/components/BackButton";

/** 設定画面。BGM/SE音量とミュートを端末ローカルに保存する(7章)。 */
export function SettingsScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const { bgmVolume, seVolume, muted, setBgmVolume, setSeVolume, setMuted } =
    useSettingsStore();

  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    setResetting(true);
    await resetAllData(); // ランキング参加中なら先にクラスから抜ける。通信できなくても、端末のデータは消す
    reloadApp(); // 読み込み直して、メモリ上のデータも最初の状態にする
  }

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
      <BackButton onClick={() => goTo({ name: "title" })} />
      <h2>
        せってい
      </h2>

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
      {guidesPending && (
        <p className="settings-note">
          <Rb t="次[つぎ]に遊[あそ]ぶとき、説明[せつめい]が出[で]るよ。" />
        </p>
      )}

      {/* 機種変更・アプリの入れ直しのときの、データの引き継ぎ */}
      <button type="button" onClick={() => goTo({ name: "transferIssue" })}>
        ひきつぎコードを つくる
      </button>
      <button type="button" onClick={() => goTo({ name: "transferRestore" })}>
        ひきつぎコードを いれる
      </button>
      <p className="settings-note">
        <Rb t="機種変更[きしゅへんこう]のときは、古[ふる]い端末[たんまつ]で「つくる」→ 新[あたら]しい端末[たんまつ]で「いれる」。" />
      </p>

      <button type="button" onClick={() => goTo({ name: "credits", next: { name: "settings" } })}>
        クレジット
      </button>

      {confirmingReset ? (
        <div className="quit-confirm" role="alertdialog" aria-label="データの初期化の確認">
          <p>
            <Rb t="進[すす]み具合[ぐあい]・得点[とくてん]・ストーリー・図鑑[ずかん]・アイコン・ランキング参加[さんか]など、保存[ほぞん]したデータをすべて消[け]して、最初[さいしょ]の状態[じょうたい]に戻[もど]すよ。音量[おんりょう]の設定[せってい]も最初[さいしょ]に戻[もど]るよ。ランキングに参加[さんか]中[ちゅう]なら、順位表[じゅんいひょう]からも抜[ぬ]けるよ(通信[つうしん]できないときは、順位表[じゅんいひょう]にデータが残[のこ]るよ)。" />
          </p>
          <p className="reset-question">
            <Rb t="本当[ほんとう]に初期化[しょきか]しますか?" />
          </p>
          <div className="quit-confirm-buttons">
            <button type="button" className="quit-yes" disabled={resetting} onClick={() => void handleReset()}>
              {resetting ? "しょりちゅう…" : "はい"}
            </button>
            <button type="button" disabled={resetting} autoFocus onClick={() => setConfirmingReset(false)}>
              いいえ
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="quit-button" onClick={() => setConfirmingReset(true)}>
          <Rb t="データを初期化[しょきか]する" />
        </button>
      )}

    </div>
  );
}
