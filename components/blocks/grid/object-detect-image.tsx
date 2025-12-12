// components/blocks/grid/object-detect-image.tsx
"use client";

import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";
import { cn } from "@/lib/utils";

gsap.registerPlugin(SplitText);

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowImage = Extract<Block, { _type: "grid-row-image" }>;
type Item = NonNullable<NonNullable<GridRowImage["items"]>[number]>;
type ObjectDetectImageProps = Extract<Item, { _type: "object-detect-image" }>;

export default function ObjectDetectImage({
  title,
  body,
  image,
  featureImage,
  link,
  accentColor,
  accentTextColor,
  customWidth,
  customHeight,
  objectDetectHover,
}: ObjectDetectImageProps) {
  if (!image?.asset?._id) return null;

  const imageUrl = urlFor(image).url();
  const featureImageUrl =
    featureImage?.asset?._id ? urlFor(featureImage).url() : null;

  const accentBg = (accentColor as any)?.hex || undefined;
  const accentFg = (accentTextColor as any)?.hex || "#000";

  const hasCustomWidth = !!customWidth;
  const hasCustomHeight = !!customHeight;

  // IMAGE WRAPPER

  const wrapperClassName = cn(
    "relative overflow-hidden",
    !hasCustomWidth && !hasCustomHeight && "flex-1 min-h-[450px]",
    hasCustomHeight && !hasCustomWidth && "inline-block",
  );

  const wrapperStyle: CSSProperties = {
    ...(customWidth ? { width: customWidth } : {}),
    ...(customHeight ? { height: customHeight } : {}),
  };

  const fallbackWidth = 1600;
  const fallbackHeight = 900;

  const metaWidth =
    image.asset?.metadata?.dimensions?.width ?? fallbackWidth;
  const metaHeight =
    image.asset?.metadata?.dimensions?.height ?? fallbackHeight;

  const useFillImage =
    (!hasCustomWidth && !hasCustomHeight) ||
    (hasCustomWidth && hasCustomHeight);

  const imageClassName = cn(
    "object-cover",
    hasCustomHeight && !hasCustomWidth && "h-full w-auto",
    hasCustomWidth && !hasCustomHeight && "h-auto w-full",
    hasCustomWidth && hasCustomHeight && "h-full w-full",
    !hasCustomWidth && !hasCustomHeight && "h-auto w-full",
  );

  // PLAIN TEXT FOR BODY

  const bodyPlainText = useMemo(() => {
    if (!body) return "";
    try {
      const blocks = body as any[];
      return blocks
        .map((block) => {
          if (!block?.children) return "";
          return block.children
            .map((child: any) => child?.text || "")
            .join("");
        })
        .filter(Boolean)
        .join("\n\n");
    } catch {
      return "";
    }
  }, [body]);

  // HOVER / TYPE ANIM + MOBILE IN-VIEW ANIM

  const bodyOverlayRef = useRef<HTMLDivElement | null>(null);
  const bodyTextRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageWrapperRef = useRef<HTMLDivElement | null>(null);

  const isMobileRef = useRef(false);
  const isVisibleRef = useRef(false);

  const splitInstanceRef = useRef<SplitText | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  // OBJECT-DETECT HOVER / CROSSHAIR

  const [detectHovering, setDetectHovering] = useState(false);
  const [pos, setPos] = useState<{ xPct: number; yPct: number }>({
    xPct: 50,
    yPct: 50,
  });
  const targetRef = useRef<{ xPct: number; yPct: number }>({
    xPct: 50,
    yPct: 50,
  });

  // Determine mobile once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    isMobileRef.current = window.innerWidth < 768;
  }, []);

  // Ensure overlay is hidden initially
  useEffect(() => {
    const overlay = bodyOverlayRef.current;
    if (!overlay) return;

    gsap.set(overlay, {
      scale: 0.8,
      autoAlpha: 0,
      transformOrigin: "0% 0%",
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      tweenRef.current?.kill();
      splitInstanceRef.current?.revert();
    };
  }, []);

  const setupSplitLines = () => {
    const container = bodyTextRef.current;
    if (!container || !bodyPlainText) return null;

    splitInstanceRef.current?.revert();
    tweenRef.current?.kill();

    container.textContent = bodyPlainText;

    const split = new SplitText(container, { type: "lines" });
    splitInstanceRef.current = split;

    const lines = split.lines as HTMLElement[];
    return lines;
  };

  const runTypeAnimation = (direction: "in" | "out") => {
    const lines = setupSplitLines();
    if (!lines || lines.length === 0) return;

    const baseDuration = Math.max(
      0.4,
      Math.min(2.0, bodyPlainText.length / 40),
    );

    if (direction === "in") {
      gsap.set(lines, {
        clipPath: "inset(0 100% 0 0)",
      });

      tweenRef.current = gsap.to(lines, {
        clipPath: "inset(0 0% 0 0)",
        duration: baseDuration,
        ease: "power1.out",
        stagger: 0,
      });
    } else {
      tweenRef.current = gsap.to(lines, {
        clipPath: "inset(0 100% 0 0)",
        duration: 0.2,
        ease: "power1.in",
        stagger: 0,
      });
    }
  };

  const handleMouseEnter = () => {
    if (isMobileRef.current) return;

    const overlay = bodyOverlayRef.current;
    if (overlay && bodyPlainText) {
      gsap.to(overlay, {
        scale: 1,
        autoAlpha: 1,
        duration: 0.25,
        ease: "power2.out",
      });
      runTypeAnimation("in");
      isVisibleRef.current = true;
    }
  };

  const handleMouseLeave = () => {
    if (isMobileRef.current) return;

    const overlay = bodyOverlayRef.current;
    if (overlay && bodyPlainText) {
      gsap.to(overlay, {
        scale: 0.8,
        autoAlpha: 0,
        duration: 0.2,
        ease: "power2.in",
      });
      runTypeAnimation("out");
      isVisibleRef.current = false;
    }
  };

  // MOBILE: animate in when in view, animate out when out of view
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!bodyPlainText) return;
    if (!isMobileRef.current) return;

    const el = containerRef.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!isMobileRef.current) return;

          const overlay = bodyOverlayRef.current;
          if (!overlay || !bodyPlainText) return;

          if (entry.isIntersecting) {
            if (isVisibleRef.current) return;

            isVisibleRef.current = true;
            gsap.to(overlay, {
              scale: 1,
              autoAlpha: 1,
              duration: 0.25,
              ease: "power2.out",
            });
            runTypeAnimation("in");
          } else {
            if (!isVisibleRef.current) return;

            isVisibleRef.current = false;
            gsap.to(overlay, {
              scale: 0.8,
              autoAlpha: 0,
              duration: 0.2,
              ease: "power2.in",
            });
            runTypeAnimation("out");
          }
        });
      },
      {
        threshold: 0.4,
      },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [bodyPlainText]);

  // OBJECT-DETECT HOVER: smoothed crosshair tracking
  useEffect(() => {
    if (!objectDetectHover) return;
    if (isMobileRef.current) return;

    let rafId: number | null = null;

    const tick = () => {
      if (!detectHovering) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      setPos((prev) => {
        const alpha = 0.18;
        const nx = prev.xPct + (targetRef.current.xPct - prev.xPct) * alpha;
        const ny = prev.yPct + (targetRef.current.yPct - prev.yPct) * alpha;
        return { xPct: nx, yPct: ny };
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [objectDetectHover, detectHovering]);

  const clampPct = (v: number) => Math.max(0, Math.min(100, v));

  const handleDetectEnter = () => {
    if (!objectDetectHover) return;
    if (isMobileRef.current) return;
    setDetectHovering(true);
  };

  const handleDetectLeave = () => {
    if (!objectDetectHover) return;
    if (isMobileRef.current) return;
    setDetectHovering(false);
  };

  const handleDetectMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!objectDetectHover) return;
    if (isMobileRef.current) return;

    const el = imageWrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    targetRef.current = { xPct: clampPct(x), yPct: clampPct(y) };
  };

  const xValue = pos.xPct.toFixed(5);
  const yValue = pos.yPct.toFixed(5);

  const isRightEdge = pos.xPct > 70;
  const isTopEdge = pos.yPct < 20;

  return (
    <div className="flex h-full" ref={containerRef}>
      <div
        className="inline-flex flex-col items-start"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image + object-detect hover */}
        <div
          ref={imageWrapperRef}
          className={wrapperClassName}
          style={wrapperStyle}
          onMouseEnter={handleDetectEnter}
          onMouseLeave={handleDetectLeave}
          onMouseMove={handleDetectMove}
        >
          {/* Base image */}
          {useFillImage ? (
            <Image
              src={imageUrl}
              alt={image.alt || ""}
              fill
              sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
              className={imageClassName}
              quality={100}
            />
          ) : (
            <Image
              src={imageUrl}
              alt={image.alt || ""}
              width={metaWidth}
              height={metaHeight}
              className={imageClassName}
              quality={100}
            />
          )}

          {/* Feature image: fade on/off with hover, accent overlay */}
          {objectDetectHover && featureImageUrl && (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-10 transition-opacity duration-300",
                detectHovering ? "opacity-100" : "opacity-0",
              )}
            >
              <Image
                src={featureImageUrl}
                alt={featureImage?.alt || image.alt || ""}
                fill
                sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                className={imageClassName}
                quality={100}
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: accentBg,
                  opacity: 0.32,
                  mixBlendMode: "soft-light",
                }}
              />
            </div>
          )}

          {/* Crosshair + coordinates overlay */}
          {objectDetectHover && (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-20 transition-opacity duration-150",
                detectHovering ? "opacity-100" : "opacity-0",
              )}
            >
              {/* vertical line */}
              <div
                className="absolute top-0 bottom-0 w-px"
                style={{
                  left: `${pos.xPct}%`,
                  transform: "translateX(-0.5px)",
                  backgroundColor: accentBg,
                  boxShadow: accentBg
                    ? `0 0 8px ${accentBg}, 0 0 18px ${accentBg}`
                    : undefined,
                }}
              />
              {/* horizontal line */}
              <div
                className="absolute left-0 right-0 h-px"
                style={{
                  top: `${pos.yPct}%`,
                  transform: "translateY(-0.5px)",
                  backgroundColor: accentBg,
                  boxShadow: accentBg
                    ? `0 0 8px ${accentBg}, 0 0 18px ${accentBg}`
                    : undefined,
                }}
              />
              {/* centre dot */}
              <div
                className="absolute h-2 w-2 rounded-full"
                style={{
                  left: `${pos.xPct}%`,
                  top: `${pos.yPct}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: accentBg,
                  boxShadow: accentBg
                    ? `0 0 10px ${accentBg}, 0 0 24px ${accentBg}`
                    : undefined,
                }}
              />

              {/* coordinate readout – follows cursor, offset and flips near edges, no background */}
              <div
                className="absolute text-[11px] font-mono leading-tight"
                style={{
                  left: `${pos.xPct}%`,
                  top: `${pos.yPct}%`,
                  // independent edge handling:
                  // - right edge → flip to the left
                  // - top edge  → move down instead of up
                  transform: `translate(${isRightEdge ? "-110%" : "10px"}, ${isTopEdge ? "5px" : "-30px"
                    })`,
                  color: accentBg,
                  whiteSpace: "nowrap",
                }}
              >
                <div>x {xValue}</div>
                <div>y {yValue}</div>
              </div>
            </div>
          )}

          {/* Border accent */}
          <div
            className="pointer-events-none absolute inset-0 z-30 border-2"
            style={accentBg ? { borderColor: accentBg } : undefined}
          />
        </div>

        {/* Title + body */}
        <div className="-mt-[2px] flex max-w-full flex-col items-start">
          {title && (
            <div
              className="inline-flex px-3 py-1 text-base font-semibold uppercase tracking-tight"
              style={
                accentBg
                  ? {
                    backgroundColor: accentBg,
                    color: accentFg,
                  }
                  : undefined
              }
            >
              <span>{title}</span>
            </div>
          )}

          {body && bodyPlainText && (
            <div
              className={cn(
                "-top-2 relative inline-block text-sm lg:text-base leading-tight",
                "w-full max-w-xs sm:w-[60vw] sm:max-w-sm md:w-[50vw] md:max-w-md lg:w-auto",
              )}
            >
              {/* Invisible backing text to preserve layout */}
              <div className="invisible whitespace-pre-wrap px-3 py-2">
                {bodyPlainText}
              </div>

              {/* Animated overlay */}
              <div
                ref={bodyOverlayRef}
                className="pointer-events-none absolute inset-0 whitespace-pre-wrap px-3 py-2"
                style={
                  accentBg
                    ? {
                      backgroundColor: accentBg,
                      color: accentFg,
                    }
                    : undefined
                }
              >
                <div ref={bodyTextRef} />
              </div>
            </div>
          )}

          {link && link.href && (
            <div className="mt-2 pt-1">
              <Link
                href={link.href}
                target={link.target ? "_blank" : undefined}
                rel={link.target ? "noopener" : undefined}
                className="inline-flex items-center text-sm font-medium uppercase tracking-tight underline-offset-4 hover:underline"
              >
                {link.title || "Learn more"}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
