// components/ui/type-on-text.tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

type TypeOnTextProps = {
  text: string;
  className?: string;
  start?: string; // ScrollTrigger start, e.g. "top 80%"
};

export default function TypeOnText({
  text,
  className,
  start = "top 80%",
}: TypeOnTextProps) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    // Ensure the element contains the full text before splitting
    el.textContent = text;

    // Split into characters (and lines/words if needed later)
    const split = new SplitText(el, {
      type: "chars,words,lines",
    });

    const chars = split.chars || [];
    if (!chars.length) return;

    // Initial state: all chars invisible
    gsap.set(chars, { opacity: 0 });

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start,
        once: true,
        onEnter: () => {
          // Hardcoded per-letter timing
          const staggerPerChar = 0.04; // seconds between each char

          gsap.to(chars, {
            opacity: 1,      // 0 -> 1 instantly
            duration: 0,     // no fade time, just a jump
            stagger: staggerPerChar,
            ease: "none",
          });
        },
      });
    }, el);

    return () => {
      ctx.revert();
      split.revert(); // restore original text DOM
    };
  }, [text, start]);

  const combinedClassName = [
    "inline-block whitespace-pre-wrap",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      ref={wrapperRef}
      className={combinedClassName}
      aria-label={text}
    />
  );
}
