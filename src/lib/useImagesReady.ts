import { useEffect, useState } from "react";

/** 読み込みが終わらなくても、これだけ待ったら「準備できた」として扱う(ミリ秒。通信が詰まっても、案内が薄いままにならないように) */
export const IMAGES_READY_TIMEOUT_MS = 10_000;

/**
 * 画像がすべて読み込まれたか。読み込みに失敗した画像も「終わった」として数える(壊れた画像のせいで、ずっと待たない)。
 * urls が空なら、すぐ true。
 */
export function useImagesReady(urls: readonly string[]): boolean {
  const key = urls.join("\n");
  const [ready, setReady] = useState(urls.length === 0);

  useEffect(() => {
    const list = key === "" ? [] : key.split("\n");
    if (list.length === 0) {
      setReady(true);
      return;
    }
    setReady(false);
    let cancelled = false;
    let remaining = list.length;
    const finish = () => {
      if (!cancelled) setReady(true);
    };
    const settle = () => {
      remaining -= 1;
      if (remaining <= 0) finish();
    };
    const images = list.map((url) => {
      const image = new Image();
      image.onload = settle;
      image.onerror = settle;
      image.src = url;
      return image;
    });
    const timer = setTimeout(finish, IMAGES_READY_TIMEOUT_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      for (const image of images) {
        image.onload = null;
        image.onerror = null;
      }
    };
  }, [key]);

  return ready;
}
