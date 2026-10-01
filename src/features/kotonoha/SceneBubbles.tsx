import { Rb } from "@/components/Rb";
import { SPEAKER_NAME, YURAI_SCENES, sceneRuby, type SceneId, type SceneLine } from "@/data/yuraiScenes";

/** ユライ・コトの吹き出し1つ(名前つき)。ユライは左、コトは右に寄せる */
export function SceneBubble({ line }: { line: SceneLine }) {
  return (
    <div className={`scene-bubble is-${line.speaker}`} data-speaker={line.speaker}>
      <span className="scene-bubble-name">{SPEAKER_NAME[line.speaker]}</span>
      <span className="scene-bubble-text">
        <Rb t={sceneRuby(line.text)} />
      </span>
    </div>
  );
}

/** 場面の台詞を、配列の順に、1行ずつ話者を分けて、同時に出す */
export function SceneBubbles({ sceneId, className = "" }: { sceneId: SceneId; className?: string }) {
  return (
    <div className={`scene-bubbles ${className}`.trim()} data-scene={sceneId}>
      {YURAI_SCENES[sceneId].map((line, i) => (
        <SceneBubble key={i} line={line} />
      ))}
    </div>
  );
}
