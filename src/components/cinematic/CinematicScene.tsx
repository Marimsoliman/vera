// src/components/hero/CinematicScene.tsx
import { forwardRef, useEffect, useRef } from "react";
import { CinematicSceneData } from "../../data/scenes";

interface Props {
  scene: CinematicSceneData;
}

export interface CinematicSceneHandle {
  renderFrame: (index: number) => void;
  images: HTMLImageElement[];
}

const CinematicScene = forwardRef<HTMLCanvasElement, Props>(({ scene }, canvasRef) => {
  return (
    <div
      data-scene
      className="absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden will-change-[transform,opacity] [transform:translateZ(0)]"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full object-cover pointer-events-none select-none"
      />
    </div>
  );
});

CinematicScene.displayName = "CinematicScene";
export default CinematicScene;