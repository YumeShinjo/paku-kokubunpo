import { useEffect } from "react";
import { BookOpen, Footprints, Leaf, ListChecks, Star, TreePine, type LucideIcon } from "lucide-react";
import { howToCards, howToFooter, type HowToIcon } from "@/data/howTo";
import { useNavigationStore } from "@/app/store/navigationStore";
import { BackButton } from "@/components/BackButton";
import { Rb } from "@/components/Rb";

const ICONS: Record<HowToIcon, LucideIcon> = {
  start: Footprints,
  quiz: ListChecks,
  leaf: Leaf,
  book: BookOpen,
  star: Star,
  forest: TreePine,
};

/**
 * 「あそびかた」画面(ホームの右上の「?」から開く)。アプリ全体の流れを、短いカード6枚で説明する。
 * 問題の形ごとの操作の説明は、初回に出る案内(設定からもう一度見られる)が受け持つ。
 */
export function HowToScreen() {
  const goTo = useNavigationStore((s) => s.goTo);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="screen screen-howto">
      <BackButton onClick={() => goTo({ name: "title" })} />
      <h2>あそびかた</h2>
      <ol className="howto-list">
        {howToCards.map((card, index) => {
          const Icon = ICONS[card.icon];
          return (
            <li key={card.id} className="howto-card">
              <span className="howto-badge" aria-hidden="true">
                <Icon size={22} />
              </span>
              <div className="howto-text">
                <h3 className="howto-title">
                  <span className="howto-number">{index + 1}.</span> <Rb t={card.title} />
                </h3>
                <p className="howto-body">
                  <Rb t={card.body} />
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="howto-footer">
        <Rb t={howToFooter} />
      </p>
    </div>
  );
}
