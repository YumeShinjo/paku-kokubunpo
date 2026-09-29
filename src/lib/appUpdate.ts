import { useNavigationStore } from "@/app/store/navigationStore";

/**
 * アプリの更新の反映(PWA)。
 *
 * 新しい版を配信すると、端末のサービスワーカーが裏で新しい版を取り込んで入れ替わる(skipWaiting + clientsClaim)。
 * ただし、すでに開いている画面は、古い版のプログラムのまま動き続けるので、そのままでは、
 * 差し替えた画像などが「次に起動し直すまで」出ない。ホーム画面から開いたアプリは、閉じずに何日も
 * 開いたままになりやすく、いつまでも古い画面が残ることがある。
 * そこで、新しい版に入れ替わったら、途中経過のない画面(タイトル・エリア選択・ステージ選択)で、
 * 画面を読み込み直す。出題中・会話中は、読み込み直さず、そういう画面に戻ったときに読み込み直す。
 */

/** 読み込み直しても、失うものがない画面(出題中・会話中・コードの発行/入力中などは含めない) */
const SAFE_SCREENS: ReadonlySet<string> = new Set(["title", "areaSelect", "stageSelect"]);

export function isSafeToReload(screenName: string): boolean {
  return SAFE_SCREENS.has(screenName);
}

/** 更新の確認をする最短の間隔(ミリ秒)。アプリに戻るたびに確認して、通信を増やしすぎないようにする */
export const UPDATE_CHECK_MIN_INTERVAL_MS = 5 * 60 * 1000;

export function shouldCheckForUpdate(lastCheckedAt: number | null, now: number): boolean {
  return lastCheckedAt === null || now - lastCheckedAt >= UPDATE_CHECK_MIN_INTERVAL_MS;
}

/**
 * 「新しい版に入れ替わった」あと、安全な画面のうちに、1度だけ読み込み直す。
 * markUpdateReady で入れ替わりを知らせ、画面が変わるたびに onScreenChange を呼ぶ。
 */
export function createUpdateReloader(opts: { getScreenName: () => string; reload: () => void }) {
  let ready = false;
  let reloaded = false;

  function tryReload() {
    if (!ready || reloaded || !isSafeToReload(opts.getScreenName())) return;
    reloaded = true;
    opts.reload();
  }

  return {
    markUpdateReady() {
      ready = true;
      tryReload();
    },
    onScreenChange: tryReload,
  };
}

/** 実際の端末で、更新の反映を有効にする(アプリの起動時に1度だけ呼ぶ) */
export function setupAppUpdate(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const container = navigator.serviceWorker;

  const reloader = createUpdateReloader({
    getScreenName: () => useNavigationStore.getState().screen.name,
    reload: () => window.location.reload(),
  });
  useNavigationStore.subscribe(reloader.onScreenChange);

  // 初めてアプリを入れたとき(それまで動いていたサービスワーカーがない)は、入れ替わりではないので読み込み直さない
  const hadController = container.controller !== null;
  container.addEventListener("controllerchange", () => {
    if (hadController) reloader.markUpdateReady();
  });

  // アプリを開いたままにしている端末でも、画面に戻ったときに、新しい版がないか確認する
  let lastCheckedAt: number | null = Date.now();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !shouldCheckForUpdate(lastCheckedAt, Date.now())) return;
    lastCheckedAt = Date.now();
    void container
      .getRegistration()
      .then((registration) => registration?.update())
      .catch(() => {
        // オフラインなどで確認できないときは、次の機会に確認する
      });
  });
}
