// src/components/hero/CinematicHero.tsx
import { useLayoutEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { prefersReducedMotion, scrollToTarget } from "../../lib/scroll";
import { SCENES } from "../../data/scenes";
import CinematicScene from "./CinematicScene";
import ArrowLink from "../ui/ArrowLink";

export default function CinematicHero() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = prefersReducedMotion();

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const videos = Array.from(root.querySelectorAll<HTMLVideoElement>("[data-video]"));

    // تهيئة الفيديوهات وتجميدها لتتحكمي بها يدوياً بالسكرول
    videos.forEach((v) => {
      v.muted = true;
      v.pause();
      if (v.readyState >= 1) {
        v.currentTime = 0.001;
      } else {
        v.addEventListener("loadedmetadata", () => {
          v.currentTime = 0.001;
        }, { once: true });
      }
    });

    // دالة Seek سريعة وفائقة الأداء
    const seekVideoFast = (v: HTMLVideoElement, targetTime: number) => {
      if (!v || !v.duration || v.seeking) return;
      if ("fastSeek" in v && typeof (v as any).fastSeek === "function") {
        (v as any).fastSeek(targetTime);
      } else {
        v.currentTime = targetTime;
      }
    };

    const ctx = gsap.context(() => {
      const layers = gsap.utils.toArray<HTMLElement>("[data-scene]");
      const captions = gsap.utils.toArray<HTMLElement>("[data-caption]");
      const markers = gsap.utils.toArray<HTMLElement>("[data-marker]");

      /* ————— أنيميشن ترحيبي عند فتح الصفحة لأول مرة ————— */
      if (!reduced) {
        const intro = gsap.timeline({ delay: 0.1, defaults: { ease: "power4.out" } });
        intro
          .fromTo(".js-title-line", { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.08 }, 0.1)
          .fromTo(".js-title-sub", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 }, 0.6)
          .fromTo(".js-hero-ui", { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.05 }, 0.7);
      }

      /* ————— الخط الزمني المرتبط بالسكرول ————— */
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.15, // استجابة فورية وحسية وناعمة جداً مع حركة اليد
          onUpdate: (self) => {
            const p = self.progress;

            // تحديث فريمات الفيديوهات بدقة وسلاسة متناهية
            if (p < 0.35) {
              const v0 = videos[0];
              if (v0?.duration) seekVideoFast(v0, (p / 0.35) * (v0.duration - 0.05));
            } else if (p >= 0.35 && p < 0.68) {
              const v1 = videos[1];
              if (v1?.duration) seekVideoFast(v1, ((p - 0.35) / 0.33) * (v1.duration - 0.05));
            } else {
              const v2 = videos[2];
              if (v2?.duration) seekVideoFast(v2, ((p - 0.68) / 0.32) * (v2.duration - 0.05));
            }

            // تفعيل وإخفاء الفيديوهات ذكياً لمنع ثقل الكارت والذاكرة
            layers[0].style.visibility = p <= 0.45 ? "visible" : "hidden";
            layers[1].style.visibility = (p >= 0.25 && p <= 0.78) ? "visible" : "hidden";
            layers[2].style.visibility = p >= 0.58 ? "visible" : "hidden";
          },
        },
      });

      // ضبط الحالات الأولية للطبقات والـ Z-Index
      gsap.set(layers[0], { opacity: 1, scale: 1, zIndex: 10 });
      gsap.set(layers[1], { opacity: 0, scale: 1.05, zIndex: 20 }); // يبدأ مكبراً قليلاً لينعم مع الانتقال
      gsap.set(layers[2], { opacity: 0, scale: 1.05, zIndex: 30 }); // يبدأ مكبراً قليلاً لينعم مع الانتقال

      /* ═════════ الانتقالات السينمائية الخارقة (Hollywood Match-Move) ═════════ */
      
      // الانتقال الأول: من المشهد 01 إلى المشهد 02 (يبدأ التداخل عند progress 0.6 ويستمر حتى 0.95)
      // تمدد خفيف للمشهد الأول كأننا نعبر من خلاله
      tl.to(layers[0], { scale: 1.04, duration: 0.8 }, 0);
      tl.to(layers[0], { opacity: 0, duration: 0.35, ease: "power2.inOut" }, 0.6);
      
      // ظهور المشهد الثاني من العمق مع عودته لحجمه الطبيعي 100% بنعومة بالغة
      tl.to(layers[1], { opacity: 1, duration: 0.38, ease: "power2.inOut" }, 0.58);
      tl.to(layers[1], { scale: 1, duration: 0.42, ease: "power1.out" }, 0.58);

      // الانتقال الثاني: من المشهد 02 إلى المشهد 03
      // تمدد خفيف للمشهد الثاني
      tl.to(layers[1], { scale: 1.04, duration: 0.8 }, 1.0);
      tl.to(layers[1], { opacity: 0, duration: 0.35, ease: "power2.inOut" }, 1.6);
      
      // ظهور المشهد الثالث بنعومة بالغة
      tl.to(layers[2], { opacity: 1, duration: 0.38, ease: "power2.inOut" }, 1.58);
      tl.to(layers[2], { scale: 1, duration: 0.42, ease: "power1.out" }, 1.58);

      /* ═════════ حركة النصوص والـ UI ═════════ */
      tl.to(".js-title", { opacity: 0, y: -50, scale: 0.98, duration: 0.3, ease: "power2.in" }, 0.15);
      tl.to(".js-hero-cta", { opacity: 0, duration: 0.2 }, 0.15);
      tl.to(".js-scroll-cue", { opacity: 0, duration: 0.1 }, 0.05);

      captions.forEach((cap, i) => {
        const enter = [0.22, 0.95, 1.95][i];
        const exit = [0.65, 1.65, 99][i];

        tl.fromTo(
          cap,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" },
          enter
        );
        if (exit < 90) {
          tl.to(cap, { opacity: 0, y: -18, duration: 0.12, ease: "power2.in" }, exit);
        }
      });

      // مؤشر التقدم الجانبي الفخم
      tl.fromTo(".js-rail-fill", { scaleY: 0 }, { scaleY: 1, duration: 2.65 }, 0);
      markers.forEach((m, i) => {
        tl.to(m, { opacity: 1, color: "#c2a264", duration: 0.01 }, [0, 0.95, 1.95][i]);
      });

      // أنيميشن ختام البطل قبل دخول محتوى الصفحة التالي
      tl.fromTo(".js-endnote", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }, 2.4);
      tl.to(".js-endnote", { opacity: 0, duration: 0.08 }, 2.65);
      tl.to([".js-rail", ".js-caption-stack"], { opacity: 0, duration: 0.1 }, 2.55);

      ScrollTrigger.refresh();
    }, root);

    return () => {
      ctx.revert();
    };
  }, [reduced]);

  return (
    <section
      id="project"
      ref={rootRef}
      aria-label="VÉRA — a clean cinematic journey"
      className="relative h-[400vh] bg-transparent md:h-[450vh]"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-transparent">
        {/* — الفيديوهات المسرّعة مع ميزة التمدد العميق — */}
        <div className="absolute inset-0 [transform:translateZ(0)]">
          {SCENES.map((scene, i) => (
            <CinematicScene key={scene.id} scene={scene} priority={i === 0} />
          ))}
        </div>

        {/* — العنوان الرئيسي — */}
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

        {/* — نصوص المشاهد أسفل اليسار — */}
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

        {/* — مؤشر التقدم على اليمين — */}
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

        {/* — مؤشر السكرول — */}
        <div className="js-scroll-cue js-hero-ui pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:bottom-10 md:flex z-40">
          <span className="eyebrow text-ivory/55">Scroll</span>
          <span className="relative h-9 w-px overflow-hidden bg-ivory/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.9s_var(--ease-cinematic)_infinite] bg-champagne" />
          </span>
        </div>

        {/* — رسالة النهاية — */}
        <div className="js-endnote pointer-events-none absolute inset-x-0 bottom-12 flex flex-col items-center gap-4 opacity-0 z-40">
          <p className="eyebrow text-champagne">The VÉRA world continues below</p>
          <ArrowDown className="h-4 w-4 text-ivory/60" strokeWidth={1.25} />
        </div>

        {/* — زر استكشاف — */}
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