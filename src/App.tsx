import { useEffect } from "react";
import { useNavigationStore, type Screen } from "@/app/store/navigationStore";
import { playSe } from "@/lib/audio";
import { useSettingsStore } from "@/app/store/settingsStore";
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
import { TransferIssueScreen } from "@/app/screens/TransferIssueScreen";
import { TransferRestoreScreen } from "@/app/screens/TransferRestoreScreen";
import { ReviewPracticeScreen } from "@/app/screens/ReviewPracticeScreen";
import { StorageWarning } from "@/components/StorageWarning";
import { MuteButton } from "@/components/MuteButton";
import { TapToStart } from "@/components/TapToStart";
import { Toaster } from "@/components/Toaster";

export default function App() {
  const screen = useNavigationStore((s) => s.screen);
  const audioUnlocked = useSettingsStore((s) => s.audioUnlocked);

  // 場面(画面)に合わせてBGMを切り替える。素材が置かれていなければ無音のまま。
  useBgm();

  // 9章: オフラインで貯めた得点は、起動時と、通信が戻ったときに自動でランキングへ送る(参加中のときだけ)
  useEffect(() => {
    void syncScore();
    const handleOnline = () => void syncScore();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
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

  // 9章: 起動直後は「タップしてはじめる」の1枚だけを出し、そのタップで音声を解禁してから、はじめて本編(タイトル画面)を出す。
  // audioUnlocked は端末には保存しないので、アプリを起動するたびにこの画面が出る。
  if (!audioUnlocked) return <TapToStart />;

  return (
    <>
      {renderScreen(screen)}
      <MuteButton />
      <Toaster />
      <StorageWarning />
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
    case "reviewPractice":
      return <ReviewPracticeScreen />;
    case "settings":
      return <SettingsScreen />;
    case "transferIssue":
      return <TransferIssueScreen />;
    case "transferRestore":
      return <TransferRestoreScreen />;
    case "ranking":
      return <RankingScreen />;
    case "endingResult":
      return <EndingResultScreen areaId={screen.areaId} next={screen.next} />;
    case "credits":
      return <CreditsScreen next={screen.next} areaId={screen.areaId} ending={screen.ending} />;
  }
}
