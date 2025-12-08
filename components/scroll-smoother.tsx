"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import ScrollSmoother from "gsap/ScrollSmoother";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
}

export default function SmoothScroller({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch {
      // ignore
    }

    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const isTouch =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    // Kill any existing smoother
    ScrollSmoother.get()?.kill();

    // Base fallback: allow scroll even if Smoother explodes
    wrapper.style.overflowY = "auto";
    wrapper.style.overflowX = "hidden";

    // Touch/mobile: no smoother, just native scroll
    if (isTouch) {
      content.style.transform = "none";
      return;
    }

    let smoother: ScrollSmoother | null = null;
    let refreshTimer: number | undefined;

    try {
      smoother = ScrollSmoother.create({
        wrapper,
        content,
        smooth: 1,
        smoothTouch: 0.1,
        effects: true,
        normalizeScroll: true,
      });

      refreshTimer = window.setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    } catch (err) {
      console.error("[SmoothScroller] ScrollSmoother.create failed", err);
    }

    return () => {
      if (refreshTimer !== undefined) {
        window.clearTimeout(refreshTimer);
      }
      smoother?.kill();
    };
  }, []);

  return (
    <div
      id="smooth-wrapper"
      ref={wrapperRef}
      className="relative min-h-screen" // important: no overflow-hidden here
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
