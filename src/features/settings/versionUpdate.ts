/**
 * 「最新の版をたしかめる」で、新しい版が見つかったときの、更新の準備。
 * Service Worker に、更新の確認を促し(新しい版を取りに行かせ)、新しい版に切り替わるまで、少しだけ待つ(最長 maxWaitMs)。
 * そのあと、呼び出し側が、画面を読み込み直す。Service Worker がない環境(テスト・古いブラウザ)では、何もせずに戻る。
 * 失敗しても、読み込み直しは止めない(例外は投げない)。
 */
export async function prepareServiceWorkerUpdate(maxWaitMs = 4000): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;
    const switched = new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
    });
    await registration.update();
    await Promise.race([switched, new Promise<void>((resolve) => setTimeout(resolve, maxWaitMs))]);
  } catch {
    // 更新の準備に失敗しても、読み込み直しは行う
  }
}
