"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface Effect1Props {
    src: string;
    isActive: boolean;
}

export function Effect1({ src, isActive }: Effect1Props) {
    return (
        <motion.div
            className="absolute inset-0"
            style={{
                mixBlendMode: "soft-light",
                transformOrigin: "center center",
            }}
            initial={{
                opacity: 0,
                scale: 1,
                filter: "brightness(1)",
            }}
            animate={
                isActive
                    ? {
                        opacity: 1,
                        filter: [
                            "brightness(1)",
                            "brightness(2.5)",
                            "brightness(1)",
                        ],
                    }
                    : {
                        opacity: 0,
                        filter: "brightness(1)",
                    }
            }
            transition={
                isActive
                    ? {
                        opacity: { duration: 0.6, ease: "easeOut" },
                        filter: {
                            duration: 2.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                        },
                    }
                    : {
                        opacity: { duration: 0.4, ease: "easeOut" },
                    }
            }
        >
            <Image
                src={src}
                alt="Effect 1"
                fill
                className="object-cover scale-[1.2]"
                style={{ mixBlendMode: "soft-light", filter: "blur(22px)", }}
                quality={100}
            />
        </motion.div>
    );
}
