// components/effects/eye-follow.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type EyeConfig = {
    _key?: string;
    x?: number | null; // percentage across section (desktop)
    y?: number | null; // percentage down section (desktop)
    size?: number | null; // base eye diameter in px (desktop)

    xMobile?: number | null; // percentage across section (mobile)
    yMobile?: number | null; // percentage down section (mobile)
    sizeMobile?: number | null; // base eye diameter in px (mobile)
};

type EyeFollowProps = {
    containerId: string;
    eyes?: EyeConfig[];
    enableClickToAdd?: boolean;
    minSpawnScale?: number;
    maxSpawnScale?: number;
};

type MousePos = { x: number; y: number } | null;
type Rect = { width: number; height: number } | null;

type Offset = { x: number; y: number };

type EyePhysics = {
    pos: Offset;
    vel: Offset;
    radius: number;
};

export default function EyeFollow({
    containerId,
    eyes,
    enableClickToAdd,
    minSpawnScale,
    maxSpawnScale,
}: EyeFollowProps) {
    const [mouse, setMouse] = useState<MousePos>(null);
    const [rect, setRect] = useState<Rect>(null);
    const [pupilOffsets, setPupilOffsets] = useState<Record<string, Offset>>({});
    const [internalEyes, setInternalEyes] = useState<EyeConfig[]>(() => eyes ?? []);
    const [isMobile, setIsMobile] = useState(false);

    const mouseRef = useRef<MousePos>(null);
    const rectRef = useRef<Rect>(null);
    const physicsRef = useRef<Record<string, EyePhysics>>({});

    const baseSpawnSize = 72;
    const rawMin = minSpawnScale ?? 0.6;
    const rawMax = maxSpawnScale ?? 1.2;
    const spawnMin = Math.min(rawMin, rawMax);
    const spawnMax = Math.max(rawMin, rawMax);

    // Sync internal eyes with CMS
    useEffect(() => {
        setInternalEyes(eyes ?? []);
    }, [eyes]);

    // Track mobile vs desktop (TS-safe)
    useEffect(() => {
        if (typeof window === "undefined") return;

        const mq = window.matchMedia("(max-width: 767px)");

        const handleChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches);
        };

        // Initial
        setIsMobile(mq.matches);

        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", handleChange);
            return () => mq.removeEventListener("change", handleChange);
        } else {
            // Safari / older browsers
            mq.addListener(handleChange as any);
            return () => mq.removeListener(handleChange as any);
        }
    }, []);

    // Keep refs in sync for RAF loop
    useEffect(() => {
        mouseRef.current = mouse;
    }, [mouse]);

    useEffect(() => {
        rectRef.current = rect;
    }, [rect]);

    // Pointer tracking and click-to-add
    useEffect(() => {
        if (!internalEyes || internalEyes.length === 0) return;

        const el = document.getElementById(containerId);
        if (!el) return;

        const handleMove = (event: PointerEvent) => {
            const r = el.getBoundingClientRect();
            const localX = event.clientX - r.left;
            const localY = event.clientY - r.top;

            if (localX < 0 || localY < 0 || localX > r.width || localY > r.height) {
                setMouse(null);
                return;
            }

            setMouse({ x: localX, y: localY });
            setRect({ width: r.width, height: r.height });
        };

        const handleLeave = () => {
            setMouse(null);
        };

        const handleDown = (event: PointerEvent) => {
            if (!enableClickToAdd) return;

            const r = el.getBoundingClientRect();
            const localX = event.clientX - r.left;
            const localY = event.clientY - r.top;

            if (localX < 0 || localY < 0 || localX > r.width || localY > r.height) {
                return;
            }

            const xPercent = (localX / r.width) * 100;
            const yPercent = (localY / r.height) * 100;

            const scale =
                spawnMin === spawnMax
                    ? spawnMin
                    : spawnMin + Math.random() * (spawnMax - spawnMin);

            const size = baseSpawnSize * scale;

            const newEye: EyeConfig = {
                _key: `spawn-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                x: xPercent,
                y: yPercent,
                size,
            };

            setInternalEyes((prev) => [...prev, newEye]);
        };

        el.addEventListener("pointermove", handleMove);
        el.addEventListener("pointerleave", handleLeave);
        el.addEventListener("pointerdown", handleDown);

        return () => {
            el.removeEventListener("pointermove", handleMove);
            el.removeEventListener("pointerleave", handleLeave);
            el.removeEventListener("pointerdown", handleDown);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerId, internalEyes.length, enableClickToAdd, spawnMin, spawnMax]);

    // Physics loop
    useEffect(() => {
        if (!internalEyes || internalEyes.length === 0) return;

        const getMetrics = (eye: EyeConfig) => {
            const baseX = typeof eye.x === "number" ? eye.x : 50;
            const baseY = typeof eye.y === "number" ? eye.y : 50;
            const baseSize = eye.size ?? 72;

            const xPercent =
                isMobile && typeof eye.xMobile === "number" ? eye.xMobile : baseX;
            const yPercent =
                isMobile && typeof eye.yMobile === "number" ? eye.yMobile : baseY;
            const size =
                isMobile && typeof eye.sizeMobile === "number"
                    ? eye.sizeMobile
                    : baseSize;

            return { xPercent, yPercent, size };
        };

        const nextPhysics: Record<string, EyePhysics> = { ...physicsRef.current };

        for (const eye of internalEyes) {
            const { xPercent, yPercent, size } = getMetrics(eye);
            const radius = size * 0.2;
            const key =
                eye._key ?? `${xPercent}-${yPercent}-${size}-${isMobile ? "m" : "d"}`;

            if (!nextPhysics[key]) {
                nextPhysics[key] = {
                    pos: { x: 0, y: radius },
                    vel: { x: 0, y: 0 },
                    radius,
                };
            } else {
                nextPhysics[key].radius = radius;
            }
        }

        physicsRef.current = nextPhysics;

        let rafId: number;
        let lastTime = performance.now();

        const step = (time: number) => {
            const dt = Math.min((time - lastTime) / 1000, 0.032);
            lastTime = time;

            const mouseLocal = mouseRef.current;
            const rectLocal = rectRef.current;

            const gravity = 1800;
            const globalDamping = 1;
            const springK = 600;
            const springDamping = 20;

            const newOffsets: Record<string, Offset> = {};

            for (const eye of internalEyes) {
                const { xPercent, yPercent, size } = getMetrics(eye);
                const key =
                    eye._key ?? `${xPercent}-${yPercent}-${size}-${isMobile ? "m" : "d"}`;

                const phys = physicsRef.current[key];
                if (!phys) continue;

                const { pos, vel } = phys;
                const radius = phys.radius;

                const hasMouse = !!mouseLocal && !!rectLocal;

                if (!hasMouse) {
                    vel.y += gravity * dt;
                } else {
                    const centerX = (xPercent / 100) * rectLocal!.width;
                    const centerY = (yPercent / 100) * rectLocal!.height;
                    const dx = mouseLocal!.x - centerX;
                    const dy = mouseLocal!.y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                    const targetMag = Math.min(dist, radius);
                    const target = {
                        x: (dx / dist) * targetMag,
                        y: (dy / dist) * targetMag,
                    };

                    const ax = (target.x - pos.x) * springK - vel.x * springDamping;
                    const ay = (target.y - pos.y) * springK - vel.y * springDamping;

                    vel.x += ax * dt;
                    vel.y += ay * dt;
                }

                // Integrate
                pos.x += vel.x * dt;
                pos.y += vel.y * dt;

                // Constraint + bounce
                const len = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
                if (len > radius) {
                    const nx = pos.x / len;
                    const ny = pos.y / len;

                    pos.x = nx * radius;
                    pos.y = ny * radius;

                    const dot = vel.x * nx + vel.y * ny;
                    vel.x = (vel.x - 1.6 * dot * nx) * globalDamping;
                    vel.y = (vel.y - 1.6 * dot * ny) * globalDamping;
                } else {
                    vel.x *= globalDamping;
                    vel.y *= globalDamping;
                }

                newOffsets[key] = { x: pos.x, y: pos.y };
            }

            setPupilOffsets(newOffsets);
            rafId = requestAnimationFrame(step);
        };

        rafId = requestAnimationFrame((t) => {
            lastTime = t;
            step(t);
        });

        return () => {
            cancelAnimationFrame(rafId);
        };
    }, [internalEyes, isMobile]);

    if (!internalEyes || internalEyes.length === 0) return null;

    return (
        <div
            className="pointer-events-none absolute inset-0 z-10"
            aria-hidden="true"
        >
            {internalEyes.map((eye) => {
                const baseX = typeof eye.x === "number" ? eye.x : 50;
                const baseY = typeof eye.y === "number" ? eye.y : 50;
                const baseSize = eye.size ?? 72;

                const xPercent =
                    isMobile && typeof eye.xMobile === "number" ? eye.xMobile : baseX;
                const yPercent =
                    isMobile && typeof eye.yMobile === "number" ? eye.yMobile : baseY;
                const size =
                    isMobile && typeof eye.sizeMobile === "number"
                        ? eye.sizeMobile
                        : baseSize;

                const pupilMaxOffset = size * 0.2;
                const key =
                    eye._key ?? `${xPercent}-${yPercent}-${size}-${isMobile ? "m" : "d"}`;
                const offset = pupilOffsets[key] ?? {
                    x: 0,
                    y: pupilMaxOffset,
                };

                return (
                    <div
                        key={key}
                        className="absolute"
                        style={{
                            left: `${xPercent}%`,
                            top: `${yPercent}%`,
                            width: size,
                            height: size,
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <div
                            className="relative w-full h-full overflow-hidden"
                            style={{
                                borderRadius: size * 0.5,
                                boxShadow:
                                    "0 8px 18px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.18) inset",
                            }}
                        >
                            <Image
                                src="/eye/base.png"
                                alt="Eye base"
                                fill
                                priority={false}
                                draggable={false}
                                style={{
                                    objectFit: "cover",
                                }}
                            />

                            <div
                                style={{
                                    position: "absolute",
                                    left: "50%",
                                    top: "50%",
                                    width: size * 0.45,
                                    height: size * 0.45,
                                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                                    borderRadius: "9999px",
                                    background: "black",
                                    boxShadow:
                                        "0 0 0 2px rgba(0,0,0,0.7), 0 0 10px rgba(0,0,0,0.5) inset",
                                }}
                            />

                            <Image
                                src="/eye/highlight.png"
                                alt="Eye highlight"
                                fill
                                priority={false}
                                draggable={false}
                                style={{
                                    opacity: "75%",
                                    objectFit: "cover",
                                    pointerEvents: "none",
                                }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
