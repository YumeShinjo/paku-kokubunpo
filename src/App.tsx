import { useEffect } from "react";
import { useNavigationStore, type Screen } from "@/app/store/navigationStore";
import { playSe, unlockPlayback } from "@/lib/audio";
import { useBgm } from "@/features/audio/useBgm";
import { TitleScreen } from "@/app/screens/TitleScreen";
import { AreaSelectScreen } from "@/app/screens/AreaSelectScreen";
import { StageSelectScreen } from "@/app/screens/StageSelectScreen";
import { StageScreen } from "@/app/screens/StageScreen";
import { StoryScreen } from "@/app/screens/StoryScreen";
import { SettingsScreen } from "@/app/screens/SettingsScreen";
import { ZukanScreen } from "@/app/screens/ZukanScreen";
import { FreePracticeScreen } from "@/app/screens/FreePracticeScreen";
import { EndingResultScreen } from "@/app/screens/EndingResultScreen";
import { CreditsScreen } from "@/app/screens/CreditsScreen";
import { RankingScreen } from "@/app/screens/RankingScreen";
import { syncScore } from "@/features/ranking/scoreSync";
import { MuteButton } from "@/components/MuteButton";

export default function App() {
  const screen = useNavigationStore((s) => s.screen);

  // 場面(画面)に合わせてBGMを切り替える。素材が置かれていなければ無音のまま。
  useBgm();

  // 9章: オフラインで貯めた得点は、起動時と、通信が戻ったときに自動でランキングへ送る(参加中のときだけ)
  useEffect(() => {
    void syncScore();
    const handleOnline = () => void syncScore();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // 9章: モバイルの音声自動再生制約対応の取りこぼし防止。
  // タイトル画面のボタンで明示的にも解禁しているが、それ以外の要素が
  // 最初にタップされた場合に備え、アプリ全体で最初の1タップだけを拾って解禁する。
  useEffect(() => {
    const handleFirstPointer = () => unlockPlayback();
    window.addEventListener("pointerdown", handleFirstPointer, { once: true });
    return () => window.removeEventListener("pointerdown", handleFirstPointer);
  }, []);

  // 7章: ボタンタップ音。画面ごとに鳴らす実装を散らすのではなく、
  // どのボタンが押されても共通で反応する委譲リスナーを1つだけ置く。
  // disabled なボタンはブラウザがそもそも click を発火しないので、ここで除外判定は不要。
  // ただし「こたえる」ボタンや選択式の選択肢のように、押した直後に
  // 正誤結果音(correct/incorrect)が鳴るボタンは data-no-tap を付けて二重に鳴らさない。
  useEffect(() => {
    function handleButtonClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest("button");
      if (button && !button.hasAttribute("data-no-tap")) {
        playSe("tap");
      }
    }
    document.addEventListener("click", handleButtonClick);
    return () => document.removeEventListener("click", handleButtonClick);
  }, []);

  return (
    <>
      {renderScreen(screen)}
      <MuteButton />
    </>
  );
}

function renderScreen(screen: Screen) {
  switch (screen.name) {
    case "title":
      return <TitleScreen />;
    case "areaSelect":
      return <AreaSelectScreen />;
    case "stageSelect":
      return <StageSelectScreen areaId={screen.areaId} />;
    case "stage":
      return <StageScreen key={screen.stageId} areaId={screen.areaId} stageId={screen.stageId} />;
    case "story":
      return <StoryScreen key={screen.eventId} eventId={screen.eventId} next={screen.next} />;
    case "zukan":
      return <ZukanScreen />;
    case "freePractice":
      return <FreePracticeScreen key={screen.unitId} unitId={screen.unitId} />;
    case "settings":
      return <SettingsScreen />;
    case "ranking":
      return <RankingScreen />;
    case "endingResult":
      return <EndingResultScreen areaId={screen.areaId} next={screen.next} />;
    case "credits":
      return <CreditsScreen next={screen.next} areaId={screen.areaId} ending={screen.ending} />;
  }
}
