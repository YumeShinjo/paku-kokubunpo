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

const ERROR_MESSAGES: Record<RankingErrorCode, string> = {
  "not-configured": "ランキングは まだ つかえないよ。",
  offline: "つうしんが できないみたい。ネットに つながってから、もういちど ためしてね。",
  denied: "とくてんを おくれなかったよ。もういちど ためしてね。",
  "auth-disabled": "ランキングの じゅんびが まだ おわっていないよ。",
  unknown: "うまく いかなかったよ。すこし まってから もういちど ためしてね。",
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
        <p>{ERROR_MESSAGES["not-configured"]}</p>
        <button type="button" onClick={() => goTo({ name: "title" })}>
          もどる
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
        先生がきめた「クラスコード」を いれると、おなじクラスの みんなと とくてんを くらべられるよ。
        なまえは ニックネームで OK(ほんみょうは いれないでね)。
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
            先生から聞いた、推測されにくい合言葉を入力してね。(かんたんな ことばだと、ほかの クラスの人に 見られてしまうかも)
          </small>
        </label>
        <label>
          ニックネーム({NICKNAME_MAX}もじまで)
          <input
            type="text"
            value={nameInput}
            maxLength={NICKNAME_MAX * 2}
            autoComplete="off"
            onChange={(e) => setNameInput(e.target.value)}
          />
        </label>
        <div className="ranking-icon-field">
          アイコン(ランキングに でるよ)
          <IconPicker value={iconId} onChange={setIcon} />
        </div>
        {error && (
          <p className="ranking-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? "つうしんちゅう…" : "さんかする"}
        </button>
      </form>
      <button type="button" onClick={onBack}>
        もどる
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
        <PlayerIcon iconId={iconId} size={28} label="あなたの アイコン" /> ニックネーム: <strong>{nickname}</strong>
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
            あたらしい ニックネーム({NICKNAME_MAX}もじまで)
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
              {nameError}
            </p>
          )}
          <div className="quit-confirm-buttons">
            <button type="submit" disabled={renaming}>
              {renaming ? "つうしんちゅう…" : "かえる"}
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
          ニックネームを かえる
        </button>
      )}
      <div className="ranking-icon-field">
        アイコンを かえる
        <IconPicker
          value={iconId}
          onChange={(id) => {
            setIcon(id);
            void syncScore().then(() => void load()); // 通信できないときは、あとで自動で送られる
          }}
        />
      </div>
      <p className="ranking-score">
        あなたの とくてん: <strong>{totalScore}</strong>
        {snapshot?.me && (
          <>
            {" "}
            (いま <strong>{snapshot.me.rank}</strong> い)
          </>
        )}
      </p>
      {pending && (
        <p className="settings-note">まだ おくれていない とくてんが あるよ。つうしんできると じどうで おくるよ。</p>
      )}

      {loading && !snapshot && <p>よみこみちゅう…</p>}
      {error && (
        <p className="ranking-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="ranking-error" role="alert">
          {message}
        </p>
      )}

      {snapshot &&
        (snapshot.entries.length === 0 ? (
          <p>まだ だれも いないよ。</p>
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
                <span className="ranking-points">{entry.score}てん</span>
              </li>
            ))}
          </ol>
        ))}

      <button type="button" onClick={() => void load()} disabled={loading}>
        こうしん
      </button>

      {confirmingLeave ? (
        <div className="quit-confirm" role="alertdialog" aria-label="クラスをぬける確認">
          <p>クラスを ぬけると、ランキングから あなたの とくてんが きえるよ。ぬける?</p>
          <div className="quit-confirm-buttons">
            <button type="button" className="quit-yes" disabled={busy} onClick={onLeave}>
              ぬける
            </button>
            <button type="button" onClick={() => setConfirmingLeave(false)}>
              やめる
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="quit-button" onClick={() => setConfirmingLeave(true)}>
          クラスを ぬける
        </button>
      )}

      <button type="button" onClick={onBack}>
        もどる
      </button>
    </div>
  );
}
