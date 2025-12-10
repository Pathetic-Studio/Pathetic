// components/blocks/grid/draggable-grid-item.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

import gsap from "gsap";
import Draggable from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import type { Draggable as DraggableInstance } from "gsap/Draggable";

type DraggableGridItemProps = {
  id: string;
  children: React.ReactNode;
  isActive: boolean;
  onActivate: (id: string) => void;
  className?: string;
};

const DRAG_THRESHOLD = 4; // px before we consider it a drag
let gsapRegistered = false;

export default function DraggableGridItem({
  id,
  children,
  isActive,
  onActivate,
  className,
}: DraggableGridItemProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const draggableRef = useRef<DraggableInstance | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  // Register GSAP plugins once
  if (typeof window !== "undefined" && !gsapRegistered) {
    gsap.registerPlugin(Draggable, InertiaPlugin);
    gsapRegistered = true;
  }

  const getBoundsElement = () => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return null;

    const isDesktop = window.innerWidth >= 1024;
    const selector = isDesktop
      ? "[data-grab-container-section]"
      : "[data-grab-container-grid]";

    return el.closest(selector) as HTMLElement | null;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined" || !gsapRegistered) return;

    const container = getBoundsElement();
    if (!container) return;

    // Kill any existing instance
    if (draggableRef.current) {
      draggableRef.current.kill();
      draggableRef.current = null;
    }

    const instance = Draggable.create(el, {
      type: "x,y",
      bounds: container,
      inertia: true,
      edgeResistance: 0.85,
      minimumMovement: DRAG_THRESHOLD,
      allowContextMenu: true,
      cursor: "grab",
      activeCursor: "grabbing",

      onPress() {
        onActivate(id);
      },

      onDragStart() {
        setIsDragging(true);
      },

      onDragEnd() {
        setIsDragging(false);
      },
    })[0];

    draggableRef.current = instance;

    // Update bounds on breakpoint change / resize
    const handleBoundsUpdate = () => {
      const newContainer = getBoundsElement();
      if (!newContainer || !draggableRef.current) return;
      draggableRef.current.applyBounds(newContainer);
    };

    const mql = window.matchMedia("(min-width: 1024px)");
    const mqHandler = () => handleBoundsUpdate();

    mql.addEventListener("change", mqHandler);
    window.addEventListener("resize", handleBoundsUpdate);

    return () => {
      mql.removeEventListener("change", mqHandler);
      window.removeEventListener("resize", handleBoundsUpdate);
      if (draggableRef.current) {
        draggableRef.current.kill();
        draggableRef.current = null;
      }
    };
  }, [id, onActivate]);

  const style: CSSProperties = {
    touchAction: "none",
    zIndex: isActive ? 40 : 10,
  };

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "relative transition-shadow duration-150 select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
    >
      {children}
    </div>
  );
}
