import { useState } from "react";
import { useNavigationStore } from "@/app/store/navigationStore";
import { useTutorialStore } from "@/app/store/tutorialStore";
import { EngineGuide } from "@/features/quiz/EngineGuide";
import { resolveZukanTab, visibleZukanTabs, type ZukanTab } from "@/features/zukan/zukanTabs";
import { ZukanTabBar } from "@/features/zukan/ZukanTabBar";
import { BackButton } from "@/components/BackButton";

/**
 * ことだまの書(図鑑)。長くなるので、タブで分ける(定義は features/zukan/zukanTabs.ts):
 *  - せいとうりつ: 単元ごとの正答率(行をタップで、その単元の自由練習へ)
 *  - ぶんぽう(ぶんぽうの ずかん): 文法のことばのまとめページ(バトル中の「ずかん」と同じ内容)
 *  - おもいで: 称号、エンディングの見返し、見終わったストーリーの見返し
 * 開いたときは「せいとうりつ」。選んだタブは、この画面を離れるまで覚えている(端末には保存しない)。
 * 見返しなどから戻るときは、画面の切り替え先に tab を渡して、同じタブを開く。
 * tabs は、テスト用に差し替えられる(中身のないタブが出ないことの確認など)。
 */
export function ZukanScreen({
  initialTab,
  backTo,
  tabs: allTabs,
}: {
  initialTab?: string;
  /** 「もどる」の戻り先。省略すると、ホーム画面 */
  backTo?: "kotonoha";
  tabs?: readonly ZukanTab[];
}) {
  const goTo = useNavigationStore((s) => s.goTo);
  const guideSeen = useTutorialStore((s) => s.seenGuides.includes("zukan"));
  const markGuideSeen = useTutorialStore((s) => s.markSeen);
  const tabs = visibleZukanTabs(allTabs);
  const [selected, setSelected] = useState(() => resolveZukanTab(initialTab, tabs));
  // 表示するタブが変わって、選んでいたタブがなくなったときは、既定のタブにもどす
  const current = resolveZukanTab(selected, tabs);
  const Panel = tabs.find((t) => t.id === current)?.Panel;

  function select(id: string) {
    if (id === current) return;
    setSelected(id);
    // タブを切り替えたら、スクロール位置は先頭にもどす
    try {
      window.scrollTo(0, 0);
    } catch {
      /* スクロールできない環境(テストなど)では何もしない */
    }
  }

  return (
    <div className="screen screen-zukan">
      <BackButton onClick={() => goTo(backTo === "kotonoha" ? { name: "kotonoha" } : { name: "title" })} />
      <h2>
        ことだまの書
      </h2>
      {/* 初回だけ、使い方を出す(設定の「操作の説明をもう一度見る」でもう一度出せる) */}
      {!guideSeen && <EngineGuide guideKey="zukan" onDismiss={() => markGuideSeen("zukan")} />}
      <ZukanTabBar tabs={tabs} selected={current} onSelect={select} />
      <div className="zukan-panel" role="tabpanel" id={`zukan-panel-${current}`} aria-labelledby={`zukan-tab-${current}`}>
        {Panel && <Panel />}
      </div>
    </div>
  );
}
