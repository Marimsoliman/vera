import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let lenis: Lenis | null = null;

/** Initialise the global smooth-scroll instance (idempotent). */
export function createLenis(): Lenis | null {
  if (lenis || prefersReducedMotion()) return lenis;

  lenis = new Lenis({
    duration: 1.35,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.4,
  });

  lenis.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return lenis;
}

export function destroyLenis() {
  lenis?.destroy();
  lenis = null;
}

export function getLenis() {
  return lenis;
}

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Cinematic smooth scroll to any selector / element. */
export function scrollToTarget(target: string | HTMLElement, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, {
      offset,
      duration: 1.9,
      easing: easeOutExpo,
    });
    return;
  }
  const el =
    typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
