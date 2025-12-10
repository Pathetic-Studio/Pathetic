// components/menu-toggle.tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import gsap from "gsap";

import { Button } from "@/components/ui/button";

type ThemeMode = "light" | "dark";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);
  const [mode, setMode] = React.useState<ThemeMode>("light");

  const buttonRef = React.useRef<HTMLButtonElement | null>(null);

  // Wrappers around icons – these are what we animate
  const wrapperRefs = React.useRef<Record<ThemeMode, HTMLSpanElement | null>>({
    light: null,
    dark: null,
  });

  const currentModeRef = React.useRef<ThemeMode>("light");
  const prevModeRef = React.useRef<ThemeMode>("light");

  // Initial sync with theme (SSR-safe)
  React.useEffect(() => {
    const initialMode: ThemeMode = theme === "dark" ? "dark" : "light";

    setMode(initialMode);
    currentModeRef.current = initialMode;
    prevModeRef.current = initialMode;
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate wrappers when mode changes: OUT then IN
  React.useEffect(() => {
    if (!mounted) return;

    const prev = prevModeRef.current;
    const next = mode;
    if (prev === next) return;

    const prevWrapper = wrapperRefs.current[prev];
    const nextWrapper = wrapperRefs.current[next];

    if (!prevWrapper || !nextWrapper) {
      prevModeRef.current = next;
      currentModeRef.current = next;
      return;
    }

    // Kill any previous tweens on these wrappers
    gsap.killTweensOf(prevWrapper);
    gsap.killTweensOf(nextWrapper);

    const tl = gsap.timeline();

    // OUT: scale down current wrapper
    tl.to(prevWrapper, {
      scale: 0,
      opacity: 0,
      duration: 0.2,
      ease: "back.in(1.7)",
      onStart: () => {
        gsap.set(prevWrapper, { display: "flex" });
      },
      onComplete: () => {
        gsap.set(prevWrapper, { display: "none" });
      },
    });

    // IN: scale up new wrapper AFTER the out animation
    tl.fromTo(
      nextWrapper,
      {
        display: "flex",
        scale: 0,
        opacity: 0,
      },
      {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(1.7)",
      }
    );

    prevModeRef.current = next;
    currentModeRef.current = next;
  }, [mode, mounted]);

  // Hover animation for the active wrapper (not the SVG)
  React.useEffect(() => {
    const btn = buttonRef.current;
    if (!btn) return;

    const handleEnter = () => {
      const activeWrapper = wrapperRefs.current[currentModeRef.current];
      if (!activeWrapper) return;

      gsap.to(activeWrapper, {
        y: -2,
        rotation: 8,
        duration: 0.2,
        ease: "power2.out",
      });
    };

    const handleLeave = () => {
      const activeWrapper = wrapperRefs.current[currentModeRef.current];
      if (!activeWrapper) return;

      gsap.to(activeWrapper, {
        y: 0,
        rotation: 0,
        duration: 0.2,
        ease: "power2.inOut",
      });
    };

    btn.addEventListener("mouseenter", handleEnter);
    btn.addEventListener("mouseleave", handleLeave);

    return () => {
      btn.removeEventListener("mouseenter", handleEnter);
      btn.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const handleClick = () => {
    setMode((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      setTheme(next);
      currentModeRef.current = next;
      return next;
    });
  };

  if (!mounted) return null;

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="icon"
      size="icon"
      onClick={handleClick}
      className="relative flex items-center justify-center cursor-pointer transition-transform duration-150 ease-in-out overflow-hidden"
    >
      {/* Light wrapper + icon */}
      <span
        ref={(el) => {
          wrapperRefs.current.light = el;
        }}
        className="absolute inset-0 flex items-center justify-center"
        style={{ display: mode === "light" ? "flex" : "none" }}
      >
        <Sun className="h-[1.5rem] w-[1.5rem] scale-x-[0.6]" />
      </span>

      {/* Dark wrapper + icon */}
      <span
        ref={(el) => {
          wrapperRefs.current.dark = el;
        }}
        className="absolute inset-0 flex items-center justify-center"
        style={{ display: mode === "dark" ? "flex" : "none" }}
      >
        <Moon className="h-[1.5rem] w-[1.5rem] scale-x-[0.6]" />
      </span>

      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
