// components/blocks/split/split-cards-list-animated.tsx
"use client";

import type { PAGE_QUERYResult, ColorVariant } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import { cn } from "@/lib/utils";
import SplitCardsItemAnimated from "./split-cards-item-animated";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRowAnimated = Extract<Block, { _type: "split-row-animated" }>;
type SplitColumnsAnimated = NonNullable<SplitRowAnimated["splitColumns"]>[number];
type SplitCardsListAnimatedBase = Extract<
  SplitColumnsAnimated,
  { _type: "split-cards-list-animated" }
>;

interface SplitCardsListAnimatedProps extends SplitCardsListAnimatedBase {
  color?: ColorVariant;
  activeIndex?: number;
  onHoverCard?: (index: number) => void;
}

export default function SplitCardsListAnimated({
  color,
  list,
  animateInRight,
  activeIndex = 0,
}: SplitCardsListAnimatedProps) {
  const colorParent = stegaClean(color);

  if (!list || list.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col overflow-visible",
        animateInRight ? "gap-8 lg:gap-0" : "gap-24",
      )}
      data-split-cards-container
    >
      {list.map((item, index) => (
        <div
          key={index}
          data-card-item
          className={cn(
            "transition-opacity duration-300 will-change-transform",
            // Mobile: visible by default; Desktop: start hidden & shifted for GSAP
            "opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-6",
          )}
        >
          <SplitCardsItemAnimated
            color={colorParent}
            tagLine={item.tagLine}
            title={item.title}
            body={item.body}
            active={activeIndex === index}
          />
        </div>
      ))}
    </div>
  );
}
