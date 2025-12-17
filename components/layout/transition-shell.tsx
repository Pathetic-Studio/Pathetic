// components/layout/transition-shell.tsx
"use client";

import { useRef } from "react";
import { TransitionRouter } from "next-transition-router";
import gsap from "gsap";

export default function TransitionShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pageRef = useRef<HTMLDivElement | null>(null);

    return (
        <TransitionRouter
            auto
            leave={(next) => {
                const el = pageRef.current;
                if (!el) return next();

                gsap.killTweensOf(el);

                gsap.to(el, {
                    opacity: 0,
                    duration: 0.25,
                    ease: "none",
                    onComplete: next,
                });
            }}
            enter={(next) => {
                const el = pageRef.current;
                if (!el) return next();

                gsap.killTweensOf(el);

                // Make sure we start hidden, then fade in
                gsap.set(el, { opacity: 0 });

                // Optional: force top on route enter
                try {
                    window.scrollTo(0, 0);
                } catch {
                    // ignore
                }

                gsap.to(el, {
                    opacity: 1,
                    duration: 0.25,
                    ease: "none",
                    onComplete: next,
                });
            }}
        >
            {/* Only this fades (nav/footer stay outside) */}
            <div id="page-transition-root" ref={pageRef}>
                {children}
            </div>
        </TransitionRouter>
    );
}
