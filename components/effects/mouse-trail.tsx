// components/effects/mouse-trail.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type MouseTrailImage = {
    _key?: string;
    url?: string | null;
};

type MouseTrailProps = {
    images?: MouseTrailImage[];
    containerId: string;
};

type TrailPoint = {
    id: number;
    x: number; // viewport X (clientX)
    y: number; // viewport Y (clientY)
    imageIndex: number;
    createdAt: number;
};

const MAX_TRAIL_POINTS = 24;
const MIN_DISTANCE = 8;
const POINT_LIFETIME_MS = 1800;
const CLEANUP_INTERVAL_MS = 60;
const TRAIL_IMAGE_SIZE = 150;

// Tune these until the image appears exactly under your visible cursor
// Negative X = move image left, positive = right
// Negative Y = move image up, positive = down
const HOTSPOT_OFFSET_X = -75;  // start with a small left shift
const HOTSPOT_OFFSET_Y = -8;  // small upward shift

export default function MouseTrail({ images, containerId }: MouseTrailProps) {
    const [trail, setTrail] = useState<TrailPoint[]>([]);
    const lastSpawnPosRef = useRef<{ x: number; y: number } | null>(null);
    const sectionRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!images || images.length === 0) return;

        const sectionEl = document.getElementById(containerId) as HTMLElement | null;
        if (!sectionEl) return;
        sectionRef.current = sectionEl;

        const handleMove = (event: PointerEvent) => {
            const section = sectionRef.current;
            if (!section) return;

            const rect = section.getBoundingClientRect();
            const { clientX, clientY } = event;

            // Only spawn while pointer is inside the section
            if (
                clientX < rect.left ||
                clientX > rect.right ||
                clientY < rect.top ||
                clientY > rect.bottom
            ) {
                return;
            }

            const lastSpawn = lastSpawnPosRef.current;
            if (lastSpawn) {
                const dx = clientX - lastSpawn.x;
                const dy = clientY - lastSpawn.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MIN_DISTANCE) return;
            }

            lastSpawnPosRef.current = { x: clientX, y: clientY };

            setTrail((prev) => {
                const now = Date.now();
                const next: TrailPoint[] = [
                    ...prev,
                    {
                        id: now + Math.random(),
                        x: clientX,
                        y: clientY,
                        imageIndex: Math.floor(Math.random() * images.length),
                        createdAt: now,
                    },
                ];

                if (next.length > MAX_TRAIL_POINTS) {
                    return next.slice(next.length - MAX_TRAIL_POINTS);
                }

                return next;
            });
        };

        window.addEventListener("pointermove", handleMove, { passive: true });

        return () => {
            window.removeEventListener("pointermove", handleMove);
        };
    }, [images, containerId]);

    // Cleanup old points
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setTrail((prev) =>
                prev.filter((point) => now - point.createdAt < POINT_LIFETIME_MS),
            );
        }, CLEANUP_INTERVAL_MS);

        return () => clearInterval(interval);
    }, []);

    if (!images || images.length === 0) return null;

    return (
        // Fixed full-viewport overlay so clientX/clientY map 1:1
        <div
            className="pointer-events-none fixed inset-0 z-[60]"
            aria-hidden="true"
        >
            <AnimatePresence>
                {trail.map((point) => {
                    const img = images[point.imageIndex];
                    if (!img?.url) return null;

                    return (
                        <motion.img
                            key={point.id}
                            src={img.url ?? ""}
                            alt=""
                            style={{
                                position: "absolute",
                                left: point.x + HOTSPOT_OFFSET_X,
                                top: point.y + HOTSPOT_OFFSET_Y,
                                width: TRAIL_IMAGE_SIZE,
                                height: TRAIL_IMAGE_SIZE,
                                objectFit: "contain",
                                // Keep the image centered on the adjusted hotspot
                                transform: "translate(-50%, -50%)",
                                willChange: "transform, opacity",
                            }}
                            initial={{
                                scale: 0.85,
                                opacity: 0.9,
                            }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                            }}
                            exit={{
                                scale: 0.7,
                                opacity: 0,
                                transition: {
                                    duration: 0.25,
                                    ease: "easeInOut",
                                },
                            }}
                            transition={{
                                duration: 0.12,
                                ease: "easeOut",
                            }}
                        />
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
