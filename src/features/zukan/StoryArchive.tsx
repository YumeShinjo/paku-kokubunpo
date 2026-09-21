import { buildStoryArchive, countReplayableStories } from "@/features/story/storyArchive";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useStoryStore } from "@/app/store/storyStore";

/**
 * ことだまの書の「おもいで」。見終わったストーリーを、いつでも見返せる。
 * 見返すと、終わったあとはことだまの書に戻る。まだ見ていないストーリーは表示しない。
 */
export function StoryArchive() {
  const goTo = useNavigationStore((s) => s.goTo);
  const seenStoryIds = useStoryStore((s) => s.seenStoryIds);

  const groups = buildStoryArchive(seenStoryIds);
  const seenCount = groups.reduce((n, g) => n + g.entries.length, 0);

  return (
    <section className="zukan-memories">
      <h3>おもいで(ストーリー)</h3>
      <p className="zukan-pages-lead">
        みた ストーリーを、もういちど 見られるよ。({seenCount} / {countReplayableStories()})
      </p>
      {groups.length === 0 ? (
        <p className="zukan-page-locked">まだ ストーリーを みていないよ。</p>
      ) : (
        groups.map((group) => (
          <details key={group.areaId} className="zukan-page">
            <summary>📜 {group.areaName}</summary>
            <ul className="memory-list">
              {group.entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => goTo({ name: "story", eventId: entry.id, next: { name: "zukan" } })}
                  >
                    {entry.label}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </section>
  );
}
