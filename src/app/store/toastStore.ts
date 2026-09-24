import { create } from "zustand";
import type { SeKind } from "@/lib/audio";
import type { MascotExpression } from "@/assets/registry";

/**
 * 画面の隅に出す短い通知(トースト)の順番待ち。
 * ステージのクリア画面で積んでおき、マップ・ステージ選択画面に戻ってから、1つずつ表示する
 * (Toaster コンポーネント。表示の出だしに、対応する効果音を鳴らす)。端末には保存しない。
 */
export interface Toast {
  id: number;
  icon: string;
  message: string;
  se: SeKind;
  /** マスコットの表情(素材があれば、アイコンの代わりに出す) */
  face?: MascotExpression;
}

/** エリアクリアで出す通知の内容 */
export const TOAST_CONTENT = {
  growth: { icon: "✨", message: "成長[せいちょう]したよ!", se: "growth", face: "surprised" },
  pageUnlock: { icon: "📖", message: "図鑑[ずかん]が増[ふ]えたよ!", se: "pageUnlock" },
} as const satisfies Record<string, Omit<Toast, "id">>;

interface ToastState {
  queue: Toast[];
  push: (...kinds: (keyof typeof TOAST_CONTENT)[]) => void;
  shift: () => Toast | undefined;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  queue: [],
  push: (...kinds) =>
    set((s) => ({ queue: [...s.queue, ...kinds.map((k) => ({ id: nextId++, ...TOAST_CONTENT[k] }))] })),
  shift: () => {
    const [first, ...rest] = get().queue;
    if (first) set({ queue: rest });
    return first;
  },
}));
