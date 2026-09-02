import { useRef } from "react";
import { useCinematicReveals } from "../hooks/useCinematicReveals";
import { scrollToTarget } from "../lib/scroll";
import { LOCATION } from "../data/content";
import Eyebrow from "./ui/Eyebrow";
import ArrowLink from "./ui/ArrowLink";

/**
 * 04 — LOCATION
 * Architectural masterplan treatment: the plan sits inside a drawn
 * frame with registration crosses and coordinates — closer to a
 * drawing board than a Google Map. All figures are editable
 * placeholders in src/data/content.ts.
 */
export default function Location() {
  const ref = useRef<HTMLElement>(null);
  useCinematicReveals(ref);

  return (
    <section id="location" ref={ref} className="relative bg-coal text-ivory">
      <div className="mx-auto max-w-[110rem] px-6 py-28 md:px-12 md:py-44">
        <div className="grid gap-16 md:grid-cols-12 md:gap-8">
          {/* — copy column — */}
          <div className="md:col-span-5 lg:col-span-4">
            <Eyebrow index="04" label="LOCATION" />

            <h2
              data-lines
              className="font-display mt-12 text-[clamp(2.6rem,5.5vw,5.25rem)] leading-[1.02] tracking-[0.05em] uppercase"
            >
              <span className="block overflow-hidden pb-1">
                <span data-line className="block">PERFECTLY</span>
              </span>
              <span className="block overflow-hidden pb-2">
                <span data-line className="block">
                  <span className="text-champagne">POSITIONED.</span>
                </span>
              </span>
            </h2>

            <p
              className="mt-8 max-w-md text-sm leading-relaxed tracking-[0.03em] text-ivory/60"
              data-fade
            >
              Set within the city's new waterfront quarter — close enough to
              everything that matters, composed enough to feel apart. Final
              positioning details are released with the masterplan.
            </p>

            <p className="eyebrow mt-10 text-champagne" data-fade="0.1">
              {LOCATION.coordinates}
            </p>

            {/* — distance table — */}
            <dl className="mt-12" data-fade="0.15">
              {LOCATION.distances.map((row) => (
                <div
                  key={row.place}
                  className="flex items-baseline justify-between gap-6 border-t border-ivory/12 py-5 last:border-b"
                >
                  <dt className="eyebrow text-ivory/55">{row.place}</dt>
                  <dd className="font-display shrink-0 text-xl tracking-[0.08em] text-ivory">
                    {row.time}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-12" data-fade="0.2">
              <ArrowLink
                label="REQUEST THE MASTERPLAN"
                className="text-ivory/85 hover:text-champagne"
                onClick={() => scrollToTarget("#contact")}
              />
            </div>
          </div>

          {/* — plan framed like a drawing — */}
          <div className="md:col-span-7 lg:col-span-8 lg:pl-10">
            <div className="relative border border-ivory/12 p-3 md:p-5" data-fade>
              {/* registration crosses */}
              {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map(
                (pos) => (
                  <span key={pos} className={`absolute ${pos} z-10 h-3 w-3`} aria-hidden>
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-champagne/70" />
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-champagne/70" />
                  </span>
                ),
              )}
              <div className="relative aspect-[4/3] overflow-hidden" data-clip>
                <img
                  src="/img/location-plan.jpg"
                  alt="Architectural masterplan of District 01"
                  data-clip-img
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover will-change-transform"
                />
                {/* subtle centre marker */}
                <span className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                  <span className="block h-10 w-10 rounded-full border border-champagne/60" />
                  <span className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-champagne" />
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-4 pb-1">
                <span className="eyebrow text-ivory/55">{LOCATION.district}</span>
                <span className="eyebrow text-champagne">MASTERPLAN — SHEET 01</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
