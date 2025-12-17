// components/meme-booth/meme-booth-shell.tsx
"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useTransitionState } from "next-transition-router";
import { useNewsletterModal } from "@/components/contact/contact-modal-context";

const CameraPanel = dynamic(() => import("./camera-panel"), { ssr: false });

interface MemeBoothShellProps {
    showNewsletterModalOnView?: boolean;
}

const NEWSLETTER_DELAY_MS = 1500;

export default function MemeBoothShell({
    showNewsletterModalOnView = false,
}: MemeBoothShellProps) {
    const pathname = usePathname();
    const { stage, isReady } = useTransitionState();
    const { open: openNewsletter } = useNewsletterModal();

    const timerRef = useRef<number | null>(null);
    const hasScheduledRef = useRef(false);

    useEffect(() => {
        // Only on meme booth
        if (pathname !== "/meme-booth") {
            hasScheduledRef.current = false;
            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = null;
            return;
        }

        if (!showNewsletterModalOnView) return;

        // Wait until transition has fully finished
        const transitionDone = isReady && stage === "none";
        if (!transitionDone) return;

        // Ensure we only schedule once per entry
        if (hasScheduledRef.current) return;
        hasScheduledRef.current = true;

        timerRef.current = window.setTimeout(() => {
            openNewsletter();
        }, NEWSLETTER_DELAY_MS);

        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            timerRef.current = null;
        };
    }, [pathname, showNewsletterModalOnView, isReady, stage, openNewsletter]);

    return (
        <div>
            <CameraPanel />
        </div>
    );
}
