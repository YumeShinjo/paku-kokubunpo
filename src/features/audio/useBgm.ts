import { useEffect } from "react";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useSettingsStore } from "@/app/store/settingsStore";
import { findBgm } from "@/assets/registry";
import { playBgm, stopBgm } from "@/lib/audio";
import { sceneForScreen } from "./bgmScene";

/**
 * 画面が変わるたびに、その場面のBGMへ切り替える(曲が同じなら途切れない)。
 * BGM素材が1つも置かれていなければ何も鳴らさない。音の解禁(9章)前は鳴らさず、
 * 解禁された時点でいまの場面の曲を鳴らし始める。
 */
export function useBgm(): void {
  const screen = useNavigationStore((s) => s.screen);
  const audioUnlocked = useSettingsStore((s) => s.audioUnlocked);

  useEffect(() => {
    if (!audioUnlocked) return;
    const url = findBgm(sceneForScreen(screen));
    if (url) playBgm(url);
    else stopBgm();
  }, [screen, audioUnlocked]);
}
