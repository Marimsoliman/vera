// src/components/hero/CinematicScene.tsx
import { CinematicSceneData } from "../../data/scenes";

interface Props {
  scene: CinematicSceneData;
  priority?: boolean;
}

export default function CinematicScene({ scene }: Props) {
  return (
    <div
      data-scene
      className="absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden will-change-[transform,opacity] [transform:translateZ(0)]"
    >
      <video
        data-video
        src={scene.src}
        muted
        playsInline
        preload="auto"
        className="h-full w-full object-cover object-center pointer-events-none [transform:translateZ(0)]"
      />
    </div>
  );
}