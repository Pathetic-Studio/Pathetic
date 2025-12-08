// components/blocks/grid/image-card.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";
import { cn } from "@/lib/utils";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type GridRowImage = Extract<Block, { _type: "grid-row-image" }>;
type Item = NonNullable<NonNullable<GridRowImage["items"]>[number]>;
type ImageCardItem = Extract<Item, { _type: "image-card" }>;

interface ImageCardProps extends ImageCardItem {
  showDetailsOnMobile?: boolean;
}

export default function ImageCard({
  title,
  body,
  image,
  link,
  showDetailsOnMobile,
}: ImageCardProps) {
  const imageUrl = image?.asset?._id ? urlFor(image).url() : null;
  const altText = image?.alt ?? "";

  const Header = () => (
    <>
      {imageUrl && (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={altText}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}

      {title && (
        <div className="mx-auto">
          <h3 className="mt-2 text-center text-sm font-semibold uppercase tracking-tight">
            {title}
          </h3>
        </div>
      )}
    </>
  );

  return (
    <div className="group relative">
      {/* Invisible placeholder: defines grid footprint (image + title only) */}
      <div className="invisible">
        <Header />
      </div>

      {/* Actual card overlay */}
      <div
        className={cn(
          "absolute inset-0 z-20",
          showDetailsOnMobile
            ? "pointer-events-auto"
            : "pointer-events-none group-hover:pointer-events-auto"
        )}
      >
        <div className="relative">
          {/* Card background behind image+title */}
          <div
            className={cn(
              "absolute -inset-6 -z-10 border border-border bg-background transition-opacity duration-150",
              showDetailsOnMobile
                ? "opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
          />

          {/* Image + title */}
          <Header />

          {/* Body + link */}
          {(body || (link && link.href)) && (
            <div
              className={cn(
                "mt-3 transition-all duration-150",
                showDetailsOnMobile
                  ? "opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-1 lg:group-hover:opacity-100 lg:group-hover:translate-y-0"
                  : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
              )}
            >
              {body && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <PortableTextRenderer value={body as any} />
                </div>
              )}

              {link && link.href && (
                <div className="mt-3">
                  <Link
                    href={link.href}
                    target={link.target ? "_blank" : undefined}
                    rel={link.target ? "noopener" : undefined}
                    className="inline-flex items-center text-xs font-medium uppercase tracking-tight underline-offset-4 hover:underline"
                  >
                    {link.title || "Learn more"}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
