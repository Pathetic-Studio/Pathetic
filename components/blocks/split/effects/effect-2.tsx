//effect-2.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Effect2Props {
    src: string;
    isActive: boolean;
}

export function Effect2({ src, isActive }: Effect2Props) {
    return (
        <motion.div
            className="absolute inset-0 aspect-square"
            style={{
                mixBlendMode: "soft-light",
                transformOrigin: "center center",
            }}
            initial={false}
            animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6 }}
        >
            {/* LAYER 1 */}
            <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 26,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{ transformOrigin: "center center" }}
            >
                <Image
                    src={src}
                    alt="Effect 2 Layer 1"
                    fill
                    className="object-cover scale-[1.04]"
                    style={{ mixBlendMode: "soft-light" }}
                    quality={100}
                />
            </motion.div>

            <motion.div
                className="absolute inset-0 hidden"
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
                    src={src}
                    alt="Effect 2 Layer 1"
                    fill
                    className="object-cover scale-[0.7]"
                    style={{ mixBlendMode: "soft-light" }}
                    quality={100}
                />
            </motion.div>

            {/* LAYER 2 — identical, stacked to amplify effect */}
            <motion.div
                className="absolute inset-0 mix-blend-soft-light"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 26,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{ transformOrigin: "center center" }}
            >
                <Image
                    src={src}
                    alt="Effect 2 Layer 2"
                    fill
                    className="object-cover scale-[1.04]"
                    style={{ mixBlendMode: "soft-light" }}
                    quality={100}
                />
            </motion.div>
            {/* LAYER 3 — identical, stacked to amplify effect */}
            <motion.div
                className="absolute inset-0 mix-blend-soft-light"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 26,
                    repeat: Infinity,
                    ease: "linear",
                }}
                style={{ transformOrigin: "center center" }}
            >
                <Image
                    src={src}
                    alt="Effect 2 Layer 2"
                    fill
                    className="object-cover scale-[0.8]"
                    style={{ mixBlendMode: "soft-light" }}
                    quality={100}
                />
            </motion.div>
        </motion.div>
    );
}
