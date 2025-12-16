// components/scroll-smoother.tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

export default function SmoothScroller({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // in-memory only (prevents “come back to overlay section” on navigation)
  const savedTabScrollRef = useRef<number>(0);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      // ignore
    }

    ScrollTrigger.config({
      autoRefreshEvents: "DOMContentLoaded,load,resize",
    });

    wrapper.style.overflowAnchor = "none";
    content.style.overflowAnchor = "none";
    document.documentElement.style.overflowAnchor = "none";
    document.body.style.overflowAnchor = "none";

    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    ScrollSmoother.get()?.kill();

    try {
      window.scrollTo(0, 0);
    } catch {
      // ignore
    }

    gsap.set(content, { opacity: 0 });

    let smoother: ScrollSmoother | null = null;

    const pinTriggers: ScrollTrigger[] = [];
    let ro: ResizeObserver | null = null;

    let suppressRefresh = false;

    const getScrollY = () => {
      if (smoother) return smoother.scrollTop();
      return (
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        0
      );
    };

    const setScrollY = (y: number) => {
      if (smoother) smoother.scrollTo(y, false);
      else window.scrollTo(0, y);
    };

    const parsePinDurationToPx = (raw: string | null, section: HTMLElement) => {
      const natural =
        Math.max(section.scrollHeight, section.offsetHeight) ||
        window.innerHeight;

      if (!raw) return natural;

      const value = raw.trim();
      if (!value) return natural;

      if (/^-?\d+(\.\d+)?$/.test(value)) {
        const factor = parseFloat(value);
        if (Number.isNaN(factor)) return natural;
        return Math.max(factor * window.innerHeight, 0);
      }

      if (value.endsWith("vh")) {
        const num = parseFloat(value.slice(0, -2));
        if (Number.isNaN(num)) return natural;
        return Math.max((num / 100) * window.innerHeight, 0);
      }

      if (value.endsWith("px")) {
        const num = parseFloat(value.slice(0, -2));
        if (Number.isNaN(num)) return natural;
        return Math.max(num, 0);
      }

      if (value.endsWith("%")) {
        const num = parseFloat(value.slice(0, -1));
        if (Number.isNaN(num)) return natural;
        return Math.max((num / 100) * natural, 0);
      }

      return natural;
    };

    const setupPinning = () => {
      pinTriggers.forEach((t) => t.kill());
      pinTriggers.length = 0;

      ro?.disconnect();
      ro = null;

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (!isDesktop) return;

      const pinnedSections = gsap.utils.toArray<HTMLElement>(
        '[data-pin-to-viewport="true"]',
      );

      pinnedSections.forEach((el) => {
        el.style.overflowAnchor = "none";
      });

      ro = new ResizeObserver(() => {
        if (suppressRefresh) return;
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });
      pinnedSections.forEach((el) => ro?.observe(el));

      pinnedSections.forEach((section) => {
        const startAttr = section.getAttribute("data-pin-start");
        const startValue =
          startAttr && startAttr.trim() !== "" ? startAttr : "top top";

        const pinSpacingAttr = section.getAttribute("data-pin-spacing");
        const pinSpacing =
          pinSpacingAttr === "false"
            ? false
            : pinSpacingAttr === "true"
              ? true
              : true;

        const pinTarget =
          section.querySelector<HTMLElement>('[data-pin-target="true"]') ||
          section;

        const trigger = ScrollTrigger.create({
          trigger: section,
          start: startValue,
          end: () => {
            const durationAttr = section.getAttribute("data-pin-duration");
            const px = parsePinDurationToPx(durationAttr, section);
            return `+=${px}`;
          },
          pin: pinTarget,
          pinSpacing,
          anticipatePin: pinSpacing ? 1 : 0,
          pinReparent: true,
          invalidateOnRefresh: true,
        });

        pinTriggers.push(trigger);
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const freezeOnHidden = () => {
      savedTabScrollRef.current = getScrollY();
      suppressRefresh = true;

      smoother?.paused(true);

      ScrollTrigger.getAll().forEach((t) => t.disable(false));
    };

    const resumeOnVisible = () => {
      if (!smoother) {
        suppressRefresh = false;
        return;
      }

      const y = savedTabScrollRef.current || 0;

      requestAnimationFrame(() => {
        ScrollTrigger.getAll().forEach((t) => t.enable(false));
        ScrollTrigger.refresh();

        requestAnimationFrame(() => {
          setScrollY(y);
          smoother?.paused(false); // <-- fixes TS18047
          ScrollTrigger.refresh();
          suppressRefresh = false;
        });
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") freezeOnHidden();
      else resumeOnVisible();
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        savedTabScrollRef.current = 0;
        requestAnimationFrame(() => {
          setScrollY(0);
          ScrollTrigger.refresh();
        });
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);

    try {
      if (isTouch) {
        content.style.transform = "none";
        gsap.set(content, { opacity: 1 });

        requestAnimationFrame(() => {
          try {
            window.scrollTo(0, 0);
          } catch {
            // ignore
          }
        });
      } else {
        smoother = ScrollSmoother.create({
          wrapper,
          content,
          smooth: 1,
          smoothTouch: 0.1,
          effects: true,
          normalizeScroll: false,
        });

        setupPinning();

        requestAnimationFrame(() => {
          setScrollY(0);
          gsap.to(content, { opacity: 1, duration: 0.15, ease: "none" });
          requestAnimationFrame(() => ScrollTrigger.refresh());
        });
      }
    } catch (err) {
      console.error("[SmoothScroller] ScrollSmoother.create failed", err);
      setupPinning();
      ScrollTrigger.refresh();
      gsap.set(content, { opacity: 1 });
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);

      ro?.disconnect();
      pinTriggers.forEach((t) => t.kill());
      smoother?.kill();
    };
  }, [pathname]);

  return (
    <div
      id="smooth-wrapper"
      ref={wrapperRef}
      className="relative h-screen overflow-hidden overflow-x-hidden [overflow-anchor:none]"
    >
      <div
        id="smooth-content"
        ref={contentRef}
        className="min-h-screen will-change-transform [transform:translate3d(0,0,0)] [overflow-anchor:none]"
      >
        {children}
      </div>
    </div>
  );
}
