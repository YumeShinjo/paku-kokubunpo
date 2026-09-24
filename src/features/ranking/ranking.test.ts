import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProgressStore } from "@/app/store/progressStore";
import { useProfileStore } from "@/app/store/profileStore";
import { useRankingStore } from "@/app/store/rankingStore";
import { DEFAULT_ICON_ID, findPlayerIcon, isPlayerIconId, PLAYER_ICONS } from "@/data/playerIcons";
import { afterEach } from "vitest";
import { assignRanks, RankingError, toRankingError, withTimeout, type RankingApi } from "@/lib/rankingApi";
import { containsNgWord, normalizeForNgCheck } from "./ngWords";
import { normalizeClassCode, readClassCodeFromUrl, validateClassCode, validateNickname } from "./inputRules";
import { hasPendingIcon, hasPendingScore, syncScore } from "./scoreSync";

describe("NGワード判定", () => {
  it("表記をそろえて判定する(全角半角・カタカナ・記号や空白・大文字小文字)", () => {
    expect(normalizeForNgCheck("ＦＵＣＫ")).toBe("fuck");
    expect(normalizeForNgCheck("ウ ン コ！")).toBe("うんこ");
    expect(normalizeForNgCheck("こ・ろ・す")).toBe("ころす");
  });

  it("含んでいたらNGの語は、前後に文字があっても弾く", () => {
    expect(containsNgWord("うんこマン")).toBe(true);
    expect(containsNgWord("ウンコ")).toBe(true);
    expect(containsNgWord("おまえをころす")).toBe(true);
    expect(containsNgWord("Fuck you")).toBe(true);
    expect(containsNgWord("死ね")).toBe(true);
    expect(containsNgWord("う・ん・こ")).toBe(true);
  });

  it("全体が一致したときだけNGの短い語は、名前の一部に入っていても弾かない(かすみ・ましろ・ごみ箱など)", () => {
    expect(containsNgWord("かす")).toBe(true);
    expect(containsNgWord("しね")).toBe(true);
    expect(containsNgWord("かすみ")).toBe(false);
    expect(containsNgWord("ましろ")).toBe(false);
    expect(containsNgWord("くずは")).toBe(false);
    expect(containsNgWord("ばかんす")).toBe(false);
    expect(containsNgWord("Essex")).toBe(false);
  });

  it("ふつうのニックネームは通る", () => {
    for (const name of ["たろう", "さくら", "ハナ", "Kai", "ゆうた123", "ことだま使い"]) {
      expect(containsNgWord(name), name).toBe(false);
    }
  });
});

describe("入力の検証", () => {
  it("クラスコード: 全角半角・大文字小文字をそろえ、前後の空白を除く", () => {
    expect(normalizeClassCode("  ＡＢＣ１  ")).toBe("abc1");
    const result = validateClassCode(" 3年A組 ");
    expect(result).toEqual({ ok: true, value: "3年a組" });
  });

  it("クラスコード: 2〜20文字で、文字・数字・ハイフン・アンダーバーだけ", () => {
    expect(validateClassCode("a").ok).toBe(false);
    expect(validateClassCode("ab").ok).toBe(true);
    expect(validateClassCode("a".repeat(20)).ok).toBe(true);
    expect(validateClassCode("a".repeat(21)).ok).toBe(false);
    expect(validateClassCode("さくら-2_組").ok).toBe(true);
    for (const bad of ["a/b", "a.b", "a b", "a?b", "__ab__", "a#b"]) {
      expect(validateClassCode(bad).ok, bad).toBe(false);
    }
  });

  it("ニックネーム: 1〜12文字で、不適切な語は使えない", () => {
    expect(validateNickname("  ")).toMatchObject({ ok: false });
    expect(validateNickname("たろう")).toEqual({ ok: true, value: "たろう" });
    expect(validateNickname("あ".repeat(12)).ok).toBe(true);
    expect(validateNickname("あ".repeat(13)).ok).toBe(false);
    expect(validateNickname("うんこ大王")).toMatchObject({ ok: false });
    // 絵文字は1文字として数える(サロゲートペアで水増しされない)
    expect(validateNickname("😀".repeat(12)).ok).toBe(true);
    expect(validateNickname("😀".repeat(13)).ok).toBe(false);
  });
});

describe("順位づけ・エラー分類", () => {
  it("同点は同じ順位で、次の順位は飛ぶ(1, 2, 2, 4)", () => {
    const ranked = assignRanks(
      [
        { uid: "a", nickname: "A", score: 300 },
        { uid: "b", nickname: "B", score: 200 },
        { uid: "c", nickname: "C", score: 200 },
        { uid: "d", nickname: "D", score: 50 },
      ],
      "c",
    );
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 2, 4]);
    expect(ranked.map((r) => r.isMe)).toEqual([false, false, true, false]);
  });

  it("Firebaseのエラーを、画面で扱う種類に分ける", () => {
    expect(toRankingError({ code: "unavailable" }).code).toBe("offline");
    expect(toRankingError({ code: "auth/network-request-failed" }).code).toBe("offline");
    expect(toRankingError({ code: "permission-denied" }).code).toBe("denied");
    expect(toRankingError({ code: "auth/operation-not-allowed" }).code).toBe("auth-disabled");
    expect(toRankingError(new Error("x")).code).toBe("unknown");
    const original = new RankingError("not-configured");
    expect(toRankingError(original)).toBe(original);
  });
});

function fakeApi(overrides: Partial<RankingApi> = {}): RankingApi & { submitScore: ReturnType<typeof vi.fn> } {
  return {
    isConfigured: () => true,
    joinClass: vi.fn(),
    submitScore: vi.fn().mockResolvedValue(undefined),
    fetchRanking: vi.fn(),
    leaveClass: vi.fn(),
    ...overrides,
  } as unknown as RankingApi & { submitScore: ReturnType<typeof vi.fn> };
}

describe("得点の同期(オフラインで貯めて、つながったら送る)", () => {
  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: [], totalScore: 0 });
    useRankingStore.setState({ classCode: null, nickname: null, lastSyncedScore: 0, syncedIcon: DEFAULT_ICON_ID });
    useProfileStore.setState({ iconId: DEFAULT_ICON_ID });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("クラスに参加していなければ何も送らない", async () => {
    const api = fakeApi();
    useProgressStore.setState({ totalScore: 100 });
    expect(await syncScore(api)).toBe("not-joined");
    expect(api.submitScore).not.toHaveBeenCalled();
  });

  it("未送信の得点があれば、いまの累計を送って、送信済みの得点を更新する", async () => {
    const api = fakeApi();
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 40 });
    useProgressStore.setState({ totalScore: 120 });
    expect(hasPendingScore()).toBe(true);
    expect(await syncScore(api)).toBe("synced");
    expect(api.submitScore).toHaveBeenCalledWith("3a", { nickname: "たろう", icon: DEFAULT_ICON_ID }, 120);
    expect(useRankingStore.getState().lastSyncedScore).toBe(120);
    expect(hasPendingScore()).toBe(false);
  });

  it("送るものがなければ送らない", async () => {
    const api = fakeApi();
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 120 });
    useProgressStore.setState({ totalScore: 120 });
    expect(await syncScore(api)).toBe("up-to-date");
    expect(api.submitScore).not.toHaveBeenCalled();
  });

  it("オフラインのときは送らず、得点はそのまま残る(通信が戻ったら送られる)", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const api = fakeApi();
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 0 });
    useProgressStore.setState({ totalScore: 50 });
    expect(await syncScore(api)).toBe("offline");
    expect(api.submitScore).not.toHaveBeenCalled();
    expect(hasPendingScore()).toBe(true);
    expect(useRankingStore.getState().lastSyncedScore).toBe(0);
  });

  it("送信に失敗しても例外にならず、送信済みの得点は進まない(次の機会に再送される)", async () => {
    const api = fakeApi({ submitScore: vi.fn().mockRejectedValue(new RankingError("offline")) });
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 0 });
    useProgressStore.setState({ totalScore: 50 });
    expect(await syncScore(api)).toBe("failed");
    expect(useRankingStore.getState().lastSyncedScore).toBe(0);
    expect(hasPendingScore()).toBe(true);
  });

  it("送っている間に得点が増えたら、続けてもう一度送る", async () => {
    const submit = vi.fn().mockImplementationOnce(async () => {
      useProgressStore.setState({ totalScore: 90 }); // 送信中に別のステージをクリアした想定
    });
    submit.mockResolvedValue(undefined);
    const api = fakeApi({ submitScore: submit });
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 0 });
    useProgressStore.setState({ totalScore: 50 });
    expect(await syncScore(api)).toBe("synced");
    expect(submit).toHaveBeenNthCalledWith(1, "3a", { nickname: "たろう", icon: DEFAULT_ICON_ID }, 50);
    expect(submit).toHaveBeenNthCalledWith(2, "3a", { nickname: "たろう", icon: DEFAULT_ICON_ID }, 90);
    expect(useRankingStore.getState().lastSyncedScore).toBe(90);
  });

  it("送信済みの得点は、古い結果で減らない", () => {
    useRankingStore.setState({ lastSyncedScore: 100 });
    useRankingStore.getState().markSynced(60);
    expect(useRankingStore.getState().lastSyncedScore).toBe(100);
  });

  it("参加・退出で、クラスとニックネームと送信済み得点が切り替わる", () => {
    useRankingStore.getState().join("3a", "たろう", 70, "pink-heart");
    expect(useRankingStore.getState()).toMatchObject({
      classCode: "3a",
      nickname: "たろう",
      lastSyncedScore: 70,
      syncedIcon: "pink-heart",
    });
    useRankingStore.getState().leave();
    expect(useRankingStore.getState()).toMatchObject({
      classCode: null,
      nickname: null,
      lastSyncedScore: 0,
      syncedIcon: null,
    });
  });

  it("同じクラスのままニックネームを変えても(join)、送信済みの得点は減らない", () => {
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 100 });
    useRankingStore.getState().join("3a", "はなこ", 80, DEFAULT_ICON_ID);
    expect(useRankingStore.getState()).toMatchObject({ nickname: "はなこ", lastSyncedScore: 100 });
  });
});

describe("主人公のアイコンの同期", () => {
  beforeEach(() => {
    useProgressStore.setState({ clearedStageIds: [], totalScore: 100 });
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 100, syncedIcon: DEFAULT_ICON_ID });
    useProfileStore.setState({ iconId: DEFAULT_ICON_ID });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("アイコンを変えると未送信になり、次の同期でアイコンつきで送られる(得点が同じでも)", async () => {
    const api = fakeApi();
    expect(hasPendingIcon()).toBe(false);
    useProfileStore.getState().setIcon("gold-star");
    expect(hasPendingIcon()).toBe(true);
    expect(await syncScore(api)).toBe("synced");
    expect(api.submitScore).toHaveBeenCalledWith("3a", { nickname: "たろう", icon: "gold-star" }, 100);
    expect(useRankingStore.getState().syncedIcon).toBe("gold-star");
    expect(hasPendingIcon()).toBe(false);
  });

  it("アイコンだけを送るとき、送信済みの得点を下回る得点は送らない(別の端末で貯めた得点が消えない)", async () => {
    const api = fakeApi();
    useProgressStore.setState({ totalScore: 20 }); // この端末の累計は少ないが、サーバーには500点ある
    useRankingStore.setState({ lastSyncedScore: 500 });
    useProfileStore.getState().setIcon("blue-square");
    await syncScore(api);
    expect(api.submitScore).toHaveBeenCalledWith("3a", { nickname: "たろう", icon: "blue-square" }, 500);
  });

  it("オフラインでアイコンを変えても失われず、通信が戻ったら送られる", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    const api = fakeApi();
    useProfileStore.getState().setIcon("sky-drop");
    expect(await syncScore(api)).toBe("offline");
    expect(hasPendingIcon()).toBe(true);
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    expect(await syncScore(api)).toBe("synced");
    expect(api.submitScore).toHaveBeenCalledTimes(1);
  });

  it("参加していないときは、アイコンを変えても何も送らない", async () => {
    const api = fakeApi();
    useRankingStore.setState({ classCode: null, nickname: null });
    useProfileStore.getState().setIcon("gold-star");
    expect(hasPendingIcon()).toBe(false);
    expect(await syncScore(api)).toBe("not-joined");
    expect(api.submitScore).not.toHaveBeenCalled();
  });

  it("古い版が書いたデータ(アイコンなし)の順位表は、標準のアイコンで表示できる", () => {
    const entries = assignRanks([{ uid: "a", nickname: "たろう", score: 10 }], "a");
    expect(entries[0].icon).toBe("");
    expect(findPlayerIcon(entries[0].icon).id).toBe(DEFAULT_ICON_ID);
    expect(findPlayerIcon("no-such-icon").id).toBe(DEFAULT_ICON_ID);
  });
});

describe("プロフィール(アイコン)の保存", () => {
  it("一覧にない id は選べず、いまのアイコンのまま", () => {
    useProfileStore.setState({ iconId: "pink-heart" });
    useProfileStore.getState().setIcon("no-such-icon");
    expect(useProfileStore.getState().iconId).toBe("pink-heart");
  });

  it("一覧のすべてのアイコンが、重複しない id と名前を持つ", () => {
    expect(new Set(PLAYER_ICONS.map((i) => i.id)).size).toBe(PLAYER_ICONS.length);
    expect(PLAYER_ICONS.length).toBeGreaterThanOrEqual(4);
    for (const icon of PLAYER_ICONS) {
      expect(isPlayerIconId(icon.id)).toBe(true);
      expect(icon.label.length).toBeGreaterThan(0);
      expect(icon.id.length).toBeLessThanOrEqual(32); // firestore.rules の icon の長さの上限
    }
  });
});

describe("通信が不安定なとき(返ってこない通信を打ち切る)", () => {
  afterEach(() => vi.useRealTimers());

  it("返ってこない通信は、時間切れで offline として失敗する(画面や送信が固まらない)", async () => {
    vi.useFakeTimers();
    const never = new Promise<void>(() => {});
    const result = withTimeout(never, 10_000);
    const assertion = expect(result).rejects.toMatchObject({ code: "offline" });
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
  });

  it("時間内に返ってきた結果はそのまま返し、エラーもそのまま伝える", async () => {
    await expect(withTimeout(Promise.resolve(42), 1000)).resolves.toBe(42);
    const failure = new RankingError("denied");
    await expect(withTimeout(Promise.reject(failure), 1000)).rejects.toBe(failure);
  });

  it("送信が返ってこなくても、時間切れのあと次の同期をやり直せる(inFlightが残り続けない)", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const api = {
      isConfigured: () => true,
      submitScore: vi.fn().mockImplementation(() => {
        calls += 1;
        return calls === 1 ? withTimeout(new Promise<void>(() => {}), 10_000) : Promise.resolve();
      }),
    } as unknown as RankingApi;
    useRankingStore.setState({ classCode: "3a", nickname: "たろう", lastSyncedScore: 0 });
    useProgressStore.setState({ totalScore: 30 });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });

    const first = syncScore(api);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await first).toBe("failed");
    expect(hasPendingScore()).toBe(true);

    expect(await syncScore(api)).toBe("synced");
    expect(hasPendingScore()).toBe(false);
  });
});

describe("共有URLからのクラスコード", () => {
  it("?class=合言葉 を入力欄の初期値として読む", () => {
    expect(readClassCodeFromUrl("?class=demo2026")).toBe("demo2026");
    expect(readClassCodeFromUrl("?class=%E7%99%BA%E8%A1%A8%E4%BC%9A")).toBe("発表会");
    expect(readClassCodeFromUrl("?a=1&class=x1")).toBe("x1");
  });

  it("指定がなければ空", () => {
    expect(readClassCodeFromUrl("")).toBe("");
    expect(readClassCodeFromUrl("?foo=bar")).toBe("");
  });
});
