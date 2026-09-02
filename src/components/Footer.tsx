import { NAV_LINKS, CONTACT } from "../data/content";
import { scrollToTarget } from "../lib/scroll";

/** Minimal closing strip. */
export default function Footer() {
  return (
    <footer className="relative border-t border-ivory/10 bg-ink text-ivory">
      <div className="mx-auto max-w-[110rem] px-6 py-14 md:px-12">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <button
            type="button"
            onClick={() => scrollToTarget("#project")}
            className="font-display cursor-pointer text-3xl tracking-[0.24em] uppercase"
            aria-label="VÉRA — back to top"
          >
            VÉRA
          </button>

          <nav className="hidden md:block">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => scrollToTarget(link.target)}
                    className="u-link cursor-pointer text-[0.625rem] font-medium tracking-[0.32em] text-ivory/55 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="text-right">
            <p className="eyebrow text-ivory/55">{CONTACT.address}</p>
            <a
              href={`mailto:${CONTACT.email}`}
              className="u-link mt-3 inline-block text-[0.625rem] font-medium tracking-[0.32em] text-champagne"
            >
              {CONTACT.email.toUpperCase()}
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-ivory/10 pt-8">
          <p className="text-[0.5625rem] font-medium tracking-[0.3em] text-ivory/35 uppercase">
            © 2026 VÉRA DEVELOPMENTS — ALL RIGHTS RESERVED
          </p>
          <p className="text-[0.5625rem] font-medium tracking-[0.3em] text-ivory/35 uppercase">
            BUILT FOR WHAT'S NEXT.
          </p>
        </div>
      </div>
    </footer>
  );
}
