// src/data/scenes.ts
export interface CinematicSceneData {
  id: string;
  index: string;
  title: string;
  caption: string;
  folder: string;
  frameCount: number;
}

export const FRAME_COUNT = 176;

export const SCENES: CinematicSceneData[] = [
  {
    id: "scene-1",
    index: "01",
    title: "ARCHITECTURAL VISION",
    caption: "Sculpted geometry meets natural light in an elevated living sanctuary.",
    folder: "/frames/scene1",
    frameCount: FRAME_COUNT,
  },
  {
    id: "scene-2",
    index: "02",
    title: "TIMELESS TEXTURES",
    caption: "Raw travertine, brushed metals, and bespoke organic materials.",
    folder: "/frames/scene2",
    frameCount: FRAME_COUNT,
  },
  {
    id: "scene-3",
    index: "03",
    title: "ELEVATED HORIZONS",
    caption: "Panoramic vistas designed to blur the boundary between inside and out.",
    folder: "/frames/scene3",
    frameCount: FRAME_COUNT,
  },
];

// Helper: بناء رابط الفريم
export const getFramePath = (folder: string, frameNumber: number): string => {
  return `${folder}/frame_${String(frameNumber).padStart(4, "0")}.webp`;
};