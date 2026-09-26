import { create } from "zustand";

/**
 * 画面遷移用ストア。ステージ進行がエリア→ステージへの一直線フロー(3章)のため、
 * 現時点ではURLルーティングを導入せず、画面スタックで管理する軽量な構成にしている。
 */
export type Screen =
  | { name: "title" }
  | { name: "areaSelect" }
  | { name: "stageSelect"; areaId: string }
  | { name: "stage"; areaId: string; stageId: string }
  | { name: "story"; eventId: string; next: Screen }
  | { name: "zukan" }
  | { name: "freePractice"; unitId: string }
  /** 苦手問題(星のついた問題)だけを集めた練習 */
  | { name: "reviewPractice" }
  | { name: "settings" }
  /** データの引き継ぎ: コードを発行する / コードを入れて復元する */
  | { name: "transferIssue" }
  | { name: "transferRestore" }
  | { name: "ranking" }
  /** エンディング後の称号授与。見終わると next へ進む */
  | { name: "endingResult"; areaId: string; next: Screen }
  /** クレジット。ending は「エンディング後」の表示(ねぎらいの一言を添える)。閉じると next へ進む */
  | { name: "credits"; next: Screen; areaId?: string; ending?: boolean };

interface NavigationState {
  screen: Screen;
  goTo: (screen: Screen) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  screen: { name: "title" },
  goTo: (screen) => set({ screen }),
}));
