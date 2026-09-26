import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useToastStore, type Toast } from "@/app/store/toastStore";
import { duckBgm, playSe, seBusyRemainingMs, seDurationMs } from "@/lib/audio";
import { MascotFace } from "@/features/mascot/Mascot";
import { findImage, IMAGE } from "@/assets/registry";
import { Rb } from "@/components/Rb";

/** 通知が見えている時間と、次の通知までの間(ミリ秒) */
export const TOAST_VISIBLE_MS = 2500;
export const TOAST_GAP_MS = 400;
/** 消えるアニメーションの長さ(global.css の toast-out と合わせる) */
const TOAST_LEAVE_MS = 300;
/** 上へこれだけ動かしたらスワイプとみなす / これより小さい動きはタップとみなす */
const SWIPE_DISMISS_PX = 30;
const TAP_SLOP_PX = 8;

/**
 * 通知(トースト)の表示。マップ(エリア選択・ステージ選択)にいるあいだだけ、順番待ちの通知を1つずつ出す。
 * 出す瞬間にその通知の効果音を鳴らすので、音と表示がずれず、音どうしも重ならない
 * (前の効果音が鳴り終わってから出し、次の通知は、この通知の効果音と表示が終わってから出す)。
 * 2〜3秒で自動的に消える。上へスワイプ(またはタップ)すると、すぐに消せる。
 * 通知の外側は操作をふさがない(pointer-events: none)。通知そのものだけが触れる。
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

  /** 上へスワイプ(またはタップ)で、待たずに消す。表示のあとの間(TOAST_GAP_MS)は、そのまま守る */
  function dismiss() {
    if (!busy.current || leaving) return;
    timers.current.forEach(clearTimeout);
    timers.current = [
      setTimeout(() => {
        setShown(null);
        busy.current = false;
        setRecheck((n) => n + 1);
      }, TOAST_LEAVE_MS + TOAST_GAP_MS),
    ];
    setDrag(0);
    setLeaving(true);
  }

  const [drag, setDrag] = useState(0); // 指で引き上げている量(px。上方向が負)
  const start = useRef<{ y: number; id: number } | null>(null);
  function onPointerDown(e: PointerEvent) {
    start.current = { y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: PointerEvent) {
    if (!start.current || start.current.id !== e.pointerId) return;
    setDrag(Math.min(0, e.clientY - start.current.y));
  }
  function onPointerUp(e: PointerEvent) {
    if (!start.current || start.current.id !== e.pointerId) return;
    const dy = e.clientY - start.current.y;
    start.current = null;
    if (dy <= -SWIPE_DISMISS_PX || Math.abs(dy) < TAP_SLOP_PX) dismiss(); // 上へのスワイプ、またはタップ
    else setDrag(0);
  }

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
      <div
        key={shown.id}
        className={`toast ${leaving ? "is-leaving" : ""}`.trim()}
        style={drag ? { transform: `translateY(${drag}px)`, opacity: Math.max(0.3, 1 + drag / 120) } : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null;
          setDrag(0);
        }}
      >
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
