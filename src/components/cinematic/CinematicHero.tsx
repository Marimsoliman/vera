// src/components/hero/CinematicHero.tsx
import { useLayoutEffect, useRef, useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { prefersReducedMotion, scrollToTarget } from "../../lib/scroll";
import { SCENES, FRAME_COUNT, getFramePath } from "../../data/scenes";
import ArrowLink from "../ui/ArrowLink";

/* ═══════════════════════════════════════════════════════════════
   إعدادات الأداء والذاكرة
   ═══════════════════════════════════════════════════════════════ */
const CANVAS_ASPECT = 1366 / 768;
const DPR_CAP = 1.75;              // حد أقصى لدقة الكانفاس (لتخفيف الحمل على الموبايل)
const INITIAL_PRELOAD = 30;        // عدد الفريمات الأولى التي تُحمّل فوراً للمشهد الأول
const CHUNK_SIZE = 20;             // حجم مجموعة التحميل التدريجي
const KEEP_IN_MEMORY_BUFFER = 45;  // عدد الفريمات المحتفظ بها حول الفريم الحالي

/* ═══════════════════════════════════════════════════════════════
   نوع كائن تخزين الصور
   ═══════════════════════════════════════════════════════════════ */
interface SceneImageCache {
  images: (HTMLImageElement | null)[];
  loaded: boolean[];
  loading: boolean[];
}

export default function CinematicHero() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const reduced = prefersReducedMotion();

  // كاش الصور لكل مشهد (خارج React state لتفادي re-renders)
  const cacheRef = useRef<SceneImageCache[]>(
    SCENES.map(() => ({
      images: new Array(FRAME_COUNT).fill(null),
      loaded: new Array(FRAME_COUNT).fill(false),
      loading: new Array(FRAME_COUNT).fill(false),
    }))
  );

  // متغيرات التتبع الحالية للرسم
  const currentStateRef = useRef({
    sceneIndex: 0,
    frameIndex: 0,
    lastDrawnScene: -1,
    lastDrawnFrame: -1,
  });

  /* ═════════════════════════════════════════════════════════════
     1) تحميل صورة واحدة مع معالجة الأخطاء
     ═════════════════════════════════════════════════════════════ */
  const loadFrame = (sceneIdx: number, frameIdx: number): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const cache = cacheRef.current[sceneIdx];
      if (!cache || cache.loaded[frameIdx] || cache.loading[frameIdx]) {
        resolve(cache?.images[frameIdx] ?? null);
        return;
      }

      cache.loading[frameIdx] = true;
      const img = new Image();
      img.decoding = "async";
      img.src = getFramePath(SCENES[sceneIdx].folder, frameIdx + 1);

      img.onload = () => {
        cache.images[frameIdx] = img;
        cache.loaded[frameIdx] = true;
        cache.loading[frameIdx] = false;
        resolve(img);
      };

      img.onerror = () => {
        cache.loading[frameIdx] = false;
        // في حالة الخطأ: لا نكسر الأنيميشن، فقط نتخطى هذا الفريم
        console.warn(`[CinematicHero] Failed to load: ${img.src}`);
        resolve(null);
      };
    });
  };

  /* ═════════════════════════════════════════════════════════════
     2) تحميل مجموعة (Chunk) من الفريمات لمشهد معين
     ═════════════════════════════════════════════════════════════ */
  const loadChunk = async (sceneIdx: number, startFrame: number, size: number) => {
    const promises: Promise<HTMLImageElement | null>[] = [];
    const end = Math.min(startFrame + size, FRAME_COUNT);
    for (let i = startFrame; i < end; i++) {
      promises.push(loadFrame(sceneIdx, i));
    }
    await Promise.all(promises);
  };

  /* ═════════════════════════════════════════════════════════════
     3) تنظيف الذاكرة: تفريغ الفريمات البعيدة عن الفريم الحالي
     ═════════════════════════════════════════════════════════════ */
  const pruneMemory = (activeSceneIdx: number, activeFrameIdx: number) => {
    cacheRef.current.forEach((cache, sIdx) => {
      // لا نمس المشهد النشط الحالي
      if (sIdx === activeSceneIdx) {
        for (let i = 0; i < FRAME_COUNT; i++) {
          const distance = Math.abs(i - activeFrameIdx);
          if (distance > KEEP_IN_MEMORY_BUFFER && cache.loaded[i]) {
            cache.images[i] = null;
            cache.loaded[i] = false;
          }
        }
      } else {
        // المشاهد الأخرى: احتفظ فقط بأول عدد قليل من الفريمات كـ "warm-up"
        for (let i = 5; i < FRAME_COUNT; i++) {
          if (cache.loaded[i]) {
            cache.images[i] = null;
            cache.loaded[i] = false;
          }
        }
      }
    });
  };

  /* ═════════════════════════════════════════════════════════════
     4) رسم الفريم على الكانفاس (Cover Aspect)
     ═════════════════════════════════════════════════════════════ */
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

  /* ═════════════════════════════════════════════════════════════
     5) رسم مع Fallback ذكي عند عدم توفر الفريم
     ═════════════════════════════════════════════════════════════ */
  const renderCurrentFrame = () => {
    const state = currentStateRef.current;
    const { sceneIndex, frameIndex } = state;

    // Skip إذا كنا رسمنا نفس الفريم بالفعل
    if (state.lastDrawnScene === sceneIndex && state.lastDrawnFrame === frameIndex) {
      return;
    }

    const cache = cacheRef.current[sceneIndex];
    const targetImg = cache.images[frameIndex];

    if (targetImg && cache.loaded[frameIndex]) {
      drawFrame(targetImg);
      state.lastDrawnScene = sceneIndex;
      state.lastDrawnFrame = frameIndex;
    } else {
      // Fallback: ابحث عن أقرب فريم محمّل لتفادي الشاشة السوداء
      let nearestImg: HTMLImageElement | null = null;
      for (let offset = 1; offset < FRAME_COUNT; offset++) {
        const before = cache.images[frameIndex - offset];
        const after = cache.images[frameIndex + offset];
        if (before && cache.loaded[frameIndex - offset]) { nearestImg = before; break; }
        if (after && cache.loaded[frameIndex + offset]) { nearestImg = after; break; }
      }
      if (nearestImg) drawFrame(nearestImg);

      // اطلب تحميل الفريم المفقود لاستخدامه لاحقاً
      loadFrame(sceneIndex, frameIndex).then((img) => {
        if (img && currentStateRef.current.frameIndex === frameIndex &&
            currentStateRef.current.sceneIndex === sceneIndex) {
          drawFrame(img);
          state.lastDrawnScene = sceneIndex;
          state.lastDrawnFrame = frameIndex;
        }
      });
    }
  };

  /* ═════════════════════════════════════════════════════════════
     6) ضبط أبعاد الكانفاس مع Aspect Ratio + DPR Cap
     ═════════════════════════════════════════════════════════════ */
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const rect = canvas.getBoundingClientRect();

    // نحافظ على aspect ratio 1366:768 عبر cover
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;

      // إعادة رسم الفريم الحالي فوراً بعد تغيير الحجم
      currentStateRef.current.lastDrawnFrame = -1;
      renderCurrentFrame();
    }
  };

  /* ═════════════════════════════════════════════════════════════
     7) التحميل المبدئي — يبدأ فور تحميل الصفحة
     ═════════════════════════════════════════════════════════════ */
  useEffect(() => {
    let mounted = true;

    (async () => {
      // Preload أول فريم فقط لعرضه فوراً (No flash / No black frame)
      const firstImg = await loadFrame(0, 0);
      if (!mounted) return;

      resizeCanvas();
      if (firstImg) {
        drawFrame(firstImg);
        currentStateRef.current.lastDrawnScene = 0;
        currentStateRef.current.lastDrawnFrame = 0;
      }
      setFirstFrameReady(true);

      // ثم حمل باقي الفريمات الأولى بشكل تدريجي (في الخلفية)
      await loadChunk(0, 1, INITIAL_PRELOAD - 1);

      // بعد ذلك حمّل فريم واحد warm-up من المشاهد التالية
      loadFrame(1, 0);
      loadFrame(2, 0);
    })();

    // Resize Listener
    const handleResize = () => {
      resizeCanvas();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      mounted = false;
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ═════════════════════════════════════════════════════════════
     8) إعداد GSAP + ScrollTrigger (يعمل فقط بعد ظهور الفريم الأول)
     ═════════════════════════════════════════════════════════════ */
  useLayoutEffect(() => {
    if (!firstFrameReady) return;
    const root = rootRef.current;
    if (!root) return;

    // Reduced Motion: لا animation، فقط اعرض أول فريم
    if (reduced) {
      loadFrame(0, 0).then((img) => img && drawFrame(img));
      return;
    }

    const ctx = gsap.context(() => {
      const captions = gsap.utils.toArray<HTMLElement>("[data-caption]");
      const markers = gsap.utils.toArray<HTMLElement>("[data-marker]");

      /* ─── Intro Animation ─── */
      const intro = gsap.timeline({ delay: 0.1, defaults: { ease: "power4.out" } });
      intro
        .fromTo(".js-title-line", { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.08 }, 0.1)
        .fromTo(".js-title-sub", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 }, 0.6)
        .fromTo(".js-hero-ui", { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.05 }, 0.7);

      /* ─── متغير التقدم الرئيسي (0 → 3) ─── */
      const progress = { value: 0 };

      /* ─── دالة الرسم مع Preloading الذكي ─── */
      let lastRenderedSceneIdx = -1;
      const updateFromProgress = () => {
        const p = progress.value; // 0 to 3

        // تحديد المشهد الحالي والفريم داخله
        let sceneIdx = Math.floor(p);
        let localProgress = p - sceneIdx;

        if (sceneIdx >= SCENES.length) {
          sceneIdx = SCENES.length - 1;
          localProgress = 1;
        }

        const frameIdx = Math.min(
          FRAME_COUNT - 1,
          Math.floor(localProgress * FRAME_COUNT)
        );

        currentStateRef.current.sceneIndex = sceneIdx;
        currentStateRef.current.frameIndex = frameIdx;

        renderCurrentFrame();

        /* Progressive Loading ذكي:
           عند دخول مشهد جديد → حمّل أول chunk فوراً
           عند اقتراب النهاية → حمّل chunks المشهد التالي مسبقاً */
        if (sceneIdx !== lastRenderedSceneIdx) {
          lastRenderedSceneIdx = sceneIdx;
          loadChunk(sceneIdx, 0, INITIAL_PRELOAD);
          // تنظيف الذاكرة عند تغيير المشهد
          pruneMemory(sceneIdx, frameIdx);
        }

        // Preload chunk الجاي داخل نفس المشهد
        const nextChunkStart = Math.floor(frameIdx / CHUNK_SIZE) * CHUNK_SIZE + CHUNK_SIZE;
        if (nextChunkStart < FRAME_COUNT) {
          const cache = cacheRef.current[sceneIdx];
          if (!cache.loaded[nextChunkStart] && !cache.loading[nextChunkStart]) {
            loadChunk(sceneIdx, nextChunkStart, CHUNK_SIZE);
          }
        }

        // Preload المشهد التالي إذا اقتربنا من نهاية الحالي
        if (localProgress > 0.75 && sceneIdx < SCENES.length - 1) {
          const nextScene = sceneIdx + 1;
          const nextCache = cacheRef.current[nextScene];
          if (!nextCache.loaded[0]) {
            loadChunk(nextScene, 0, INITIAL_PRELOAD);
          }
        }
      };

      /* ─── GSAP Ticker: يرسم فقط عندما يتغير التقدم فعلياً ─── */
      let lastProgressValue = -1;
      const tickerFn = () => {
        if (progress.value !== lastProgressValue) {
          lastProgressValue = progress.value;
          updateFromProgress();
        }
      };
      gsap.ticker.add(tickerFn);

      /* ─── الـ Timeline الرئيسي المرتبط بالسكرول ─── */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,          // scrub ناعم ومريح
          invalidateOnRefresh: true,
        },
      });

      // تحريك متغير التقدم من 0 إلى 3 (يمثل 3 مشاهد)
      tl.to(progress, { value: 3, ease: "none", duration: 3 }, 0);

      /* ─── حركة النصوص والـ UI (بالتزامن مع التقدم) ─── */
      tl.to(".js-title", { opacity: 0, y: -50, scale: 0.98, duration: 0.3, ease: "power2.in" }, 0.15);
      tl.to(".js-hero-cta", { opacity: 0, duration: 0.2 }, 0.15);
      tl.to(".js-scroll-cue", { opacity: 0, duration: 0.1 }, 0.05);

      /* ─── نصوص المشاهد ─── */
      captions.forEach((cap, i) => {
        const enter = [0.25, 1.15, 2.15][i];
        const exit = [0.85, 1.85, 2.9][i];

        tl.fromTo(
          cap,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
          enter
        );
        if (i < 2) {
          tl.to(cap, { opacity: 0, y: -18, duration: 0.15, ease: "power2.in" }, exit);
        }
      });

      /* ─── مؤشر التقدم الجانبي ─── */
      tl.fromTo(".js-rail-fill", { scaleY: 0 }, { scaleY: 1, duration: 3, ease: "none" }, 0);
      markers.forEach((m, i) => {
        tl.to(m, { opacity: 1, color: "#c2a264", duration: 0.01 }, [0.05, 1.05, 2.05][i]);
      });

      /* ─── تأثير Scale خفيف على الكانفاس عند الانتقال (Cinematic feel) ─── */
      tl.fromTo(
        canvasRef.current,
        { scale: 1 },
        { scale: 1.02, duration: 1, ease: "sine.inOut", yoyo: true, repeat: 2 },
        0
      );

      /* ─── رسالة النهاية ─── */
      tl.fromTo(".js-endnote", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.2 }, 2.75);
      tl.to(".js-endnote", { opacity: 0, duration: 0.15 }, 2.95);
      tl.to([".js-rail", ".js-caption-stack"], { opacity: 0, duration: 0.15 }, 2.9);

      /* ─── Cleanup ─── */
      return () => {
        gsap.ticker.remove(tickerFn);
      };
    }, root);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, [firstFrameReady, reduced]);

  /* ═════════════════════════════════════════════════════════════
     العرض
     ═════════════════════════════════════════════════════════════ */
  return (
    <section
      id="project"
      ref={rootRef}
      aria-label="VÉRA — a cinematic journey"
      // ارتفاع طويل = وقت scroll كافٍ لرؤية تفاصيل كل مشهد
      className="relative h-[500vh] bg-[#0a0a0a] md:h-[600vh]"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#0a0a0a]">
        {/* ═══════ الكانفاس الوحيد (بديل كل الفيديوهات) ═══════ */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none [transform:translateZ(0)] will-change-transform"
          style={{
            aspectRatio: `${CANVAS_ASPECT}`,
            width: "100%",
            height: "100%",
          }}
        />

        {/* Poster: أول فريم كصورة احتياطية قبل تهيئة الكانفاس (يمنع black flash) */}
        {!firstFrameReady && (
          <img
            src={getFramePath(SCENES[0].folder, 1)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          />
        )}

        {/* ═══════ العنوان الرئيسي ═══════ */}
        <div className="js-title pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-40">
          <h1 className="font-display text-ivory uppercase">
            <span className="block overflow-hidden pb-1">
              <span className="js-title-line block text-[clamp(3.75rem,12vw,11.5rem)] leading-[0.98] tracking-[0.14em] [text-indent:0.14em]">
                VÉRA
              </span>
            </span>
            <span className="block overflow-hidden pb-2">
              <span className="js-title-line block text-[clamp(1.05rem,3.2vw,2.6rem)] leading-none tracking-[0.58em] text-ivory/90 [text-indent:0.58em]">
                DEVELOPMENTS
              </span>
            </span>
          </h1>
          <div className="js-title-sub mt-8 flex items-center gap-5 md:mt-10">
            <span className="h-px w-10 bg-champagne/70 md:w-16" />
            <p className="eyebrow text-ivory/85">Built for what's next.</p>
            <span className="h-px w-10 bg-champagne/70 md:w-16" />
          </div>
        </div>

        {/* ═══════ نصوص المشاهد ═══════ */}
        <div className="js-caption-stack js-hero-ui pointer-events-none absolute bottom-24 left-6 h-40 w-[26rem] max-w-[calc(100vw-3rem)] md:bottom-16 md:left-12 z-40">
          {SCENES.map((scene) => (
            <div key={scene.id} data-caption className="absolute bottom-0 left-0 opacity-0">
              <div className="mb-3 flex items-center gap-4">
                <span className="eyebrow text-champagne">{scene.index}</span>
                <span className="h-px w-8 bg-ivory/30" />
                <span className="eyebrow text-ivory/50">SEQUENCE</span>
              </div>
              <p className="font-display text-[clamp(1.75rem,4.5vw,3.4rem)] leading-none tracking-[0.12em] text-ivory uppercase">
                {scene.title}
              </p>
              <p className="mt-3 max-w-[280px] text-[0.8125rem] leading-relaxed tracking-[0.04em] text-ivory/80">
                {scene.caption}
              </p>
            </div>
          ))}
        </div>

        {/* ═══════ مؤشر التقدم الجانبي ═══════ */}
        <div className="js-rail js-hero-ui pointer-events-none absolute top-1/2 right-5 hidden -translate-y-1/2 flex-col items-center gap-7 md:right-10 md:flex z-40">
          <span className="eyebrow text-[0.5625rem] text-ivory/45 [writing-mode:vertical-rl]">
            THE JOURNEY
          </span>
          <div className="relative h-36 w-px overflow-hidden bg-ivory/15">
            <div className="js-rail-fill absolute inset-0 origin-top scale-y-0 bg-champagne" />
          </div>
          <div className="flex flex-col items-center gap-4">
            {SCENES.map((scene) => (
              <span
                key={scene.id}
                data-marker
                className="eyebrow text-[0.5625rem] text-ivory/60 opacity-30 transition-colors duration-300"
              >
                {scene.index}
              </span>
            ))}
          </div>
        </div>

        {/* ═══════ Scroll Cue ═══════ */}
        <div className="js-scroll-cue js-hero-ui pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:bottom-10 md:flex z-40">
          <span className="eyebrow text-ivory/55">Scroll</span>
          <span className="relative h-9 w-px overflow-hidden bg-ivory/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.9s_var(--ease-cinematic)_infinite] bg-champagne" />
          </span>
        </div>

        {/* ═══════ رسالة النهاية ═══════ */}
        <div className="js-endnote pointer-events-none absolute inset-x-0 bottom-12 flex flex-col items-center gap-4 opacity-0 z-40">
          <p className="eyebrow text-champagne">The VÉRA world continues below</p>
          <ArrowDown className="h-4 w-4 text-ivory/60" strokeWidth={1.25} />
        </div>

        {/* ═══════ زر الاستكشاف ═══════ */}
        <div className="js-hero-cta js-hero-ui absolute right-6 bottom-7 md:right-12 md:bottom-16 z-40">
          <ArrowLink
            label="EXPLORE VÉRA"
            className="text-ivory"
            onClick={() => scrollToTarget("#vision")}
          />
        </div>
      </div>
    </section>
  );
}