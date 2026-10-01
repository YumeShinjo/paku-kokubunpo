import { create } from "zustand";
import type { KotonohaScope } from "@/features/kotonoha/selectRound";

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
  /**
   * ことだまの書。tab は、開くタブのid(features/zukan/zukanTabs.ts)。省略すると「せいとう」。
   * backTo は、「もどる」の戻り先(遷移元に合わせる)。省略すると、ホーム画面。いまは、言の葉の森の入口から開いたとき("kotonoha")だけ
   */
  | { name: "zukan"; tab?: string; backTo?: "kotonoha" }
  /** 言の葉の森(ことわざ・故事成語のミニゲーム)の入口 / 出題(1ラウンド10問)。scope は出題の範囲 */
  | { name: "kotonoha" }
  | { name: "kotonohaPlay"; scope: KotonohaScope }
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
  | { name: "credits"; next: Screen; areaId?: string; ending?: boolean }
  /** プライバシーポリシー。もどるボタンで next へ戻る */
  | { name: "privacy"; next: Screen };

interface NavigationState {
  screen: Screen;
  goTo: (screen: Screen) => void;
  /**
   * 最初の「タッチして はじめる」画面を、もう一度出しているか。音声を解禁したあとでも、ホーム画面の
   * 「タイトルへもどる」で出せる。ブラウザの履歴(pushState)は使わないので、ブラウザの戻る操作とは干渉しない。
   * 端末には保存しない(アプリを開き直せば、解禁前の最初の画面から始まる)。
   */
  splashOpen: boolean;
  openSplash: () => void;
  closeSplash: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  screen: { name: "title" },
  goTo: (screen) => set({ screen }),
  splashOpen: false,
  openSplash: () => set({ splashOpen: true }),
  closeSplash: () => set({ splashOpen: false }),
}));
