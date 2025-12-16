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
        // drift wrapper (GSAP drift writes transform here)
        <div
          key={index}
          data-card-drift
          className="will-change-transform transform-gpu"
        >
          {/* enter/exit layer (GSAP writes opacity + x/y here) */}
          <div data-card-item className="opacity-0 will-change-transform transform-gpu">
            <SplitCardsItemAnimated
              color={colorParent}
              tagLine={item.tagLine}
              title={item.title}
              body={item.body}
              active={activeIndex === index}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
