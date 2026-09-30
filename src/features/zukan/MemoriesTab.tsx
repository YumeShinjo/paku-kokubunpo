import { TitleBadge } from "@/components/TitleBadge";
import { Rb } from "@/components/Rb";
import { StoryArchive } from "@/features/zukan/StoryArchive";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useStoryStore } from "@/app/store/storyStore";
import { ENDING_CHOICE_EVENT_ID, getEndingTitle } from "@/data/titles";
import { buildEndingReplayScreen } from "@/features/story/storyFlow";

/**
 * ことだまの書の「おもいで」タブ。称号の表示、エンディングの見返し(ボタンと説明)、見終わったストーリーの見返し。
 * 見返しが終わったときは、このタブに戻る(画面の切り替え先に tab: "memories" を渡している)。
 */
export function MemoriesTab() {
  const goTo = useNavigationStore((s) => s.goTo);
  const choices = useStoryStore((s) => s.choices);
  const title = getEndingTitle(choices);
  // エンディングの分岐まで進んでいれば、見返せる(選びなおして称号を変えることもできる)
  const canReplayEnding = choices[ENDING_CHOICE_EVENT_ID] !== undefined;

  return (
    <>
      <p className="zukan-title">
        しょうごう:{" "}
        {title ? (
          <TitleBadge title={title} />
        ) : (
          <span className="zukan-title-none">
            ？？？(エンディングで てにはいるよ)
          </span>
        )}
      </p>
      {canReplayEnding && (
        <div className="zukan-replay">
          <button
            type="button"
            onClick={() => goTo(buildEndingReplayScreen("ohzaNoMa", { name: "zukan", tab: "memories" }))}
          >
            エンディングを もういちど 見る
          </button>
          <p className="settings-note">
            <Rb t="分[わ]かれ道[みち]で選[えら]びなおすと、称号[しょうごう]も変[か]わるよ。" />
          </p>
        </div>
      )}
      <StoryArchive />
    </>
  );
}
