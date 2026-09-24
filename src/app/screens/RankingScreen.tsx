import { useCallback, useEffect, useState } from "react";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useProgressStore } from "@/app/store/progressStore";
import { useRankingStore } from "@/app/store/rankingStore";
import { hasPendingIcon, hasPendingScore, syncScore } from "@/features/ranking/scoreSync";
import { useProfileStore } from "@/app/store/profileStore";
import { IconPicker } from "@/components/IconPicker";
import { PlayerIcon } from "@/components/PlayerIcon";
import {
  readClassCodeFromUrl,
  validateClassCode,
  validateNickname,
  CLASS_CODE_MAX,
  NICKNAME_MAX,
} from "@/features/ranking/inputRules";
import {
  rankingApi,
  toRankingError,
  type RankingErrorCode,
  type RankingSnapshot,
} from "@/lib/rankingApi";
import { Rb } from "@/components/Rb";

const ERROR_MESSAGES: Record<RankingErrorCode, string> = {
  "not-configured": "ランキングはまだ使[つか]えないよ。",
  offline: "通信[つうしん]できないみたい。ネットにつながってから、もう一度[いちど]試[ため]してね。",
  denied: "得点[とくてん]を送[おく]れなかったよ。もう一度[いちど]試[ため]してね。",
  "auth-disabled": "ランキングの準備[じゅんび]がまだ終[お]わっていないよ。",
  unknown: "うまくいかなかったよ。少[すこ]し待[ま]ってから、もう一度[いちど]試[ため]してね。",
};

/**
 * ランキング画面(8章)。同じクラスコード(先生が決める合言葉)のグループ内だけの、累計得点の順位を表示する。
 * 参加はクラスコード+ニックネームだけ(メールアドレス・パスワードなし。匿名認証)。
 * 得点は端末に貯まり、通信できるときに自動で送られる。順位は開いたときと「こうしん」で取得する。
 */
export function RankingScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const totalScore = useProgressStore((s) => s.totalScore);
  const { classCode, nickname, lastSyncedScore, join, leave } = useRankingStore();

  const configured = rankingApi.isConfigured();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="screen screen-ranking">
        <h2>ランキング</h2>
        <p>
          <Rb t={ERROR_MESSAGES["not-configured"]} />
        </p>
        <button type="button" onClick={() => goTo({ name: "title" })}>
          <Rb t="戻[もど]る" />
        </button>
      </div>
    );
  }

  return classCode && nickname ? (
    <JoinedView
      classCode={classCode}
      nickname={nickname}
      totalScore={totalScore}
      pending={totalScore > lastSyncedScore}
      onRename={async (newName) => {
        // サーバーの自分のデータを書き換える(得点は大きいほうが残る)。通信できないときは、変えずにエラーを返す
        const synced = await rankingApi.joinClass(classCode, { nickname: newName, icon: useProfileStore.getState().iconId }, totalScore);
        join(classCode, newName, synced, useProfileStore.getState().iconId);
      }}
      onLeave={async () => {
        setBusy(true);
        setMessage(null);
        try {
          await rankingApi.leaveClass(classCode);
          leave();
        } catch (error) {
          setMessage(ERROR_MESSAGES[toRankingError(error).code]);
        } finally {
          setBusy(false);
        }
      }}
      busy={busy}
      message={message}
      onBack={() => goTo({ name: "title" })}
    />
  ) : (
    <JoinForm
      totalScore={totalScore}
      onJoined={(code, name, score, icon) => join(code, name, score, icon)}
      onBack={() => goTo({ name: "title" })}
    />
  );
}

const classCodeFromUrl = readClassCodeFromUrl(typeof window === "undefined" ? "" : window.location.search);

function JoinForm({
  totalScore,
  onJoined,
  onBack,
}: {
  totalScore: number;
  onJoined: (classCode: string, nickname: string, syncedScore: number, icon: string) => void;
  onBack: () => void;
}) {
  const [codeInput, setCodeInput] = useState(classCodeFromUrl);
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const iconId = useProfileStore((s) => s.iconId);
  const setIcon = useProfileStore((s) => s.setIcon);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const code = validateClassCode(codeInput);
    if (!code.ok) return setError(code.message);
    const name = validateNickname(nameInput);
    if (!name.ok) return setError(name.message);

    setBusy(true);
    setError(null);
    try {
      const synced = await rankingApi.joinClass(code.value, { nickname: name.value, icon: iconId }, totalScore);
      onJoined(code.value, name.value, synced, iconId);
    } catch (e) {
      setError(ERROR_MESSAGES[toRankingError(e).code]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen screen-ranking">
      <h2>ランキング</h2>
      <p className="ranking-lead">
        <Rb t="先生[せんせい]が決[き]めた「クラスコード」を入[い]れると、同[おな]じクラスのみんなと得点[とくてん]を比[くら]べられるよ。名前[なまえ]はニックネームでOK(本名[ほんみょう]は入[い]れないでね)。" />
      </p>
      <form className="ranking-form" onSubmit={submit}>
        <label>
          クラスコード
          <input
            type="text"
            value={codeInput}
            maxLength={CLASS_CODE_MAX * 2}
            autoComplete="off"
            autoCapitalize="none"
            onChange={(e) => setCodeInput(e.target.value)}
          />
          <small className="ranking-hint">
            <Rb t="先生[せんせい]から聞[き]いた、推測[すいそく]されにくい合言葉[あいことば]を入力[にゅうりょく]してね。(かんたんな言葉[ことば]だと、ほかのクラスの人[ひと]に見[み]られてしまうかも)" />
          </small>
        </label>
        <label>
          <Rb t={`ニックネーム(${NICKNAME_MAX}文字[もじ]まで)`} />
          <input
            type="text"
            value={nameInput}
            maxLength={NICKNAME_MAX * 2}
            autoComplete="off"
            onChange={(e) => setNameInput(e.target.value)}
          />
        </label>
        <div className="ranking-icon-field">
          <span>
            <Rb t="アイコン(ランキングに出[で]るよ)" />
          </span>
          <IconPicker value={iconId} onChange={setIcon} />
        </div>
        {error && (
          <p className="ranking-error" role="alert">
            <Rb t={error} />
          </p>
        )}
        <button type="submit" disabled={busy}>
          <Rb t={busy ? "通信中[つうしんちゅう]…" : "参加[さんか]する"} />
        </button>
      </form>
      <button type="button" onClick={onBack}>
        <Rb t="戻[もど]る" />
      </button>
    </div>
  );
}

function JoinedView({
  classCode,
  nickname,
  totalScore,
  pending,
  busy,
  message,
  onRename,
  onLeave,
  onBack,
}: {
  classCode: string;
  nickname: string;
  totalScore: number;
  pending: boolean;
  busy: boolean;
  message: string | null;
  onRename: (nickname: string) => Promise<void>;
  onLeave: () => void;
  onBack: () => void;
}) {
  const [snapshot, setSnapshot] = useState<RankingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const iconId = useProfileStore((s) => s.iconId);
  const setIcon = useProfileStore((s) => s.setIcon);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(nickname);
  const [nameError, setNameError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // まず順位を出して(通信が遅くても、画面が固まらないように)、未送信の得点があれば送ってから取り直す
    try {
      setSnapshot(await rankingApi.fetchRanking(classCode));
    } catch (e) {
      setError(ERROR_MESSAGES[toRankingError(e).code]);
    } finally {
      setLoading(false);
    }
    if ((hasPendingScore() || hasPendingIcon()) && (await syncScore()) === "synced") {
      try {
        setSnapshot(await rankingApi.fetchRanking(classCode));
        setError(null);
      } catch {
        // 取り直せなくても、先に出した順位はそのまま見せておく
      }
    }
  }, [classCode]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="screen screen-ranking">
      <h2>ランキング</h2>
      <p className="ranking-class">
        クラスコード: <strong>{classCode}</strong>
      </p>
      <p className="ranking-class ranking-profile">
        <PlayerIcon iconId={iconId} size={28} label="あなたのアイコン" /> <Rb t="ニックネーム:" /> <strong>{nickname}</strong>
      </p>
      {editingName ? (
        <form
          className="ranking-form ranking-rename"
          onSubmit={async (event) => {
            event.preventDefault();
            const name = validateNickname(nameInput);
            if (!name.ok) return setNameError(name.message);
            if (name.value === nickname) return setEditingName(false);
            setRenaming(true);
            setNameError(null);
            try {
              await onRename(name.value);
              setEditingName(false);
            } catch (e) {
              setNameError(ERROR_MESSAGES[toRankingError(e).code]);
            } finally {
              setRenaming(false);
            }
          }}
        >
          <label>
            <Rb t={`新[あたら]しいニックネーム(${NICKNAME_MAX}文字[もじ]まで)`} />
            <input
              type="text"
              value={nameInput}
              maxLength={NICKNAME_MAX * 2}
              autoComplete="off"
              onChange={(e) => setNameInput(e.target.value)}
            />
          </label>
          {nameError && (
            <p className="ranking-error" role="alert">
              <Rb t={nameError} />
            </p>
          )}
          <div className="quit-confirm-buttons">
            <button type="submit" disabled={renaming}>
              <Rb t={renaming ? "通信中[つうしんちゅう]…" : "変[か]える"} />
            </button>
            <button type="button" disabled={renaming} onClick={() => setEditingName(false)}>
              やめる
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setNameInput(nickname);
            setNameError(null);
            setEditingName(true);
          }}
        >
          <Rb t="ニックネームを変[か]える" />
        </button>
      )}
      <div className="ranking-icon-field">
        <span>
          <Rb t="アイコンを変[か]える" />
        </span>
        <IconPicker
          value={iconId}
          onChange={(id) => {
            setIcon(id);
            void syncScore().then(() => void load()); // 通信できないときは、あとで自動で送られる
          }}
        />
      </div>
      <p className="ranking-score">
        <Rb t="あなたの得点[とくてん]:" /> <strong>{totalScore}</strong>
        {snapshot?.me && (
          <>
            {" "}
            <Rb t="(いま" /> <strong>{snapshot.me.rank}</strong> <Rb t="位[い])" />
          </>
        )}
      </p>
      {pending && (
        <p className="settings-note">
          <Rb t="まだ送[おく]れていない得点[とくてん]があるよ。通信[つうしん]できると自動[じどう]で送[おく]るよ。" />
        </p>
      )}

      {loading && !snapshot && (
        <p>
          <Rb t="読[よ]み込[こ]み中[ちゅう]…" />
        </p>
      )}
      {error && (
        <p className="ranking-error" role="alert">
          <Rb t={error} />
        </p>
      )}
      {message && (
        <p className="ranking-error" role="alert">
          <Rb t={message} />
        </p>
      )}

      {snapshot &&
        (snapshot.entries.length === 0 ? (
          <p>
            <Rb t="まだ誰[だれ]もいないよ。" />
          </p>
        ) : (
          <ol className="ranking-list">
            {snapshot.entries.map((entry) => (
              <li
                key={entry.uid}
                className={[entry.isMe ? "ranking-me" : "", entry.rank <= 3 ? "ranking-top" : ""].filter(Boolean).join(" ")}
              >
                <span className="ranking-rank">{entry.rank}</span>
                <PlayerIcon iconId={entry.isMe ? iconId : entry.icon} size={24} />
                <span className="ranking-name">{entry.nickname}</span>
                <span className="ranking-points">
                  {entry.score}
                  <Rb t="点[てん]" />
                </span>
              </li>
            ))}
          </ol>
        ))}

      <button type="button" onClick={() => void load()} disabled={loading}>
        <Rb t="更新[こうしん]" />
      </button>

      {confirmingLeave ? (
        <div className="quit-confirm" role="alertdialog" aria-label="クラスをぬける確認">
          <p>
            <Rb t="クラスを抜[ぬ]けると、ランキングからあなたの得点[とくてん]が消[き]えるよ。抜[ぬ]ける?" />
          </p>
          <div className="quit-confirm-buttons">
            <button type="button" className="quit-yes" disabled={busy} onClick={onLeave}>
              <Rb t="抜[ぬ]ける" />
            </button>
            <button type="button" onClick={() => setConfirmingLeave(false)}>
              やめる
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="quit-button" onClick={() => setConfirmingLeave(true)}>
          <Rb t="クラスを抜[ぬ]ける" />
        </button>
      )}

      <button type="button" onClick={onBack}>
        <Rb t="戻[もど]る" />
      </button>
    </div>
  );
}
