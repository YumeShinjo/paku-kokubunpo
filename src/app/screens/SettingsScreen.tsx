import { useNavigationStore } from "@/app/store/navigationStore";
import { TEXT_SIZES, useSettingsStore, type TextSize } from "@/app/store/settingsStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { playSe, unlockPlayback } from "@/lib/audio";
import { copyAudioDebug, isAudioDebugEnabled } from "@/lib/audioDebug";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { reloadApp, resetAllData } from "@/features/settings/resetData";
import { Rb } from "@/components/Rb";
import { BackButton } from "@/components/BackButton";
import { ContactLink } from "@/components/ContactLink";

/** 文字の大きさの、ボタンに出す呼び名 */
const TEXT_SIZE_LABEL: Record<TextSize, string> = { small: "小", standard: "標準", large: "大" };

/** 設定画面。BGM/SE音量とミュートを端末ローカルに保存する(7章)。 */
export function SettingsScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const { bgmVolume, seVolume, muted, textSize, setBgmVolume, setSeVolume, setMuted, setTextSize } =
    useSettingsStore();

  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    setResetting(true);
    await resetAllData(); // ランキング参加中なら先にクラスから抜ける。通信できなくても、端末のデータは消す
    reloadApp(); // 読み込み直して、メモリ上のデータも最初の状態にする
  }

  // 音のログのコピー(URLに ?audiodebug=1 を付けて開いたときだけ出る、調査用の隠しボタン)
  const audioDebug = isAudioDebugEnabled();
  const [audioDebugCopied, setAudioDebugCopied] = useState<"idle" | "ok" | "ng">("idle");

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

      {/* アクセシビリティ: 文字の大きさ。画面全体の文字サイズが、選んだ大きさに変わる */}
      <fieldset className="text-size-field settings-section">
        <legend className="settings-heading">もじの おおきさ</legend>
        <div className="text-size-buttons" role="radiogroup" aria-label="もじの おおきさ">
          {TEXT_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={textSize === size}
              className={textSize === size ? "selected" : ""}
              onClick={() => setTextSize(size)}
            >
              {TEXT_SIZE_LABEL[size]}
            </button>
          ))}
        </div>
      </fieldset>

      {/* おと: 音量(つまみは、指で押しやすい大きさ)・効果音の試し聞き・ミュート(スイッチ。行ぜんたいが押せる) */}
      <section className="settings-section" aria-labelledby="settings-sound-heading">
        <h3 className="settings-heading" id="settings-sound-heading">おと</h3>
        <div className="settings-slider">
          <label htmlFor="settings-bgm-volume">BGMおんりょう</label>
          <input
            id="settings-bgm-volume"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={bgmVolume}
            onChange={(e) => setBgmVolume(Number(e.target.value))}
          />
        </div>
        <div className="settings-slider">
          <label htmlFor="settings-se-volume">こうかおんおんりょう</label>
          <div className="settings-slider-row">
            <input
              id="settings-se-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={seVolume}
              onChange={(e) => setSeVolume(Number(e.target.value))}
            />
            <button type="button" className="settings-try" aria-label="こうかおんを ためす" onClick={handleTestSe}>
              ためす
            </button>
          </div>
        </div>
        <label className="settings-switch-row">
          <span>ミュート</span>
          <input
            type="checkbox"
            role="switch"
            className="settings-switch"
            checked={muted}
            onChange={(e) => setMuted(e.target.checked)}
          />
        </label>
      </section>

      <section className="settings-section" aria-labelledby="settings-howto-heading">
        <h3 className="settings-heading" id="settings-howto-heading">つかいかた</h3>
        <div className="settings-pair">
          <button type="button" onClick={() => goTo({ name: "howto" })}>
            あそびかた
          </button>
          <button type="button" onClick={resetGuides} disabled={guidesPending}>
            そうさの せつめい
          </button>
        </div>
        {guidesPending && (
          <p className="settings-note">
            <Rb t="次[つぎ]に遊[あそ]ぶとき、説明[せつめい]が出[で]るよ。" />
          </p>
        )}
      </section>

      {/* 機種変更・アプリの入れ直しのときの、データの引き継ぎ */}
      <section className="settings-section" aria-labelledby="settings-transfer-heading">
        <h3 className="settings-heading" id="settings-transfer-heading">
          ひきつぎコード<span className="settings-heading-sub">きしゅへんこうの とき</span>
        </h3>
        <div className="settings-pair">
          <button type="button" onClick={() => goTo({ name: "transferIssue" })}>
            つくる
          </button>
          <button type="button" onClick={() => goTo({ name: "transferRestore" })}>
            いれる
          </button>
        </div>
        <p className="settings-note settings-note-line">
          <Rb t="古[ふる]い端末[たんまつ]で「つくる」→ 新[あたら]しい端末[たんまつ]で「いれる」" />
        </p>
      </section>

      <section className="settings-section" aria-labelledby="settings-about-heading">
        <h3 className="settings-heading" id="settings-about-heading">このアプリについて</h3>
        <div className="settings-links">
          <button type="button" className="settings-row" onClick={() => goTo({ name: "privacy", next: { name: "settings" } })}>
            <span>プライバシーポリシー</span>
            <ChevronRight aria-hidden="true" size={20} />
          </button>
          {/* 使った素材・ライブラリの、くわしい出典(ネタバレを含むので、ページの中で「ひらく」を押すまで一覧は出ない) */}
          <button type="button" className="settings-row" onClick={() => goTo({ name: "sources", next: { name: "settings" } })}>
            <span>くわしい出典</span>
            <ChevronRight aria-hidden="true" size={20} />
          </button>
          <button type="button" className="settings-row" onClick={() => goTo({ name: "credits", next: { name: "settings" } })}>
            <span>クレジット</span>
            <ChevronRight aria-hidden="true" size={20} />
          </button>
          {/* お問い合わせフォーム(外部のブラウザで開く) */}
          <ContactLink className="settings-row" />
        </div>
        <p className="settings-version">v{__APP_VERSION__}</p>
      </section>

      {audioDebug && (
        <button
          type="button"
          className="audio-debug-copy"
          onClick={() => void copyAudioDebug().then((ok) => setAudioDebugCopied(ok ? "ok" : "ng"))}
        >
          {audioDebugCopied === "ok" ? "音のログを コピーしました" : audioDebugCopied === "ng" ? "コピーできませんでした" : "音のログを コピー"}
        </button>
      )}

      {/* データの初期化は、いちばん下に、ほかと離して置く(うっかり押さないように) */}
      <div className="settings-reset">
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
    </div>
  );
}
