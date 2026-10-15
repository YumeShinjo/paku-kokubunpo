import { useEffect, useState } from "react";
import { BookOpen, Check, Leaf, Lock } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Rb } from "@/components/Rb";
import { useNavigationStore } from "@/app/store/navigationStore";
import { shouldShowEntryFirst, useKotonohaStore } from "@/app/store/kotonohaStore";
import { getAllIdiomQuestions } from "@/data/kotowaza";
import { KOTONOHA_ABOUT } from "@/data/kotonohaAbout";
import { Ruby } from "@/components/Ruby";
import { rb } from "@/data/ruby";
import { KotonohaBackground } from "@/features/kotonoha/KotonohaBackground";
import { KotonohaScene } from "@/features/kotonoha/KotonohaScene";
import { SCOPE_LABELS, questionsInScope, type KotonohaScope } from "@/features/kotonoha/selectRound";
import { KOTONOHA_LOCKED_MESSAGE, useKotonohaUnlocked } from "@/features/kotonoha/unlock";
import { SceneBubble, SceneBubbles } from "@/features/kotonoha/SceneBubbles";
import { pickEntryRepeat, roundStartSceneId, YURAI_SCENES, type SceneId } from "@/data/yuraiScenes";

const SCOPES: KotonohaScope[] = ["all", "kotowaza", "koji"];

/**
 * 初めて入ったとき(entry_first): ユライ → コト → ユライ → コトの4行を、タップで1行ずつ進める。「スキップ」で、すぐ終える。
 * 「つぎへ」「スキップ」は、どちらも高さ44px以上。
 */
function EntryFirst({ onDone }: { onDone: () => void }) {
  const lines = YURAI_SCENES.entry_first;
  const [index, setIndex] = useState(0);
  const last = index + 1 >= lines.length;
  return (
    <div className="scene-dialogue" data-scene="entry_first">
      <div className="scene-tap-area" onClick={() => (last ? onDone() : setIndex(index + 1))}>
        <SceneBubble key={index} line={lines[index]} />
      </div>
      <div className="scene-actions">
        <button type="button" className="scene-next" onClick={() => (last ? onDone() : setIndex(index + 1))}>
          {last ? "おわり" : "つぎへ"}
        </button>
        <button type="button" className="scene-skip" onClick={onDone}>
          スキップ
        </button>
      </div>
    </div>
  );
}

/**
 * 言の葉の森の入口の画面。本編とは別枠のミニゲーム(ことわざ・故事成語の穴埋め)。
 * 出題の範囲(すべて・ことわざ・故事成語)を選んで、1ラウンド(10問)を始める。集めた葉の数(N / 80)も出す。
 */
export function KotonohaScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const unlocked = useKotonohaUnlocked();
  const collectedIds = useKotonohaStore((s) => s.collectedIds);
  const markEntered = useKotonohaStore((s) => s.markEntered);
  const setLastEntryScene = useKotonohaStore((s) => s.setLastEntryScene);
  const markEntryFirstSeen = useKotonohaStore((s) => s.markEntryFirstSeen);
  // 出題の範囲。ボタンは「選ぶ」だけ(選んだものが分かる)。「すすむ」を押したときに、ラウンドが始まる
  const [scope, setScope] = useState<KotonohaScope>("all");
  const [scopeTouched, setScopeTouched] = useState(false);
  // 初回(入口の4行を、まだ最後まで見ていない)か、2回目以降か。画面を開いた時点の状態で決める。
  // 入場(enteredForest。図鑑のユライの解放)は、画面を開いたときに記録するが、初回の台詞を見終えた記録(seenEntryFirst)は、
  // 最後まで進めた・スキップしたときだけ。途中で抜けたら、次も初回の4行から出る。
  // 2回目以降は、3つの台詞からランダム。直前に出したものは避ける
  const [entry] = useState<SceneId>(() => {
    const state = useKotonohaStore.getState();
    return shouldShowEntryFirst(state) ? "entry_first" : pickEntryRepeat(state.lastEntryScene);
  });
  const [firstDone, setFirstDone] = useState(false);
  const all = getAllIdiomQuestions();
  const collected = new Set(collectedIds);
  const countIn = (scope: KotonohaScope) => questionsInScope(all, scope).filter((q) => collected.has(q.id)).length;

  // 遊べる状態で、森に入場したことを記録する(図鑑「なかまの ずかん」で、ユライが解放される)
  useEffect(() => {
    if (!unlocked) return;
    markEntered();
    if (entry !== "entry_first") setLastEntryScene(entry);
  }, [unlocked, markEntered, setLastEntryScene, entry]);
  const showingFirst = entry === "entry_first" && !firstDone;

  return (
    <div className="screen screen-kotonoha screen-kotonoha-entry">
      <KotonohaBackground />
      {/* 「もどる」と見出しを、1行に並べる(説明文と「すすむ」を足しても、縦にスクロールしないよう、高さを詰める) */}
      <div className="kotonoha-entry-head">
        <BackButton onClick={() => goTo({ name: "title" })} />
        <h2 className="kotonoha-title">
          <Rb t="言[こと]の葉[は]の森[もり]" />
        </h2>
      </div>
      {!unlocked ? (
        <p className="kotonoha-panel" role="status">
          <Lock aria-hidden="true" size={16} className="inline-icon" />
          {KOTONOHA_LOCKED_MESSAGE}
        </p>
      ) : (
        <>
          <KotonohaScene />
          {/* 本編との関係と、80まいそろったときに起こること。初回の会話とは別に、いつでも読める */}
          <p className="kotonoha-about">
            <Ruby text={rb(KOTONOHA_ABOUT)} />
          </p>
          {showingFirst ? (
            <EntryFirst
              onDone={() => {
                markEntryFirstSeen();
                setFirstDone(true);
              }}
            />
          ) : (
            <>
              {entry !== "entry_first" && !scopeTouched && <SceneBubbles sceneId={entry} />}
              {/* 範囲を選ぶと、入口の一言のかわりに、その範囲のユライの一言が出る(まだ、ラウンドは始まらない。画面が縦に伸びない) */}
              {scopeTouched && <SceneBubbles sceneId={roundStartSceneId(scope)} />}
              <ul className="kotonoha-scope-list" role="radiogroup" aria-label="出題の範囲">
                {SCOPES.map((item) => {
                  const total = questionsInScope(all, item).length;
                  const selected = item === scope;
                  return (
                    <li key={item}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={selected ? "is-selected" : ""}
                        onClick={() => {
                          setScope(item);
                          setScopeTouched(true);
                        }}
                      >
                        <span className="kotonoha-scope-mark" aria-hidden="true">
                          {selected && <Check size={18} />}
                        </span>
                        <span className="kotonoha-scope-label">
                          <Rb t={SCOPE_LABELS[item]} />
                        </span>
                        <span className="kotonoha-scope-count">
                          {countIn(item)} / {total}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="kotonoha-start" onClick={() => goTo({ name: "kotonohaPlay", scope })}>
                すすむ
              </button>
              {/* 図鑑の「ことのは」へ。集めた葉の数も、ここに出す(葉が0枚でも、押せる)。初回の台詞が終わってから出る */}
              <button
                type="button"
                className="kotonoha-zukan-link"
                onClick={() => goTo({ name: "zukan", tab: "kotonoha", backTo: "kotonoha" })}
              >
                <BookOpen aria-hidden="true" size={18} />
                <span>ずかんを みる</span>
                <span className="kotonoha-leaf-count" aria-label={`集めた葉 ${countIn("all")} / ${all.length}`}>
                  <Leaf aria-hidden="true" size={16} />
                  <span>
                    {countIn("all")} / {all.length}
                  </span>
                </span>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
