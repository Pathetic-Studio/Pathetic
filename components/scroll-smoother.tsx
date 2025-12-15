// components/scroll-smoother.tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

const SCROLL_STORAGE_KEY = "pathetic-scroll-y";

export default function SmoothScroller({
  children,
}: {
  children: React.ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    // Kill any existing smoother (route changes / HMR)
    ScrollSmoother.get()?.kill();

    // Read any saved scroll value (used for BOTH desktop + mobile)
    let restoredScroll = 0;
    try {
      const raw = window.localStorage.getItem(SCROLL_STORAGE_KEY);
      if (raw) {
        const parsed = parseFloat(raw);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          restoredScroll = parsed;
        }
      }
    } catch {
      // ignore
    }

    // Hide content while smoother + pinning init on desktop
    gsap.set(content, { opacity: 0 });

    let smoother: ScrollSmoother | null = null;
    const pinTriggers: ScrollTrigger[] = [];

    const parsePinDurationToPx = (raw: string | null, section: HTMLElement) => {
      const fallback = section.offsetHeight || window.innerHeight;
      if (!raw) return fallback;

      const value = raw.trim();
      if (!value) return fallback;

      if (/^-?\d+(\.\d+)?$/.test(value)) {
        const factor = parseFloat(value);
        if (Number.isNaN(factor)) return fallback;
        return Math.max(factor * window.innerHeight, 0);
      }

      if (value.endsWith("vh")) {
        const num = parseFloat(value.slice(0, -2));
        if (Number.isNaN(num)) return fallback;
        return Math.max((num / 100) * window.innerHeight, 0);
      }

      if (value.endsWith("px")) {
        const num = parseFloat(value.slice(0, -2));
        if (Number.isNaN(num)) return fallback;
        return Math.max(num, 0);
      }

      if (value.endsWith("%")) {
        const num = parseFloat(value.slice(0, -1));
        if (Number.isNaN(num)) return fallback;
        return Math.max((num / 100) * section.offsetHeight, 0);
      }

      return fallback;
    };

    const setupPinning = () => {
      pinTriggers.forEach((t) => t.kill());
      pinTriggers.length = 0;

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      if (!isDesktop) return;

      const pinnedSections = gsap.utils.toArray<HTMLElement>(
        '[data-pin-to-viewport="true"]',
      );

      pinnedSections.forEach((section) => {
        const startAttr = section.getAttribute("data-pin-start");
        const startValue =
          startAttr && startAttr.trim() !== "" ? startAttr : "top top";

        // Per-section pinSpacing control
        const pinSpacingAttr = section.getAttribute("data-pin-spacing");
        const pinSpacing =
          pinSpacingAttr === "false"
            ? false
            : pinSpacingAttr === "true"
              ? true
              : true; // default: true

        const trigger = ScrollTrigger.create({
          trigger: section,
          start: startValue,
          end: () => {
            const durationAttr = section.getAttribute("data-pin-duration");
            const px = parsePinDurationToPx(durationAttr, section);
            return `+=${px}`;
          },
          pin: true,
          pinSpacing,
          anticipatePin: pinSpacing ? 1 : 0,
        });

        pinTriggers.push(trigger);
      });
    };

    try {
      if (isTouch) {
        // MOBILE / TOUCH: NO smoother, native scroll, but still restore scroll
        content.style.transform = "none";
        // Show content immediately (no fade needed if you don't want it)
        gsap.set(content, { opacity: 1 });

        if (restoredScroll > 0) {
          // Wait a frame for layout, then restore scroll
          requestAnimationFrame(() => {
            try {
              window.scrollTo(0, restoredScroll);
            } catch {
              // ignore
            }
          });
        }
      } else {
        // DESKTOP: ScrollSmoother + pinning + fade-in
        smoother = ScrollSmoother.create({
          wrapper,
          content,
          smooth: 1,
          smoothTouch: 0.1,
          effects: true,
          normalizeScroll: false,
        });

        setupPinning();

        ScrollTrigger.refresh();

        requestAnimationFrame(() => {
          if (restoredScroll > 0) {
            try {
              smoother?.scrollTo(restoredScroll, false); // no animation
            } catch {
              // ignore
            }
          }

          gsap.to(content, { opacity: 1, duration: 0.15, ease: "none" });
        });
      }
    } catch (err) {
      console.error("[SmoothScroller] ScrollSmoother.create failed", err);
      setupPinning();
      ScrollTrigger.refresh();
      gsap.set(content, { opacity: 1 });
    }

    // Persist scroll on unload / reload for both desktop + mobile
    const handleBeforeUnload = () => {
      try {
        const y =
          window.scrollY ||
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          0;
        window.localStorage.setItem(SCROLL_STORAGE_KEY, String(y));
      } catch {
        // ignore
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      pinTriggers.forEach((t) => t.kill());
      smoother?.kill();
    };
  }, []);

  return (
    <div
      id="smooth-wrapper"
      ref={wrapperRef}
      className="relative min-h-screen overflow-x-hidden overflow-y-auto"
    >
      <div
        id="smooth-content"
        ref={contentRef}
        className="will-change-transform [transform:translate3d(0,0,0)]"
      >
        {children}
      </div>
    </div>
  );
}
