import { useEffect, useRef } from "react";
import { useCinematicReveals } from "../hooks/useCinematicReveals";
import { scrollToTarget } from "../lib/scroll";
import { CONTACT } from "../data/content";
import { SCENES } from "../data/scenes";

/** The closing frame re-uses the interior footage (already cached). */
const SCENE_VIDEO_REUSE = SCENES[2].src;
import ArrowLink from "./ui/ArrowLink";

/**
 * 05 — CONTACT / CLOSING
 * A final cinematic frame: the interior footage returns beneath a
 * deep veil, inviting the visitor to step into the VÉRA world.
 */
export default function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useCinematicReveals(ref);

  /* Play only while on screen — the file is already cached from the hero. */
  useEffect(() => {
    const video = videoRef.current;
    const el = ref.current;
    if (!video || !el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play()?.catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="contact"
      ref={ref}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink text-ivory"
    >
      {/* — returning footage, heavily veiled — */}
      <div className="absolute inset-0">
        <img
          src="/videos/vera-poster-03.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={SCENE_VIDEO_REUSE}
          preload="none"
          muted
          playsInline
          loop
          aria-hidden
          tabIndex={-1}
        />
        <div className="absolute inset-0 bg-ink/72" />
        <div className="vignette-soft absolute inset-0" />
      </div>

      {/* — content — */}
      <div className="relative z-10 mx-auto w-full max-w-[110rem] px-6 py-32 text-center md:px-12">
        <p className="eyebrow text-champagne" data-fade>
          VÉRA DEVELOPMENTS
        </p>

        <h2
          data-lines
          className="font-display mt-10 text-[clamp(3rem,9.5vw,9.5rem)] leading-[0.98] tracking-[0.05em] uppercase"
        >
          <span className="block overflow-hidden pb-1">
            <span data-line className="block">YOUR FUTURE</span>
          </span>
          <span className="block overflow-hidden pb-2">
            <span data-line className="block">
              STARTS <span className="text-champagne">HERE.</span>
            </span>
          </span>
        </h2>

        <p
          className="mx-auto mt-8 max-w-md text-sm leading-relaxed tracking-[0.04em] text-ivory/60"
          data-fade="0.1"
        >
              Private previews of the development are now open by appointment.
              Step inside the world you have just seen.
        </p>

        <div
          className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8"
          data-fade="0.18"
        >
          <ArrowLink
            bordered
            label="EXPLORE THE DEVELOPMENT"
            className="text-ivory"
            onClick={() => scrollToTarget("#project")}
          />
          <ArrowLink
            bordered
            label="CONTACT US"
            className="text-champagne"
            href={`mailto:${CONTACT.email}`}
          />
        </div>

        {/* — contact strip — */}
        <div
          className="mt-20 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-ivory/12 pt-8"
          data-fade="0.26"
        >
          <a
            href={`mailto:${CONTACT.email}`}
            className="eyebrow text-ivory/55 transition-colors hover:text-champagne"
          >
            {CONTACT.email.toUpperCase()}
          </a>
          <span className="hidden h-3 w-px bg-ivory/20 sm:block" />
          <a
            href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
            className="eyebrow text-ivory/55 transition-colors hover:text-champagne"
          >
            {CONTACT.phone}
          </a>
          <span className="hidden h-3 w-px bg-ivory/20 sm:block" />
          <span className="eyebrow text-ivory/55">{CONTACT.address}</span>
        </div>
      </div>
    </section>
  );
}
