import { useRef } from "react";
import { useCinematicReveals } from "../hooks/useCinematicReveals";
import { AMENITIES } from "../data/content";
import Eyebrow from "./ui/Eyebrow";
import { cn } from "../utils/cn";

/**
 * 03 — AMENITIES
 * Large visual plates with offset alignment — a slow, gallery-like
 * rhythm. No icon grids, no equal boxes.
 */
export default function Amenities() {
  const ref = useRef<HTMLElement>(null);
  useCinematicReveals(ref);

  return (
    <section id="amenities" ref={ref} className="relative bg-sand text-ink">
      <div className="mx-auto max-w-[110rem] px-6 py-28 md:px-12 md:py-44">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Eyebrow index="03" label="AMENITIES" dark />
          <p className="eyebrow hidden text-smoke md:block" data-fade>
            PRIVATE TO RESIDENTS & GUESTS
          </p>
        </div>

        <h2
          data-lines
          className="font-display mt-14 text-[clamp(2.8rem,8.5vw,8.5rem)] leading-[1.0] tracking-[0.05em] uppercase md:mt-20"
        >
          <span className="block overflow-hidden pb-1">
            <span data-line className="block">A LIFE,</span>
          </span>
          <span className="block overflow-hidden pb-2">
            <span data-line className="block text-champagne md:pl-[10vw]">COMPOSED.</span>
          </span>
        </h2>

        <div className="mt-24 space-y-24 md:mt-36 md:space-y-36">
          {AMENITIES.map((amenity, i) => {
            const right = i % 2 === 1;
            return (
              <figure
                key={amenity.index}
                className={cn("md:w-[76%]", right && "md:ml-auto")}
              >
                <div className="relative aspect-[4/3] overflow-hidden md:aspect-[16/8]" data-clip>
                  <img
                    src={amenity.image}
                    alt={amenity.name}
                    data-clip-img
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover will-change-transform"
                  />
                </div>
                <figcaption className="mt-7 border-t border-ink/15 pt-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
                    <h3
                      className="font-display text-[clamp(1.7rem,3vw,2.6rem)] tracking-[0.08em] uppercase"
                      data-fade
                    >
                      {amenity.name}
                    </h3>
                    <span className="eyebrow text-champagne" data-fade>
                      {amenity.index}
                    </span>
                  </div>
                  <p
                    className="mt-4 max-w-xl text-sm leading-relaxed tracking-[0.03em] text-smoke"
                    data-fade="0.12"
                  >
                    {amenity.description}
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
