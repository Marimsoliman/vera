import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "../data/content";
import { scrollToTarget } from "../lib/scroll";
import { cn } from "../utils/cn";

/**
 * Minimal transparent navigation. Rendered in white with
 * `mix-blend-difference`, so it stays legible and adapts — white over
 * the dark film, near-black over ivory sections — with zero JS.
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 1400);
    return () => window.clearTimeout(t);
  }, []);

  const go = (target: string) => {
    setOpen(false);
    // Wait for the overlay to release before scrolling on mobile.
    window.setTimeout(() => scrollToTarget(target, -1), open ? 450 : 0);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[80] mix-blend-difference transition-all duration-1000",
          mounted && !open ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
          open && "translate-y-0 opacity-100",
        )}
      >
        <nav className="flex items-center justify-between px-6 py-6 text-white md:px-12">
          <button
            type="button"
            onClick={() => go("#project")}
            className="font-display cursor-pointer text-[1.35rem] tracking-[0.28em] uppercase"
            aria-label="VÉRA — back to top"
          >
            VÉRA
          </button>

          <ul className="hidden items-center gap-9 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <button
                  type="button"
                  onClick={() => go(link.target)}
                  className="u-link cursor-pointer text-[0.625rem] font-medium tracking-[0.34em] text-white/85 transition-colors duration-300 hover:text-white"
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="cursor-pointer text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.25} /> : <Menu className="h-5 w-5" strokeWidth={1.25} />}
          </button>
        </nav>
      </header>

      {/* — mobile menu — */}
      <div
        className={cn(
          "fixed inset-0 z-[70] flex flex-col justify-center bg-ink px-8 transition-all duration-700 [transition-timing-function:var(--ease-cinematic)] lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <p className="eyebrow mb-10 text-champagne">MENU</p>
        <ul className="space-y-2">
          {NAV_LINKS.map((link, i) => (
            <li
              key={link.label}
              className="overflow-hidden"
              style={{
                transitionDelay: `${open ? 120 + i * 60 : 0}ms`,
              }}
            >
              <button
                type="button"
                onClick={() => go(link.target)}
                className={cn(
                  "font-display block cursor-pointer py-2 text-4xl tracking-[0.12em] text-ivory uppercase transition-all duration-700",
                  open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
                )}
                style={{ transitionDelay: `${open ? 120 + i * 60 : 0}ms` }}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="eyebrow mt-14 text-ivory/40">BUILT FOR WHAT'S NEXT.</p>
      </div>
    </>
  );
}
