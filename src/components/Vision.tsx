import { useRef } from "react";
import { useCinematicReveals } from "../hooks/useCinematicReveals";
import { VISION_STATS } from "../data/content";
import Eyebrow from "./ui/Eyebrow";

/**
 * 01 — THE VISION
 * First movement after the film: a hard editorial cut from the dark
 * hero into warm ivory. Oversized masked typography, a single image
 * study, and restraint everywhere else.
 */
export default function Vision() {
  const ref = useRef<HTMLElement>(null);
  useCinematicReveals(ref);

  return (
    <section id="vision" ref={ref} className="relative bg-ivory text-ink">
      <div className="mx-auto max-w-[110rem] px-6 py-28 md:px-12 md:py-44">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Eyebrow index="01" label="THE VISION" dark />
          <p className="eyebrow hidden text-smoke md:block" data-fade>
            MASTER-PLANNED · FUTURE-FORWARD
          </p>
        </div>

        {/* — editorial statement — */}
        <h2
          data-lines
          className="font-display mt-14 text-[clamp(3.2rem,10.5vw,10.5rem)] leading-[0.98] tracking-[0.05em] uppercase md:mt-20"
        >
          <span className="block overflow-hidden pb-1">
            <span data-line className="block">A CITY</span>
          </span>
          <span className="block overflow-hidden pb-1">
            <span data-line className="block md:pl-[12vw]">DESIGNED</span>
          </span>
          <span className="block overflow-hidden pb-2">
            <span data-line className="block">
              TO <span className="text-champagne">EVOLVE.</span>
            </span>
          </span>
        </h2>

        {/* — statement copy — */}
        <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-12 md:gap-8">
          <p
            className="font-display text-[1.35rem] leading-snug tracking-[0.02em] text-ink/90 md:col-span-5 md:text-[1.7rem]"
            data-fade
          >
            VÉRA is a development house composing complete urban districts — not
            towers, but a sequence of moments: the approach, the arrival, the reveal.
          </p>
          <div className="md:col-span-4 md:col-start-9">
            <p className="text-sm leading-relaxed tracking-[0.03em] text-smoke" data-fade="0.1">
              Every masterplan begins with restraint. Architecture is resolved
              slowly — proportion, material, light — until a building feels
              inevitable. Communities are then shaped around it: gardens before
              garages, people before traffic, legacy before launch.
            </p>
            <p className="mt-6 text-sm leading-relaxed tracking-[0.03em] text-smoke" data-fade="0.2">
              The result is a district engineered not for its opening day, but
              for the decades that follow it.
            </p>
          </div>
        </div>

        {/* — image study — */}
        <figure className="mt-20 md:mt-32">
          <div className="relative aspect-[4/3] overflow-hidden md:aspect-[21/9]" data-clip>
            <img
              src="/img/vision.jpg"
              alt="Travertine facade study at dusk"
              data-clip-img
              className="h-full w-full object-cover will-change-transform"
              loading="lazy"
              decoding="async"
            />
          </div>
          <figcaption className="mt-5 flex items-center justify-between" data-fade>
            <span className="eyebrow text-smoke">FACADE STUDY 07 — TRAVERTINE & LIGHT</span>
            <span className="eyebrow hidden text-champagne md:block">VÉRA ATELIER</span>
          </figcaption>
        </figure>

        {/* — figures — */}
        <div className="mt-20 grid gap-y-12 border-t border-ink/15 pt-12 md:mt-28 md:grid-cols-3 md:gap-8">
          {VISION_STATS.map((stat, i) => (
            <div key={stat.label} data-fade={`${i * 0.12}`}>
              <p className="font-display text-5xl tracking-[0.04em] text-ink md:text-6xl">
                {stat.value}
                <span className="ml-2 align-top text-xl text-champagne">{stat.unit}</span>
              </p>
              <p className="eyebrow mt-4 text-smoke">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
