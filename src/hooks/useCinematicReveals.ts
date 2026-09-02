import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "../lib/gsap";
import { prefersReducedMotion } from "../lib/scroll";

/**
 * Shared cinematic reveal system for editorial sections.
 * Markup contract (all opt-in via data attributes):
 *
 *   [data-lines]   wrapper whose [data-line] children slide up
 *                  out of overflow masks, staggered (play-once).
 *   [data-fade]    element fades + rises into view (play-once).
 *   [data-clip]    image container: clip-path inset reveal, while its
 *                  [data-clip-img] child de-scales (play-once), then
 *                  continues with a slow scrubbed drift.
 *   [data-grow]    hairline that draws itself horizontally.
 *
 * All motion is disabled under prefers-reduced-motion.
 */
export function useCinematicReveals(scopeRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!scope || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(scope);

      /* — masked line reveals — */
      q<HTMLElement>("[data-lines]").forEach((wrap) => {
        const lines = wrap.querySelectorAll<HTMLElement>("[data-line]");
        if (!lines.length) return;
        gsap.fromTo(
          lines,
          { yPercent: 118 },
          {
            yPercent: 0,
            duration: 1.35,
            ease: "power4.out",
            stagger: 0.11,
            scrollTrigger: { trigger: wrap, start: "top 84%", once: true },
          },
        );
      });

      /* — soft fades — */
      q<HTMLElement>("[data-fade]").forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 34 },
          {
            opacity: 1,
            y: 0,
            duration: 1.25,
            ease: "power3.out",
            delay: Number(el.dataset.fade ?? 0),
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          },
        );
      });

      /* — hairline draws — */
      q<HTMLElement>("[data-grow]").forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1.6,
            ease: "power3.inOut",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          },
        );
      });

      /* — clipped cinematic image reveals + slow drift — */
      q<HTMLElement>("[data-clip]").forEach((wrap) => {
        const img = wrap.querySelector<HTMLElement>("[data-clip-img]");
        gsap.fromTo(
          wrap,
          { clipPath: "inset(14% 8% 14% 8%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.7,
            ease: "power3.inOut",
            scrollTrigger: { trigger: wrap, start: "top 80%", once: true },
          },
        );
        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.24 },
            {
              scale: 1.06,
              duration: 2.1,
              ease: "power2.out",
              scrollTrigger: { trigger: wrap, start: "top 80%", once: true },
            },
          );
          gsap.fromTo(
            img,
            { yPercent: -4 },
            {
              yPercent: 4,
              ease: "none",
              scrollTrigger: {
                trigger: wrap,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        }
      });
    }, scope);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
