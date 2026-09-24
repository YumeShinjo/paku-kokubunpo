import { useEffect, useRef, useState } from "react";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useToastStore, type Toast } from "@/app/store/toastStore";
import { duckBgm, playSe, seBusyRemainingMs, seDurationMs } from "@/lib/audio";
import { MascotFace } from "@/features/mascot/Mascot";
import { findImage, IMAGE } from "@/assets/registry";
import { Rb } from "@/components/Rb";

/** 通知が見えている時間と、次の通知までの間(ミリ秒) */
export const TOAST_VISIBLE_MS = 2500;
export const TOAST_GAP_MS = 400;

/**
 * 通知(トースト)の表示。マップ(エリア選択・ステージ選択)にいるあいだだけ、順番待ちの通知を1つずつ出す。
 * 出す瞬間にその通知の効果音を鳴らすので、音と表示がずれず、音どうしも重ならない
 * (前の効果音が鳴り終わってから出し、次の通知は、この通知の効果音と表示が終わってから出す)。
 * 画面の隅に置き、操作をふさがない(pointer-events: none)。2〜3秒で自動的に消える。
 */
export function Toaster() {
  const screenName = useNavigationStore((s) => s.screen.name);
  const queued = useToastStore((s) => s.queue.length);
  const shift = useToastStore((s) => s.shift);
  const onMap = screenName === "areaSelect" || screenName === "stageSelect";

  const [shown, setShown] = useState<Toast | null>(null);
  const [leaving, setLeaving] = useState(false);
  const busy = useRef(false); // 通知を出している(次の通知を待たせている)あいだ
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [recheck, setRecheck] = useState(0);

  useEffect(() => {
    if (!onMap || busy.current || queued === 0) return;
    // 演出の効果音(クリア音など)が鳴っているあいだは、鳴り終わるのを待ってから出す
    const wait = seBusyRemainingMs();
    if (wait > 0) {
      const t = setTimeout(() => setRecheck((n) => n + 1), wait + 50);
      return () => clearTimeout(t);
    }
    const toast = shift();
    if (!toast) return;
    busy.current = true;
    setShown(toast);
    setLeaving(false);
    playSe(toast.se);
    const seMs = seDurationMs(toast.se);
    duckBgm(seMs);
    timers.current.push(setTimeout(() => setLeaving(true), TOAST_VISIBLE_MS));
    timers.current.push(
      setTimeout(
        () => {
          setShown(null);
          busy.current = false;
          setRecheck((n) => n + 1); // 次の通知があれば、続けて出す
        },
        Math.max(TOAST_VISIBLE_MS, seMs) + TOAST_GAP_MS,
      ),
    );
  }, [onMap, queued, recheck, shift]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );

  if (!shown) return null;
  return (
    <div className="toast-area" role="status" aria-live="polite">
      <div key={shown.id} className={`toast ${leaving ? "is-leaving" : ""}`.trim()}>
        {shown.face && findImage(IMAGE.mascotExpression(shown.face)) ? (
          <MascotFace expression={shown.face} size="small" />
        ) : (
          <span aria-hidden="true">{shown.icon}</span>
        )}{" "}
        <Rb t={shown.message} />
      </div>
    </div>
  );
}
