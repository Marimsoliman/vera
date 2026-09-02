export interface CinematicSceneData {
  id: "city" | "building" | "interior";
  src: string;
  poster: string;
  index: string;
  title: string;
  caption: string;
  preload: "auto" | "none";
}

export const SCENES: CinematicSceneData[] = [
  {
    id: "city",
    index: "01",
    title: "THE CITY",
    caption: "Rising above the skyline, redefining modern luxury.",
    src: "/videos/Scene_01.mp4", // تم تعديلها إلى src بدلاً من videoSrc
    poster: "",
    preload: "auto",
  },
  {
    id: "building",
    index: "02",
    title: "THE BUILDING",
    caption: "Architectural precision sculpted for eternity.",
    src: "/videos/Scene_02.mp4", // أو اتركي مسار تجريبي إن لم يكن جاهزاً
    poster: "",
    preload: "none",
  },
  {
    id: "interior",
    index: "03",
    title: "THE INTERIOR",
    caption: "Where elevated living meets bespoke craftsmanship.",
    src: "/videos/Scene_03.mp4",
    poster: "",
    preload: "none",
  },
];