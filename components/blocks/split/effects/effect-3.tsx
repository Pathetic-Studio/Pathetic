// effect-3.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Effect3Props {
    src: string;
    isActive: boolean;
}

export function Effect3({ src, isActive }: Effect3Props) {
    const effect2Src = "/effect-2.png"; // Effect 2 PNG
    const effect33Src = "effect-3-3.png";
    const overlaySrc = "/effect-3-overlay.png";
    const overlaywhiteSrc = "/effect-3-overlay-white.png";
    const baseSrc = "/split-image-animate-1.png";
    const brainSrc = "/effect-1.png";

    return (
        <motion.div
            className="absolute inset-0" // full height container now
            style={{
                mixBlendMode: "soft-light",
                transformOrigin: "center center",
            }}
            initial={false}
            animate={isActive ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6 }}
        >

            {/* CENTERED SQUARE DIV HOLDING YOUR EXISTING EFFECT STACK */}
            <div
                className="absolute inset-x-0 pointer-events-none mix-blend-overlay flex justify-center "
                style={{
                    top: "13%", // control Y position here
                }}
            >
                <div className="relative w-[70%] max-w-md aspect-square mix-blend-hard-light">

                    {/* EVERYTHING BELOW IS YOUR ORIGINAL LAYERS, UNCHANGED IN LOGIC */}

                    {/* LAYER 1 — main Effect 3 PNG — pulses scale + rotates */}

                    <motion.div
                        className="absolute inset-0 "
                        animate={{
                            rotate: 360,
                            scale: isActive ? [0.7, 1.1, 0.7] : 0.75,
                        }}
                        transition={{
                            rotate: {
                                duration: 15,
                                repeat: Infinity,
                                ease: "linear",
                            },
                            scale: {
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            },
                        }}
                        style={{ transformOrigin: "center center" }}
                    >
                        <Image
                            src={effect2Src}
                            alt="Effect 2 Layer 1"
                            fill
                            className="object-cover scale-[0.7]"
                            style={{ mixBlendMode: "soft-light" }}
                            quality={100}
                        />
                    </motion.div>



                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            rotate: 360,
                            scale: isActive ? [0.7, 1.2, 0.7] : 0.75,
                        }}
                        transition={{
                            rotate: {
                                duration: 10,
                                repeat: Infinity,
                                ease: "linear",
                            },
                            scale: {
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            },
                        }}
                        style={{ transformOrigin: "center center" }}
                    >
                        <Image
                            src={effect2Src}
                            alt="Effect 2 Layer 1"
                            fill
                            className="object-cover scale-[0.7]"
                            style={{ mixBlendMode: "soft-light" }}
                            quality={100}
                        />
                    </motion.div>

                    <motion.div
                        className="absolute inset-0 mix-blend-soft-light hidden"
                        animate={{
                            rotate: 360,
                            scale: isActive ? [0.65, 1, 0.65] : 0.95,

                        }}
                        transition={{
                            rotate: {
                                duration: 7,
                                repeat: Infinity,
                                ease: "linear",
                            },
                            scale: {
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            },
                        }}
                        style={{ transformOrigin: "center center" }}
                    >
                        <Image
                            src={effect2Src}
                            alt="Effect 3 Layer 1"
                            fill
                            className="object-cover"
                            style={{
                                mixBlendMode: "soft-light", filter: "brightness(6)"
                            }}
                            quality={100}
                        />
                    </motion.div>

                    {/* LAYER 2 — uses EFFECT 3-3 PNG, smaller, spinning */}
                    <motion.div
                        className="absolute inset-0"
                        animate={{ rotate: -360 }}
                        transition={{
                            duration: 26,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        style={{ transformOrigin: "center center" }}
                    >
                        <Image
                            src={effect33Src}
                            alt="Effect 3 using Effect 3-3 PNG"
                            fill
                            className="object-cover scale-[0.65]"
                            style={{ mixBlendMode: "soft-light" }}
                            quality={100}
                        />
                    </motion.div>

                    <motion.div
                        className="absolute inset-0"
                        animate={{
                            rotate: 360,
                            scale: isActive ? [0.4, 0.9, 0.4] : 0.4,
                        }}
                        transition={{
                            rotate: {
                                duration: 7,
                                repeat: Infinity,
                                ease: "linear",
                            },
                            scale: {
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut",
                            },
                        }}
                        style={{ transformOrigin: "center center" }}
                    >
                        <Image
                            src={effect33Src}
                            alt="Effect 3 using Effect 3-3 PNG inner"
                            fill
                            className="object-cover scale-[0.5]"
                            style={{ mixBlendMode: "soft-light" }}
                            quality={100}
                        />
                    </motion.div>

                    {/* LAYER 3 — main PNG again, slow rotation */}
                    <motion.div
                        className="absolute inset-0 scale-[1]"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        style={{ transformOrigin: "center center" }}
                    >
                        <Image
                            src={src}
                            alt="Effect 3 Layer 3"
                            fill
                            className="object-cover scale-[1]"
                            style={{
                                mixBlendMode: "soft-light",
                                filter: "brightness(3)",
                            }}
                            quality={100}
                        />
                    </motion.div>

                    {/* EXTRA LAYER — using effect33Src again, pulsing & rotating */}
                    <motion.div
                        className="absolute inset-0 scale-[1] mix-blend-soft-light"
                        animate={{
                            rotate: 360,
                            scale: isActive ? [0.5, 1.5, 0.5] : 0.75,
                        }}
                        transition={{
                            rotate: {
                                duration: 15,
                                repeat: Infinity,
                                ease: "linear",
                            },
                            scale: {
                                duration: 6,
                                repeat: Infinity,
                                ease: "easeInOut",
                            },
                        }}
                        style={{ transformOrigin: "center center" }}
                    >
                        <Image
                            src={effect33Src}
                            alt="Effect 3 Layer extra"
                            fill
                            className="object-cover"
                            style={{
                                mixBlendMode: "soft-light",
                            }}
                            quality={100}
                        />
                    </motion.div>
                </div>
            </div>


            {/* FULL-HEIGHT LAYER – pulses brightness */}
            <motion.div
                className="absolute inset-0 "
                animate={
                    isActive
                        ? {
                            filter: [
                                "brightness(2)",
                                "brightness(15)",
                                "brightness(2)",
                            ],
                        }
                        : { filter: "brightness(0)" }
                }
                transition={{
                    filter: {
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    },
                }}
                style={{ transformOrigin: "center center", }}

            >
                <Image
                    src={overlaywhiteSrc}
                    alt="Effect 3 full-height layer"
                    fill
                    className="object-cover scale-[1]"
                    style={{ mixBlendMode: "overlay", filter: "blur(10px)", }}
                    quality={100}
                />
            </motion.div>
            <motion.div
                className="absolute inset-0 "
                animate={
                    isActive
                        ? {
                            filter: [
                                "brightness(4)",
                                "brightness(15)",
                                "brightness(4)",
                            ],
                        }
                        : { filter: "brightness(6)" }
                }
                transition={{
                    filter: {
                        duration: 1.7,
                        repeat: Infinity,
                        ease: "easeInOut",
                    },
                }}
                style={{ transformOrigin: "center center", }}

            >
                <Image
                    src={brainSrc}
                    alt="Effect 3 full-height layer"
                    fill
                    className="object-cover scale-[1]"
                    style={{ mixBlendMode: "hard-light", filter: "blur(5px)", }}
                    quality={100}
                />
            </motion.div>
            <motion.div
                className="absolute inset-0 hidden"
                animate={
                    isActive
                        ? {
                            filter: [
                                "brightness(5)",
                                "brightness(7)",
                                "brightness(5)",
                            ],
                        }
                        : { filter: "brightness(5)" }
                }
                transition={{
                    filter: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    },
                }}
                style={{ transformOrigin: "center center", }}
            >
                <Image
                    src={overlaySrc}
                    alt="Effect 3 full-height layer"
                    fill
                    className="object-cover"
                    style={{ mixBlendMode: "soft-light", filter: "blur(5px)", }}
                    quality={100}
                />
            </motion.div>


        </motion.div>
    );
}
