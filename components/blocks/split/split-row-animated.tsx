// components/blocks/split/split-row-animated.tsx
"use client";

import type React from "react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult, type ColorVariant } from "@/sanity.types";
import SplitContent from "./split-content";
import SplitCardsListAnimated from "./split-cards-list-animated";
import SplitImage from "./split-image";
import SplitImageAnimate from "./split-image-animate";
import SplitInfoList from "./split-info-list";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSectionId } from "@/lib/section-id";
import TitleText from "@/components/ui/title-text";

gsap.registerPlugin(ScrollTrigger);

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRowAnimated = Extract<Block, { _type: "split-row-animated" }>;
type SplitColumnAnimated = NonNullable<
  NonNullable<SplitRowAnimated["splitColumns"]>[number]
>;

const componentMap: {
  [K in Exclude<
    SplitColumnAnimated["_type"],
    "split-cards-list-animated" | "split-image-animate"
  >]: React.ComponentType<Extract<SplitColumnAnimated, { _type: K }>>;
} = {
  "split-content": SplitContent,
  "split-image": SplitImage,
  "split-info-list": SplitInfoList,
};

const introPaddingClasses: Record<
  NonNullable<SplitRowAnimated["introPadding"]>,
  string
> = {
  none: "pt-0",
  sm: "pt-8",
  md: "pt-12",
  lg: "pt-20",
};

const PIN_DISTANCE_VH = 300;
const NAV_HEIGHT = 80;

export default function SplitRowAnimated({
  _key,
  anchor,
  padding,
  colorVariant,
  noGap,
  splitColumns,

  tagLine,
  title,
  body,
  links,
  introPadding,
  animateText,
  stickyIntro,
}: SplitRowAnimated) {
  const cleanedColor = stegaClean(colorVariant);
  const color = (cleanedColor ?? undefined) as ColorVariant | undefined;
  const sectionId = getSectionId(
    "split-row-animated",
    _key,
    anchor?.anchorId ?? null,
  );

  const safeLinks = links ?? [];
  const introHasContent =
    !!tagLine || !!title || !!body || safeLinks.length > 0;

  const introPaddingClass =
    introPaddingClasses[
    (introPadding || "md") as keyof typeof introPaddingClasses
    ];

  const sectionRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  const [activeCardIndex, setActiveCardIndex] = useState<number>(-1);
  const [imageStage, setImageStage] = useState<number>(0);

  const lastStageRef = useRef<number>(-1);
  const firstCardShownRef = useRef<boolean>(false);

  // ✅ NEW: prevents React from flipping active styles BEFORE exit animation completes
  const suppressActiveUpdateRef = useRef<boolean>(false);

  let containerStyle: CSSProperties | undefined;
  if (typeof anchor?.defaultOffsetPercent === "number") {
    containerStyle = {} as CSSProperties;
    (containerStyle as any)["--section-anchor-offset"] =
      String(anchor.defaultOffsetPercent);
  }

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const gridEl = gridRef.current;
    const imageEl = imageRef.current;
    const cardsContainer = cardsRef.current;

    if (!sectionEl) return;

    lastStageRef.current = -1;
    firstCardShownRef.current = false;
    suppressActiveUpdateRef.current = false;

    const ctx = gsap.context(() => {
      const cardItemEls = cardsContainer
        ? Array.from(
          cardsContainer.querySelectorAll<HTMLElement>("[data-card-item]"),
        )
        : [];

      const hasAnimatedCards =
        splitColumns?.some(
          (column) =>
            column._type === "split-cards-list-animated" &&
            (column as any).animateInRight,
        ) ?? false;

      const ovalEl = imageEl
        ? (imageEl.querySelector("[data-oval-container]") as HTMLElement | null)
        : null;

      const mm = gsap.matchMedia();

      mm.add(
        { isDesktop: "(min-width: 1024px)", isMobile: "(max-width: 1023.98px)" },
        (context) => {
          const { isDesktop, isMobile } = context.conditions as {
            isDesktop: boolean;
            isMobile: boolean;
          };

          // NO CARDS
          if (!cardItemEls.length) {
            if (imageEl) {
              gsap.fromTo(
                imageEl,
                { autoAlpha: 0, y: 30 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.8,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: imageEl,
                    start: isDesktop ? "top 75%" : "top 85%",
                    toggleActions: "play none none none",
                  },
                },
              );
            }
            return;
          }

          // DESKTOP
          if (isDesktop) {
            if (!gridEl) return;

            const enterCard = (index: number) => {
              const el = cardItemEls[index];
              if (!el) return;

              const xOffset = hasAnimatedCards ? 32 * index : 0;
              const yOffset = hasAnimatedCards ? -24 * index : 0;

              gsap.fromTo(
                el,
                { autoAlpha: 0, x: xOffset + 120, y: yOffset },
                {
                  autoAlpha: 1,
                  x: xOffset,
                  y: yOffset,
                  duration: 0.6,
                  ease: "power3.out",
                },
              );
            };

            // ✅ UPDATED: exit keeps card “active” until animation ends
            const exitCard = (index: number, onComplete?: () => void) => {
              const el = cardItemEls[index];
              if (!el) return;

              const xOffset = hasAnimatedCards ? 32 * index : 0;
              const yOffset = hasAnimatedCards ? -24 * index : 0;

              suppressActiveUpdateRef.current = true;

              gsap.to(el, {
                autoAlpha: 0,
                x: xOffset + 120,
                y: yOffset,
                duration: 0.4,
                ease: "power3.inOut",
                onComplete: () => {
                  suppressActiveUpdateRef.current = false;
                  onComplete?.();
                },
              });
            };

            // initial enter/exit layer state
            cardItemEls.forEach((el, index) => {
              const xOffset = hasAnimatedCards ? 32 * index : 0;
              const yOffset = hasAnimatedCards ? -24 * index : 0;

              gsap.set(el, {
                autoAlpha: 0,
                x: xOffset + 120,
                y: yOffset,
                zIndex: 10 + index,
              });
            });

            // oval initial
            if (ovalEl) {
              gsap.set(ovalEl, { scale: 0.9, transformOrigin: "50% 50%" });
            }

            // IMAGE + FIRST CARD
            if (imageEl) {
              gsap.set(imageEl, { autoAlpha: 0, y: 40 });

              ScrollTrigger.create({
                trigger: gridEl,
                start: "top 80%",
                toggleActions: "play none none none",
                onEnter: () => {
                  gsap.to(imageEl, {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                  });

                  if (cardItemEls.length > 0 && !firstCardShownRef.current) {
                    enterCard(0);
                    firstCardShownRef.current = true;
                    setActiveCardIndex(0);
                    setImageStage(2);
                  }
                },
              });
            }

            // drift (pinned progress-driven)
            const driftEls = cardsContainer
              ? gsap.utils.toArray<HTMLElement>("[data-card-drift]", cardsContainer)
              : [];

            const driftSetters = driftEls.map((el) => ({
              x: gsap.quickSetter(el, "xPercent"),
              y: gsap.quickSetter(el, "yPercent"),
            }));

            const baseOffsetXPx = 80;
            const baseOffsetYPx = 80;

            // keep your chosen multiplier
            const multiplier = (i: number) => [1, 1.35, 1.75][i] ?? (1 + i * 0.4);

            gsap.set(driftEls, { xPercent: 0, yPercent: 0 });

            const updateDrift = (p: number) => {
              const baseX =
                window.innerWidth > 0
                  ? (baseOffsetXPx / window.innerWidth) * 100
                  : 0;
              const baseY =
                window.innerHeight > 0
                  ? (baseOffsetYPx / window.innerHeight) * 100
                  : 0;

              for (let i = 0; i < driftSetters.length; i++) {
                const m = multiplier(i);
                driftSetters[i].x(gsap.utils.interpolate(0, -baseX * m, p));
                driftSetters[i].y(gsap.utils.interpolate(0, -baseY * m, p));
              }
            };

            const applyStageChange = (prev: number, next: number) => {
              if (prev === next) return;

              // leaving pinned region upwards
              if (next < 0) {
                if (prev >= 0) {
                  // exit cards while keeping current active colour
                  // update active AFTER the last exit completes
                  let remaining = prev + 1;
                  for (let i = prev; i >= 0; i--) {
                    exitCard(i, () => {
                      remaining -= 1;
                      if (remaining <= 0) {
                        firstCardShownRef.current = false;
                        setActiveCardIndex(-1);
                        setImageStage(0);
                      }
                    });
                  }
                } else {
                  firstCardShownRef.current = false;
                  setActiveCardIndex(-1);
                  setImageStage(0);
                }
                return;
              }

              // forward (normal)
              if (next > prev) {
                for (let i = Math.max(0, prev + 1); i <= next; i++) {
                  if (i === 0 && firstCardShownRef.current) continue;
                  enterCard(i);
                }

                if (ovalEl) {
                  const scale =
                    next === 0 ? 1 : next === 1 ? 1.08 : next >= 2 ? 1.16 : 0.9;
                  gsap.to(ovalEl, { scale, duration: 0.8, ease: "power3.out" });
                }

                const clamped = Math.max(0, Math.min(next, cardItemEls.length - 1));
                if (!suppressActiveUpdateRef.current) {
                  setActiveCardIndex(clamped);
                  setImageStage(2 + clamped);
                }
                return;
              }

              // ✅ backward: animate out FIRST, then switch active index
              if (next < prev) {
                let remaining = prev - next; // number of cards exiting
                for (let i = prev; i > next; i--) {
                  exitCard(i, () => {
                    remaining -= 1;
                    if (remaining <= 0) {
                      if (ovalEl) {
                        const scale =
                          next === 0
                            ? 1
                            : next === 1
                              ? 1.08
                              : next >= 2
                                ? 1.16
                                : 0.9;
                        gsap.to(ovalEl, { scale, duration: 0.8, ease: "power3.out" });
                      }

                      const clamped = Math.max(
                        0,
                        Math.min(next, cardItemEls.length - 1),
                      );

                      setActiveCardIndex(clamped);
                      setImageStage(2 + clamped);
                    }
                  });
                }
                return;
              }
            };

            const pinDistancePx = (PIN_DISTANCE_VH / 100) * window.innerHeight;

            // pin: drives both drift + stages
            ScrollTrigger.create({
              trigger: gridEl,
              start: `center-=${NAV_HEIGHT} center`,
              end: `+=${pinDistancePx}`,
              pin: gridEl,
              pinSpacing: true,
              scrub: true,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const p = self.progress;

                // drift across pinned duration
                updateDrift(p);

                // stage calc
                let stage = -1;
                if (p > 0 && p < 1 / 3) stage = 0;
                else if (p >= 1 / 3 && p < 2 / 3) stage = 1;
                else if (p >= 2 / 3) stage = 2;

                if (stage !== lastStageRef.current) {
                  const prev = lastStageRef.current;
                  lastStageRef.current = stage;
                  applyStageChange(prev, stage);
                }
              },
            });

            return;
          }

          // MOBILE / TABLET
          if (isMobile) {
            if (imageEl) {
              gsap.fromTo(
                imageEl,
                { autoAlpha: 0, y: 30 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.6,
                  ease: "power3.out",
                  scrollTrigger: {
                    trigger: imageEl,
                    start: "top 85%",
                    toggleActions: "play none none none",
                  },
                },
              );
            }

            cardItemEls.forEach((el, index) => {
              gsap.fromTo(
                el,
                { autoAlpha: 0, y: 30 },
                {
                  autoAlpha: 1,
                  y: 0,
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: "power2.out",
                  scrollTrigger: {
                    trigger: el,
                    start: "top 90%",
                    toggleActions: "play none none none",
                  },
                },
              );
            });

            if (cardItemEls.length > 0) {
              setActiveCardIndex(0);
              setImageStage(2);
            }
          }
        },
      );
    }, sectionEl);

    return () => ctx.revert();
  }, [splitColumns]);

  return (
    <SectionContainer
      id={sectionId}
      color={color}
      padding={padding}
      data-section-anchor-id={anchor?.anchorId || undefined}
      style={containerStyle}
    >
      <div ref={sectionRef} className="relative bg-background overflow-visible">
        {introHasContent && (
          <div
            className={cn(
              "text-center pt-8 lg:pt-20 pb-10",
              introPaddingClass,
              stickyIntro &&
              "lg:sticky lg:top-20 z-20 bg-background/80 backdrop-blur",
            )}
          >
            <div className="max-w-8xl mx-auto">
              {tagLine && (
                <h1 className="leading-[0] uppercase italic font-sans">
                  <span className="text-base font-semibold opacity-50">
                    {tagLine}
                  </span>
                </h1>
              )}

              {title && (
                <TitleText
                  variant="stretched"
                  as="h2"
                  size="xl"
                  align="center"
                  maxChars={32}
                  animation={animateText ? "typeOn" : "none"}
                  animationSpeed={1.2}
                >
                  {title}
                </TitleText>
              )}

              {body && (
                <div className="text-lg mt-6 max-w-2xl mx-auto">
                  <PortableTextRenderer value={body} />
                </div>
              )}

              {safeLinks.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  {safeLinks.map((link) => (
                    <Button
                      key={link.title}
                      variant={stegaClean(link?.buttonVariant)}
                      asChild
                    >
                      <Link
                        href={link.href || "#"}
                        target={link.target ? "_blank" : undefined}
                        rel={link.target ? "noopener" : undefined}
                      >
                        {link.title}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {splitColumns && splitColumns.length > 0 && (
          <div
            ref={gridRef}
            className={cn(
              "mt-4 grid grid-cols-1 lg:grid-cols-2 items-start max-w-6xl mx-auto w-full px-4 lg:px-8 overflow-visible",
              noGap ? "gap-0" : "gap-10 lg:gap-20",
            )}
          >
            {splitColumns.map((column) => {
              if (column._type === "split-cards-list-animated") {
                return (
                  <div
                    key={column._key}
                    ref={cardsRef}
                    className="flex flex-col overflow-visible order-2 px-6 lg:px-0 lg:order-1"
                  >
                    <SplitCardsListAnimated
                      {...(column as any)}
                      color={color}
                      activeIndex={activeCardIndex}
                      onHoverCard={undefined}
                    />
                  </div>
                );
              }

              if (column._type === "split-image-animate") {
                return (
                  <div
                    key={column._key}
                    ref={imageRef}
                    className="self-start overflow-visible order-1 lg:order-1 lg:mb-0 opacity-0 will-change-transform"
                  >
                    <SplitImageAnimate {...(column as any)} imageStage={imageStage} />
                  </div>
                );
              }

              const Component =
                componentMap[
                column._type as Exclude<
                  SplitColumnAnimated["_type"],
                  "split-cards-list-animated" | "split-image-animate"
                >
                ];

              if (!Component) {
                console.warn("No component implemented for:", column._type);
                return <div data-type={column._type} key={column._key} />;
              }

              return (
                <Component
                  {...(column as any)}
                  color={color}
                  noGap={noGap}
                  key={column._key}
                />
              );
            })}
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
