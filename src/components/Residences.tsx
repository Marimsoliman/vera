import { useRef } from "react";
import { useCinematicReveals } from "../hooks/useCinematicReveals";
import { scrollToTarget } from "../lib/scroll";
import { RESIDENCES } from "../data/content";
import Eyebrow from "./ui/Eyebrow";
import ArrowLink from "./ui/ArrowLink";
import { cn } from "../utils/cn";

/**
 * 02 — RESIDENCES
 * Editorial alternating rows rather than a grid: each residence is a
 * full composition of image, index, name and spec — closer to a
 * printed folio than a listings page.
 */
export default function Residences() {
  const ref = useRef<HTMLElement>(null);
  useCinematicReveals(ref);

  return (
    <section id="residences" ref={ref} className="relative bg-ink text-ivory">
      <div className="mx-auto max-w-[110rem] px-6 py-28 md:px-12 md:py-44">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Eyebrow index="02" label="RESIDENCES" />
          <p className="eyebrow hidden text-ivory/40 md:block" data-fade>
            VILLAS · APARTMENTS · SIGNATURE SERIES
          </p>
        </div>

        <h2
          data-lines
          className="font-display mt-14 text-[clamp(2.8rem,8.5vw,8.5rem)] leading-[1.0] tracking-[0.05em] uppercase md:mt-20"
        >
          <span className="block overflow-hidden pb-1">
            <span data-line className="block">HOMES, HELD</span>
          </span>
          <span className="block overflow-hidden pb-2">
            <span data-line className="block md:pl-[14vw]">
              TO A <span className="text-champagne">HIGHER LINE.</span>
            </span>
          </span>
        </h2>

        <div className="mt-24 space-y-28 md:mt-36 md:space-y-40">
          {RESIDENCES.map((res, i) => {
            const flip = i % 2 === 1;
            return (
              <article
                key={res.index}
                className="group grid items-center gap-10 md:grid-cols-12 md:gap-8"
              >
                {/* image */}
                <div
                  className={cn(
                    "md:col-span-7",
                    flip && "md:order-2",
                  )}
                >
                  <div className="relative aspect-[16/10] overflow-hidden" data-clip>
                    <img
                      src={res.image}
                      alt={res.name}
                      data-clip-img
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-[1600ms] [transition-timing-function:var(--ease-cinematic)] will-change-transform group-hover:scale-[1.045]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-ink/10 transition-opacity duration-700 group-hover:opacity-0" />
                  </div>
                </div>

                {/* copy */}
                <div
                  className={cn(
                    "md:col-span-4",
                    flip ? "md:order-1 md:col-start-1" : "md:col-start-9",
                  )}
                >
                  <p className="eyebrow text-champagne" data-fade>
                    {res.index}
                  </p>
                  <h3
                    className="font-display mt-4 text-[clamp(1.9rem,3.4vw,3.1rem)] leading-tight tracking-[0.08em] uppercase"
                    data-fade="0.08"
                  >
                    {res.name}
                  </h3>
                  <div className="mt-6 h-px w-16 origin-left bg-champagne/50" data-grow />
                  <p
                    className="mt-6 text-sm leading-relaxed tracking-[0.03em] text-ivory/60"
                    data-fade="0.14"
                  >
                    {res.description}
                  </p>
                  <p className="eyebrow mt-7 text-ivory/40" data-fade="0.2">
                    {res.meta}
                  </p>
                  <div className="mt-9" data-fade="0.26">
                    <ArrowLink
                      label="ENQUIRE"
                      className="text-ivory/85 hover:text-champagne"
                      onClick={() => scrollToTarget("#contact")}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
