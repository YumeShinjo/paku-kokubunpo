import { useEffect } from "react";
import { getEndingTitle } from "@/data/titles";
import { endingResultId } from "@/features/story/storyIds";
import { Mascot } from "@/features/mascot/Mascot";
import { TitleBadge } from "@/components/TitleBadge";
import { playSe } from "@/lib/audio";
import { useNavigationStore, type Screen } from "@/app/store/navigationStore";
import { useStoryStore } from "@/app/store/storyStore";

/**
 * エンディング後の結果画面。王座の間の分岐での選択に応じた称号(二つ名)を授与する(2章)。
 * 見終わったら(つぎへ)視聴済みにして、クレジットなど次の画面へ進む。
 */
export function EndingResultScreen({ areaId, next }: { areaId: string; next: Screen }) {
  const goTo = useNavigationStore((s) => s.goTo);
  const choices = useStoryStore((s) => s.choices);
  const markSeen = useStoryStore((s) => s.markSeen);
  const title = getEndingTitle(choices);

  useEffect(() => {
    playSe("subBossClear");
  }, []);

  function finish() {
    markSeen(endingResultId(areaId));
    goTo(next);
  }

  return (
    <div className="screen screen-ending-result">
      <h2>エンディング おつかれさま!</h2>
      <Mascot form="true" />
      {title ? (
        <>
          <p>しょうごう(二つ名)を てにいれた!</p>
          <p className="ending-title">
            <TitleBadge title={title} />
          </p>
          <p className="ending-title-reason">{title.reason}ので、この二つ名がついたよ。</p>
        </>
      ) : (
        <p>コトノハおうこくに ことばが もどったよ!</p>
      )}
      <button type="button" onClick={finish}>
        つぎへ
      </button>
    </div>
  );
}
