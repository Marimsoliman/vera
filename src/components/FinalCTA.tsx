import { useEffect, useRef, useState } from "react";
import { useCinematicReveals } from "../hooks/useCinematicReveals";
import { scrollToTarget, prefersReducedMotion } from "../lib/scroll";
import { CONTACT } from "../data/content";
import { SCENES, FRAME_COUNT, getFramePath } from "../data/scenes";
import ArrowLink from "./ui/ArrowLink";

/* ═══════════════════════════════════════════════════════════════
   الأنيميشن هنا "loop" تلقائي (مش scroll-scrubbing زي الهيرو)
   لأن السكشن ده مش طويل بما يكفي لمساحة سكرول منفصلة.
   بيستخدم نفس بيانات الفريمات بتاعة scene-3.
   ═══════════════════════════════════════════════════════════════ */
const CLOSING_SCENE = SCENES[2] ?? SCENES[0];
const DPR_CAP = 1.75;
const INITIAL_PRELOAD = 30;
const CHUNK_SIZE = 20;
const PLAYBACK_FPS = 24; // سرعة اللوب

/**
 * 05 — CONTACT / CLOSING
 * A final cinematic frame: the interior footage returns beneath a
 * deep veil, inviting the visitor to step into the VÉRA world.
 */
export default function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  useCinematicReveals(ref);

  const reduced = prefersReducedMotion();

  const cacheRef = useRef({
    images: new Array<HTMLImageElement | null>(FRAME_COUNT).fill(null),
    loaded: new Array<boolean>(FRAME_COUNT).fill(false),
    loading: new Array<boolean>(FRAME_COUNT).fill(false),
  });

  const stateRef = useRef({ frameIndex: 0, lastDrawn: -1 });
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  /* — تحميل فريم واحد — */
  const loadFrame = (frameIdx: number): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const cache = cacheRef.current;
      if (cache.loaded[frameIdx] || cache.loading[frameIdx]) {
        resolve(cache.images[frameIdx]);
        return;
      }
      cache.loading[frameIdx] = true;
      const img = new Image();
      img.decoding = "async";
      img.src = getFramePath(CLOSING_SCENE.folder, frameIdx + 1);
      img.onload = () => {
        cache.images[frameIdx] = img;
        cache.loaded[frameIdx] = true;
        cache.loading[frameIdx] = false;
        resolve(img);
      };
      img.onerror = () => {
        cache.loading[frameIdx] = false;
        // eslint-disable-next-line no-console
        console.warn(`[FinalCTA] Failed to load frame: ${img.src}`);
        resolve(null);
      };
    });
  };

  const loadChunk = async (start: number, size: number) => {
    const end = Math.min(start + size, FRAME_COUNT);
    const promises: Promise<HTMLImageElement | null>[] = [];
    for (let i = start; i < end; i++) promises.push(loadFrame(i));
    await Promise.all(promises);
  };

  /* — رسم فريم على الكانفاس بنظام cover — */
  const drawFrame = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas || !img.complete || img.naturalWidth === 0) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  };

  const renderCurrentFrame = () => {
    const state = stateRef.current;
    if (state.lastDrawn === state.frameIndex) return;
    const cache = cacheRef.current;
    const img = cache.images[state.frameIndex];
    if (img && cache.loaded[state.frameIndex]) {
      drawFrame(img);
      state.lastDrawn = state.frameIndex;
    }
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      stateRef.current.lastDrawn = -1;
      renderCurrentFrame();
    }
  };

  /* — تحميل مبدئي: أول فريم فورًا، ثم الباقي تدريجيًا — */
  useEffect(() => {
    let mounted = true;
    (async () => {
      const firstImg = await loadFrame(0);
      if (!mounted) return;
      resizeCanvas();
      if (firstImg) {
        drawFrame(firstImg);
        stateRef.current.lastDrawn = 0;
      }
      setFirstFrameReady(true);
      await loadChunk(1, INITIAL_PRELOAD - 1);
      // تحميل الباقي في الخلفية على دفعات
      for (let start = INITIAL_PRELOAD; start < FRAME_COUNT; start += CHUNK_SIZE) {
        if (!mounted) return;
        await loadChunk(start, CHUNK_SIZE);
      }
    })();

    const handleResize = () => resizeCanvas();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      mounted = false;
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* — تشغيل/إيقاف اللوب حسب ظهور السكشن على الشاشة — */
  useEffect(() => {
    if (!firstFrameReady) return;
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      // Reduced motion: اعرض أول فريم بس، من غير لوب
      return;
    }

    const frameDuration = 1000 / PLAYBACK_FPS;

    const tick = (time: number) => {
      if (time - lastTickRef.current >= frameDuration) {
        lastTickRef.current = time;
        const state = stateRef.current;
        state.frameIndex = (state.frameIndex + 1) % FRAME_COUNT;
        renderCurrentFrame();
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (rafRef.current == null) {
        lastTickRef.current = 0;
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const stopLoop = () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startLoop();
        else stopLoop();
      },
      { threshold: 0.15 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      stopLoop();
    };
  }, [firstFrameReady, reduced]);

  return (
    <section
      id="contact"
      ref={ref}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink text-ivory"
    >
      {/* — returning footage, heavily veiled — */}
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none [transform:translateZ(0)] will-change-transform"
        />
        {!firstFrameReady && (
          <img
            src={getFramePath(CLOSING_SCENE.folder, 1)}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
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