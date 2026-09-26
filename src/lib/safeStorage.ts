import { create } from "zustand";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

/**
 * 端末への保存(進み具合・得点など)を、失敗しても、ゲームが止まらないようにする入れ物。
 *
 * ふつうの localStorage は、容量がいっぱいのとき・プライベートブラウズなどで書けないとき、書き込みで例外を投げる。
 * その例外が、ステージをクリアした瞬間などに出ると、画面が固まる。ここでは、
 *  - 書き込みに失敗しても、例外を投げず、「保存できていない」と知らせる(画面上部のお知らせ。下の StorageWarning)
 *  - 保存されていた内容が壊れていて読めないときは、消してしまう前に、別のキーへ退避して、最初の状態から始める
 * メモリ上の進み具合は、そのままアプリを使っているあいだは続くので、遊びは止まらない。
 */
interface StorageStatus {
  /** 直近の保存が失敗している */
  saveFailed: boolean;
  /** お知らせを閉じた(次に失敗するまで出さない) */
  dismissed: boolean;
  markFailed: () => void;
  markOk: () => void;
  dismiss: () => void;
}

export const useStorageStatus = create<StorageStatus>()((set) => ({
  saveFailed: false,
  dismissed: false,
  markFailed: () => set((s) => (s.saveFailed ? s : { saveFailed: true, dismissed: false })),
  markOk: () => set((s) => (s.saveFailed ? { saveFailed: false, dismissed: false } : s)),
  dismiss: () => set({ dismissed: true }),
}));

const safeLocalStorage: StateStorage = {
  getItem(name) {
    try {
      const raw = localStorage.getItem(name);
      if (raw === null) return null;
      try {
        JSON.parse(raw);
        return raw;
      } catch {
        // 壊れている。次の保存で上書きされて消えてしまう前に、別のキーへ退避しておく
        try {
          localStorage.setItem(`${name}:corrupt`, raw);
        } catch {
          // 退避できなくても、続ける
        }
        return null;
      }
    } catch {
      return null; // 保存の領域そのものが使えない
    }
  },
  setItem(name, value) {
    try {
      localStorage.setItem(name, value);
      useStorageStatus.getState().markOk();
    } catch {
      useStorageStatus.getState().markFailed();
    }
  },
  removeItem(name) {
    try {
      localStorage.removeItem(name);
    } catch {
      // 消せなくても、続ける
    }
  },
};

/** 各ストアの persist に渡す入れ物 */
export const safeJSONStorage = createJSONStorage(() => safeLocalStorage);
