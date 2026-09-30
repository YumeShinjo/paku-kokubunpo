import { Leaf, Lock } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Rb } from "@/components/Rb";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useKotonohaStore } from "@/app/store/kotonohaStore";
import { getAllIdiomQuestions } from "@/data/kotowaza";
import { KotonohaBackground } from "@/features/kotonoha/KotonohaBackground";
import { KotonohaScene } from "@/features/kotonoha/KotonohaScene";
import { SCOPE_LABELS, questionsInScope, type KotonohaScope } from "@/features/kotonoha/selectRound";
import { KOTONOHA_LOCKED_MESSAGE, useKotonohaUnlocked } from "@/features/kotonoha/unlock";
import { YuraiBubble } from "@/features/kotonoha/Yurai";

const SCOPES: KotonohaScope[] = ["all", "kotowaza", "koji"];

/**
 * 言の葉の森の入口の画面。本編とは別枠のミニゲーム(ことわざ・故事成語の穴埋め)。
 * 出題の範囲(すべて・ことわざ・故事成語)を選んで、1ラウンド(10問)を始める。集めた葉の数(N / 80)も出す。
 */
export function KotonohaScreen() {
  const goTo = useNavigationStore((s) => s.goTo);
  const unlocked = useKotonohaUnlocked();
  const collectedIds = useKotonohaStore((s) => s.collectedIds);
  const all = getAllIdiomQuestions();
  const collected = new Set(collectedIds);
  const countIn = (scope: KotonohaScope) => questionsInScope(all, scope).filter((q) => collected.has(q.id)).length;

  return (
    <div className="screen screen-kotonoha">
      <KotonohaBackground />
      <BackButton onClick={() => goTo({ name: "title" })} />
      <h2 className="kotonoha-title">
        <Rb t="言[こと]の葉[は]の森[もり]" />
      </h2>
      {!unlocked ? (
        <p className="kotonoha-panel" role="status">
          <Lock aria-hidden="true" size={16} className="inline-icon" />
          {KOTONOHA_LOCKED_MESSAGE}
        </p>
      ) : (
        <>
          <KotonohaScene />
          <YuraiBubble>
            <Rb t="ことわざや 故事成語[こじせいご]を、あそびながら おぼえていこう。" />
          </YuraiBubble>
          <p className="kotonoha-leaf-count" aria-label={`集めた葉 ${countIn("all")} / ${all.length}`}>
            <Leaf aria-hidden="true" size={18} className="inline-icon" />
            <span>
              {countIn("all")} / {all.length}
            </span>
          </p>
          <ul className="kotonoha-scope-list">
            {SCOPES.map((scope) => {
              const total = questionsInScope(all, scope).length;
              return (
                <li key={scope}>
                  <button type="button" onClick={() => goTo({ name: "kotonohaPlay", scope })}>
                    <span className="kotonoha-scope-label">
                      <Rb t={SCOPE_LABELS[scope]} />
                    </span>
                    <span className="kotonoha-scope-count">
                      {countIn(scope)} / {total}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
