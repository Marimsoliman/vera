// src/components/hero/CinematicHero.tsx
import { useLayoutEffect, useRef, useEffect, useState, useCallback } from "react";
import { ArrowDown } from "lucide-react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { prefersReducedMotion, scrollToTarget } from "../../lib/scroll";
import { SCENES, FRAME_COUNT, getFramePath } from "../../data/scenes";
import ArrowLink from "../ui/ArrowLink";

const DPR_CAP = 1.25; // تحسين دقة الأداء لضمان سلاسة الحركة على الموبايل والشاشات الضعيفة

interface SceneCache {
  images: Map<number, HTMLImageElement>;
  loading: Set<number>;
}

// طابور تحميل ذكي ومحدد لمنع اختناق الشبكة (Max 3 concurrent requests)
class TaskQueue {
  private activeCount = 0;
  private queue: (() => Promise<void>)[] = [];
  constructor(private maxConcurrency = 3) {}

  add(task: () => Promise<void>) {
    this.queue.push(task);
    this.run();
  }

  private run() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) return;
    const task = this.queue.shift()!;
    this.activeCount++;
    task().finally(() => {
      this.activeCount--;
      this.run();
    });
  }
}

const downloadQueue = new TaskQueue(3);

export default function CinematicHero() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null); // Ref مباشر للبوستر لمنع Re-render

  const [isInitialized, setIsInitialized] = useState(false);
  const reduced = prefersReducedMotion();

  // كاش فريمات الصور
  const cacheRef = useRef<SceneCache[]>(
    SCENES.map(() => ({
      images: new Map(),
      loading: new Set(),
    }))
  );

  const stateRef = useRef({
    sceneIndex: 0,
    frameIndex: 0,
    lastDrawnScene: -1,
    lastDrawnFrame: -1,
    canvasHasDrawn: false,
  });

  /* ═════════════════════════════════════════════════════════════
     1) رسم الصورة على الكانفاس بأعلى أداء (Hardware Accelerated)
     ═════════════════════════════════════════════════════════════ */
  const renderImageToCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const canvasRatio = cw / ch;
    const imgRatio = iw / ih;

    let dw: number, dh: number, dx: number, dy: number;

    if (canvasRatio > imgRatio) {
      dw = cw;
      dh = cw / imgRatio;
      dx = 0;
      dy = (ch - dh) / 2;
    } else {
      dh = ch;
      dw = ch * imgRatio;
      dx = (cw - dw) / 2;
      dy = 0;
    }

    ctx.drawImage(img, dx, dy, dw, dh);

    // إخفاء الـ Poster فوراً وبنعومة عبر الـ DOM مباشرة وبدون Re-render
    if (!stateRef.current.canvasHasDrawn) {
      stateRef.current.canvasHasDrawn = true;
      if (posterRef.current) {
        posterRef.current.style.opacity = "0";
        posterRef.current.style.pointerEvents = "none";
      }
      if (canvasRef.current) {
        canvasRef.current.style.opacity = "1";
      }
    }
  }, []);

  /* ═════════════════════════════════════════════════════════════
     2) تحميل فريم ذكي متحكم به عبر الطابور (Controlled Queue)
     ═════════════════════════════════════════════════════════════ */
  const loadSingleFrame = useCallback(
    (sceneIdx: number, frameIdx: number): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        if (sceneIdx < 0 || sceneIdx >= SCENES.length || frameIdx < 0 || frameIdx >= FRAME_COUNT) {
          resolve(null);
          return;
        }

        const cache = cacheRef.current[sceneIdx];
        if (cache.images.has(frameIdx)) {
          resolve(cache.images.get(frameIdx)!);
          return;
        }

        if (cache.loading.has(frameIdx)) {
          resolve(null);
          return;
        }

        cache.loading.add(frameIdx);

        // إضافة عملية التحميل للطابور لمنع زيادة الضغط على المتصفح
        downloadQueue.add(async () => {
          try {
            const img = new Image();
            img.decoding = "async";
            img.src = getFramePath(SCENES[sceneIdx].folder, frameIdx + 1);

            await new Promise((res, rej) => {
              img.onload = res;
              img.onerror = rej;
            });

            cache.loading.delete(frameIdx);
            cache.images.set(frameIdx, img);
            resolve(img);
          } catch {
            cache.loading.delete(frameIdx);
            resolve(null);
          }
        });
      });
    },
    []
  );

  /* ═════════════════════════════════════════════════════════════
     3) تحميل الفريمات المحيطة بالطلب فقط (Strict Surrounding Preload)
     ═════════════════════════════════════════════════════════════ */
  const preloadSurrounding = useCallback(
    (sceneIdx: number, frameIdx: number) => {
      // تحميل إطارين للأمام وإطار للخلف فقط لتقليل التحميل غير الضروري
      const forwardWindow = 4;
      const backwardWindow = 2;

      for (let i = 1; i <= forwardWindow; i++) {
        if (frameIdx + i < FRAME_COUNT) loadSingleFrame(sceneIdx, frameIdx + i);
      }
      for (let i = 1; i <= backwardWindow; i++) {
        if (frameIdx - i >= 0) loadSingleFrame(sceneIdx, frameIdx - i);
      }
      
      // التجهيز الذكي للمشهد التالي
      if (frameIdx > FRAME_COUNT - 8 && sceneIdx + 1 < SCENES.length) {
        loadSingleFrame(sceneIdx + 1, 0);
        loadSingleFrame(sceneIdx + 1, 1);
      }
    },
    [loadSingleFrame]
  );

  /* ═════════════════════════════════════════════════════════════
     4) رندر الفريم مع معالجة الحركة السريعة
     ═════════════════════════════════════════════════════════════ */
  const renderFrame = useCallback(
    (sceneIdx: number, frameIdx: number) => {
      stateRef.current.sceneIndex = sceneIdx;
      stateRef.current.frameIndex = frameIdx;

      const cache = cacheRef.current[sceneIdx];
      const targetImg = cache.images.get(frameIdx);

      if (targetImg) {
        renderImageToCanvas(targetImg);
        stateRef.current.lastDrawnScene = sceneIdx;
        stateRef.current.lastDrawnFrame = frameIdx;
      } else {
        // البحث عن أقرب فريم جاهز لعدم حدوث أي رمش أسود
        let fallbackFound = false;
        for (let offset = 1; offset <= 10; offset++) {
          const prev = cache.images.get(frameIdx - offset);
          const next = cache.images.get(frameIdx + offset);
          if (prev) {
            renderImageToCanvas(prev);
            fallbackFound = true;
            break;
          }
          if (next) {
            renderImageToCanvas(next);
            fallbackFound = true;
            break;
          }
        }

        // تحميل الفريم الأصلي المطلوب وعرضه فور وصوله
        loadSingleFrame(sceneIdx, frameIdx).then((img) => {
          if (
            img &&
            stateRef.current.sceneIndex === sceneIdx &&
            stateRef.current.frameIndex === frameIdx
          ) {
            renderImageToCanvas(img);
            stateRef.current.lastDrawnScene = sceneIdx;
            stateRef.current.lastDrawnFrame = frameIdx;
          }
        });
      }

      preloadSurrounding(sceneIdx, frameIdx);
    },
    [loadSingleFrame, preloadSurrounding, renderImageToCanvas]
  );

  /* ═════════════════════════════════════════════════════════════
     5) ريسيز الكانفاس لتطابق دقة الشاشة
     ═════════════════════════════════════════════════════════════ */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const width = Math.round(window.innerWidth * dpr);
    const height = Math.round(window.innerHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;

      const activeScene = stateRef.current.sceneIndex;
      const activeFrame = stateRef.current.frameIndex;
      const cachedImg = cacheRef.current[activeScene]?.images.get(activeFrame);

      if (cachedImg) {
        renderImageToCanvas(cachedImg);
      }
    }
  }, [renderImageToCanvas]);

  /* ═════════════════════════════════════════════════════════════
     6) التهيئة المبدئية الخفيفة
     ═════════════════════════════════════════════════════════════ */
  useEffect(() => {
    let active = true;

    (async () => {
      // تحميل فريم البداية رقم 0 بأعلى أولوية
      const first = await loadSingleFrame(0, 0);
      if (!active) return;

      resizeCanvas();
      if (first) {
        renderImageToCanvas(first);
      }
      setIsInitialized(true);

      // تحميل فريمات البداية للمشاهد الأخرى كعلامات توقف سريعة
      for (let s = 1; s < SCENES.length; s++) {
        loadSingleFrame(s, 0);
      }

      // تحميل أول 8 إطارات فقط لسرعة تشغيل الصفحة المبدئية
      for (let f = 1; f < 8; f++) {
        if (!active) break;
        await loadSingleFrame(0, f);
      }
    })();

    const handleResize = () => {
      resizeCanvas();
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      active = false;
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [loadSingleFrame, renderImageToCanvas, resizeCanvas]);

  /* ═════════════════════════════════════════════════════════════
     7) محرك الحركة GSAP + ScrollTrigger
     ═════════════════════════════════════════════════════════════ */
  useLayoutEffect(() => {
    if (!isInitialized) return;
    const root = rootRef.current;
    if (!root) return;

    if (reduced) {
      loadSingleFrame(0, 0).then((img) => img && renderImageToCanvas(img));
      return;
    }

    const ctx = gsap.context(() => {
      const captions = gsap.utils.toArray<HTMLElement>("[data-caption]");
      const markers = gsap.utils.toArray<HTMLElement>("[data-marker]");

      // أنيميشن النصوص في البداية
      const intro = gsap.timeline({ delay: 0.1, defaults: { ease: "power4.out" } });
      intro
        .fromTo(".js-title-line", { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.08 }, 0.1)
        .fromTo(".js-title-sub", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 }, 0.6)
        .fromTo(".js-hero-ui", { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.05 }, 0.7);

      const progressObj = { value: 0 };

      // دالة الرسم المربوطة بـ Ticker التابع لـ GSAP لمنع الـ Layout Thrashing
      let lastVal = -1;
      const onTick = () => {
        if (progressObj.value === lastVal) return;
        lastVal = progressObj.value;

        const totalProgress = progressObj.value;
        let currentScene = Math.floor(totalProgress);
        let sceneProgress = totalProgress - currentScene;

        if (currentScene >= SCENES.length) {
          currentScene = SCENES.length - 1;
          sceneProgress = 1;
        }

        const currentFrame = Math.min(
          FRAME_COUNT - 1,
          Math.max(0, Math.floor(sceneProgress * FRAME_COUNT))
        );

        renderFrame(currentScene, currentFrame);
      };

      gsap.ticker.add(onTick);

      // التايملاين المرتبط بالـ Scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3, // سلاسة مطلقة وسرعة استجابة مذهلة
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // تحديث قيمة التقدم التي يراقبها الـ Ticker
            progressObj.value = self.progress * SCENES.length;
          },
        },
      });

      tl.to(".js-title", { opacity: 0, y: -40, scale: 0.98, duration: 0.3, ease: "power2.in" }, 0.15);
      tl.to(".js-hero-cta", { opacity: 0, duration: 0.2 }, 0.15);
      tl.to(".js-scroll-cue", { opacity: 0, duration: 0.1 }, 0.05);

      captions.forEach((cap, i) => {
        const enter = [0.25, 1.15, 2.15][i];
        const exit = [0.85, 1.85, 2.9][i];

        tl.fromTo(cap, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, enter);
        if (i < captions.length - 1) {
          tl.to(cap, { opacity: 0, y: -15, duration: 0.15, ease: "power2.in" }, exit);
        }
      });

      tl.fromTo(".js-rail-fill", { scaleY: 0 }, { scaleY: 1, duration: SCENES.length, ease: "none" }, 0);
      markers.forEach((m, i) => {
        tl.to(m, { opacity: 1, color: "#c2a264", duration: 0.01 }, [0.05, 1.05, 2.05][i]);
      });

      tl.fromTo(".js-endnote", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.2 }, 2.75);
      tl.to(".js-endnote", { opacity: 0, duration: 0.15 }, 2.95);
      tl.to([".js-rail", ".js-caption-stack"], { opacity: 0, duration: 0.15 }, 2.9);

      return () => {
        gsap.ticker.remove(onTick);
      };
    }, root);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, [isInitialized, reduced, renderFrame, loadSingleFrame, renderImageToCanvas]);

  return (
    <section
      id="project"
      ref={rootRef}
      aria-label="VÉRA — a cinematic journey"
      className="relative h-[450vh] bg-[#0a0a0a] md:h-[550vh]"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-[#0a0a0a]">
        
        {/* 1. صورة Poster فورية - مخفية عبر CSS الترانزيشن بمجرد أن يرسم الكانفاس أول فريم بنجاح */}
        <img
          ref={posterRef}
          src={getFramePath(SCENES[0].folder, 1)}
          alt="Hero Background"
          // @ts-ignore
          fetchpriority="high"
          loading="eager"
          decoding="sync"
          className="absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity duration-300 ease-out z-10 opacity-100"
        />

        {/* 2. الكانفاس الرئيسي - يبدأ بـ opacity-0 لضمان عدم ظهور أي شاشة سوداء إطلاقاً ثم يظهر بلحظة سحرية */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 block h-full w-full pointer-events-none select-none z-20 transition-opacity duration-300 opacity-0"
        />

        {/* النصوص والعناصر المرئية الزخرفية */}
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

        {/* نصوص المشاهد المتغيرة */}
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

        {/* مؤشر السكة الجانبي */}
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

        {/* مؤشر السكرول السفلي */}
        <div className="js-scroll-cue js-hero-ui pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:bottom-10 md:flex z-40">
          <span className="eyebrow text-ivory/55">Scroll</span>
          <span className="relative h-9 w-px overflow-hidden bg-ivory/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.9s_var(--ease-cinematic)_infinite] bg-champagne" />
          </span>
        </div>

        <div className="js-endnote pointer-events-none absolute inset-x-0 bottom-12 flex flex-col items-center gap-4 opacity-0 z-40">
          <p className="eyebrow text-champagne">The VÉRA world continues below</p>
          <ArrowDown className="h-4 w-4 text-ivory/60" strokeWidth={1.25} />
        </div>

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