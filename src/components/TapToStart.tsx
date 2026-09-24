import { unlockPlayback } from "@/lib/audio";
import { Mascot } from "@/features/mascot/Mascot";

/**
 * 起動直後、タイトル画面の前に挟む1枚の導入画面(9章)。
 * このタップ(クリック)の中で音声の解禁(BGMの開始を含む)を完了させてから、タイトル画面を出す。
 * これで、タイトル画面のどのボタンを最初に押しても、解禁済みであることを保証できる。
 * iOSは pointerdown / touchstart を有効なユーザー操作と認めないので、click で解禁する
 * (ボタンなので、キーボードの Enter / Space でも click になる)。
 */
export function TapToStart() {
  return (
    <button type="button" data-no-tap className="tap-to-start" onClick={unlockPlayback}>
      <span className="tap-to-start-name">パクっと国文法</span>
      <Mascot />
      <span className="tap-to-start-hint">タップして はじめる</span>
    </button>
  );
}
