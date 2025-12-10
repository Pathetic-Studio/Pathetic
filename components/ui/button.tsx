"use client";

import * as React from "react";
import Link from "next/link";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import ContactFormTrigger from "@/components/contact/contact-form-trigger";

import gsap from "gsap";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";

let physicsRegistered = false;

type ParticleImage = {
  _key?: string;
  url?: string | null;
};

// Minimal shape of your Sanity link object that we care about here
type CMSLink = {
  href?: string | null;
  target?: boolean | null;
  linkType?: "internal" | "external" | "contact" | "anchor-link" | "download" | null;
  title?: string | null;

  // download
  downloadFilename?: string | null;

  // particles
  particlesEnabled?: boolean | null;
  particleImages?: ParticleImage[] | null;

  // background image behind button
  backgroundImageEnabled?: boolean | null;
  backgroundImages?: ParticleImage[] | null;

  // background image hover animation
  backgroundImageAnimateEnabled?: boolean | null;
  backgroundImageHoverEffect?: "squeeze" | "bloat" | "spin" | null;
};

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-8 [&_svg]:shrink-0 ring-ring/10 dark:ring-ring/20 dark:outline-ring/40 outline-ring/50 focus-visible:ring-4 focus-visible:outline-1 aria-invalid:focus-visible:ring-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold uppercase underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-primary bg-background uppercase underline hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        underline: "underline",
        link: "text-primary underline-offset-4 hover:underline",
        menu:
          "font-semibold uppercase text-primary underline-offset-4 hover:underline",
        icon: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Fire a single burst of particles from a given root element
function fireParticles(
  root: HTMLElement,
  images: ParticleImage[] | null | undefined
) {
  if (!images || images.length === 0) return;
  if (typeof window === "undefined") return;

  if (!physicsRegistered) {
    try {
      gsap.registerPlugin(Physics2DPlugin);
      physicsRegistered = true;
    } catch {
      return;
    }
  }

  const container = root.querySelector<HTMLElement>(
    "[data-particle-container='true']"
  );
  if (!container) return;

  const validImages = images.filter((img) => !!img?.url) as { url: string }[];
  if (!validImages.length) return;

  const bursts = Math.min(12, validImages.length * 3);

  for (let i = 0; i < bursts; i++) {
    const img = validImages[Math.floor(Math.random() * validImages.length)];

    const el = document.createElement("div");
    el.className = "absolute pointer-events-none will-change-transform";
    el.style.left = "50%";
    el.style.bottom = "0";
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.transform = "translateX(-50%)";
    el.style.opacity = "0";

    const inner = document.createElement("div");
    inner.style.width = "100%";
    inner.style.height = "100%";
    inner.style.backgroundImage = `url(${img.url})`;
    inner.style.backgroundSize = "contain";
    inner.style.backgroundRepeat = "no-repeat";
    inner.style.backgroundPosition = "center";

    el.appendChild(inner);
    container.appendChild(el);

    gsap.set(el, { opacity: 1, x: 0, y: 0 });

    gsap.to(el, {
      duration: gsap.utils.random(0.6, 1.4),
      physics2D: {
        velocity: gsap.utils.random(140, 230),
        angle: gsap.utils.random(-110, -70), // roughly “up”
        gravity: 500,
      },
      rotation: gsap.utils.random(-180, 180),
      opacity: 0,
      onComplete: () => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      },
    });
  }
}

type BaseButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

// Extra props to let Button handle links directly
type LinkableButtonProps = {
  link?: CMSLink;
  href?: string; // for non-CMS quick links
  target?: "_blank" | "_self";
};

type ButtonProps = BaseButtonProps & LinkableButtonProps;

function Button({
  className,
  variant,
  size,
  asChild = false,
  link,
  href,
  target,
  children,
  ...props
}: ButtonProps) {
  const cmsLink = link;
  const isContactLink = cmsLink?.linkType === "contact";
  const isDownloadLink = cmsLink?.linkType === "download";

  const hasParticles =
    !!cmsLink?.particlesEnabled &&
    !!cmsLink?.particleImages &&
    cmsLink.particleImages.length > 0;

  const hasBackgroundImage =
    !!cmsLink?.backgroundImageEnabled &&
    !!cmsLink?.backgroundImages &&
    cmsLink.backgroundImages.length > 0;

  const backgroundImageUrl =
    hasBackgroundImage &&
      cmsLink?.backgroundImages &&
      cmsLink.backgroundImages[0]?.url
      ? cmsLink.backgroundImages[0].url
      : null;

  const backgroundImageAnimateEnabled =
    hasBackgroundImage && !!cmsLink?.backgroundImageAnimateEnabled;

  const backgroundImageHoverEffect = backgroundImageAnimateEnabled
    ? cmsLink?.backgroundImageHoverEffect
    : null;

  // Prefer CMS link href if present, otherwise raw href prop
  const url = cmsLink?.href ?? href ?? undefined;
  const openInNewTab =
    typeof cmsLink?.target === "boolean" ? cmsLink.target : target === "_blank";

  const content =
    children ?? cmsLink?.title ?? props["aria-label"] ?? "Button";

  const buttonClassName = cn(buttonVariants({ variant, size, className }));

  // Continuous hover logic for particles
  const hoverRef = React.useRef(false);
  const intervalRef = React.useRef<number | null>(null);
  const targetRef = React.useRef<HTMLElement | null>(null);

  // Hover animation for background image
  const bgImageRef = React.useRef<HTMLSpanElement | null>(null);
  const hoverAnimRef = React.useRef<gsap.core.Tween | null>(null);

  const startBackgroundImageHoverAnim = React.useCallback(() => {
    if (!backgroundImageAnimateEnabled || !backgroundImageHoverEffect) return;
    if (!bgImageRef.current) return;
    if (typeof window === "undefined") return;

    // kill any existing tween
    if (hoverAnimRef.current) {
      hoverAnimRef.current.kill();
      hoverAnimRef.current = null;
    }

    const el = bgImageRef.current;

    gsap.set(el, {
      transformOrigin: "50% 50%",
    });

    switch (backgroundImageHoverEffect) {
      case "squeeze":
        // squeeze horizontally (width) and hold
        hoverAnimRef.current = gsap.to(el, {
          scaleX: 0.85,
          scaleY: 1,
          duration: 0.35,
          ease: "sine.out",
        });
        break;
      case "bloat":
        // widen horizontally and hold
        hoverAnimRef.current = gsap.to(el, {
          scaleX: 1.15,
          scaleY: 1,
          duration: 0.35,
          ease: "sine.out",
        });
        break;
      case "spin":
        // continuous spin while hovering
        hoverAnimRef.current = gsap.to(el, {
          rotation: 360,
          duration: 2,
          ease: "linear",
          repeat: -1,
        });
        break;
      default:
        break;
    }
  }, [backgroundImageAnimateEnabled, backgroundImageHoverEffect]);

  const stopBackgroundImageHoverAnim = React.useCallback(() => {
    if (hoverAnimRef.current) {
      hoverAnimRef.current.kill();
      hoverAnimRef.current = null;
    }
    if (bgImageRef.current) {
      // return to normal on hover off
      gsap.to(bgImageRef.current, {
        duration: 0.25,
        scaleX: 1,
        scaleY: 1,
        scale: 1,
        rotation: 0,
        ease: "sine.out",
      });
    }
  }, []);

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    hoverRef.current = true;
    targetRef.current = event.currentTarget as HTMLElement;

    // Particles
    if (hasParticles) {
      const root = targetRef.current;
      if (root) {
        // Immediate burst
        fireParticles(root, cmsLink?.particleImages);

        // Start continuous bursts
        if (intervalRef.current == null) {
          intervalRef.current = window.setInterval(() => {
            if (!hoverRef.current || !targetRef.current) return;
            fireParticles(targetRef.current, cmsLink?.particleImages);
          }, 220); // tweak speed here
        }
      }
    }

    // Background image hover animation
    startBackgroundImageHoverAnim();
  };

  const handleMouseLeave = () => {
    hoverRef.current = false;

    // Stop particle bursts
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop background image hover animation and reset
    stopBackgroundImageHoverAnim();
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stopBackgroundImageHoverAnim();
    };
  }, [stopBackgroundImageHoverAnim]);

  const renderInner = () => (
    <span
      data-button-root="true"
      className="relative inline-flex items-center justify-center gap-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasBackgroundImage && backgroundImageUrl && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
        >
          <span
            ref={bgImageRef}
            className="block will-change-transform"
            style={{
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              width: "100%",
              height: "250px",
            }}
          />
        </span>
      )}

      <span className="relative z-20 flex items-center gap-2">
        {content}
      </span>

      {hasParticles && (
        <span
          data-particle-container="true"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 top-0 z-10 overflow-visible"
        />
      )}
    </span>
  );

  // 1) CONTACT MODAL
  if (isContactLink) {
    return (
      <ContactFormTrigger
        className={buttonClassName}
        label={typeof content === "string" ? content : undefined}
      >
        {renderInner()}
      </ContactFormTrigger>
    );
  }

  // 2) FILE DOWNLOAD → plain <a> with download attribute
  if (url && isDownloadLink) {
    return (
      <a
        href={url}
        className={buttonClassName}
        download={cmsLink?.downloadFilename || ""}
      >
        {renderInner()}
      </a>
    );
  }

  // 3) NORMAL LINK
  if (url) {
    return (
      <Link
        href={url}
        target={openInNewTab ? "_blank" : undefined}
        className={buttonClassName}
      >
        {renderInner()}
      </Link>
    );
  }

  // 4) DEFAULT BUTTON (no link semantics)
  const Comp = asChild ? Slot : "button";

  return (
    <Comp data-slot="button" className={buttonClassName} {...props}>
      {renderInner()}
    </Comp>
  );
}

export { Button, buttonVariants };
