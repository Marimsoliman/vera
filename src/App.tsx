import { useEffect } from "react";
import { createLenis, destroyLenis } from "./lib/scroll";
import { ScrollTrigger } from "./lib/gsap";
import Navbar from "./components/Navbar";
import CinematicHero from "./components/cinematic/CinematicHero";
import Vision from "./components/Vision";
import Residences from "./components/Residences";
import Amenities from "./components/Amenities";
import Location from "./components/Location";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";

/**
 * VÉRA DEVELOPMENTS
 * ─────────────────────────────────────────────────────────────
 * THE CITY → THE BUILDING → THE INTERIOR → THE VÉRA WORLD
 *
 * The hero (CinematicHero) owns the three-scene film defined in
 *   src/data/scenes.ts  →  /videos/vera-scene-01..03.mp4
 * All editorial placeholder copy lives in src/data/content.ts.
 * ─────────────────────────────────────────────────────────────
 */
export default function App() {
  useEffect(() => {
    createLenis();

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("load", onLoad);
      destroyLenis();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-ink text-ivory">
      {/* film grain across the whole experience */}
      <div className="grain-overlay" aria-hidden />

      <Navbar />

      <main>
        <CinematicHero />
        <Vision />
        <Residences />
        <Amenities />
        <Location />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
