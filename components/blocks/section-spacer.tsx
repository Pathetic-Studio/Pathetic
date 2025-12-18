import { PAGE_QUERYResult } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SectionSpacerBlock = Extract<Block, { _type: "section-spacer" }>;

function cssHeight(value: unknown, fallback: string) {
  const v = typeof value === "string" ? value.trim() : "";
  return v || fallback;
}

// If CMS gives "10vh", return "10svh" for stability on mobile.
// For anything else, pass through.
function stabilizeMobileHeight(raw: string) {
  return raw.replace(/(-?\d+(\.\d+)?)vh\b/g, "$1svh");
}

export default function SectionSpacer({
  _key,
  height,
  heightTablet,
  heightMobile,
}: SectionSpacerBlock) {
  const spacerId = `_sectionSpacer-${_key}`;

  const desktopH = cssHeight(height, "4rem");
  const tabletH = cssHeight(heightTablet, desktopH);
  const mobileH = cssHeight(heightMobile, tabletH);

  // ✅ stabilize vh-based values on tablet/mobile
  const tabletStable = stabilizeMobileHeight(tabletH);
  const mobileStable = stabilizeMobileHeight(mobileH);

  return (
    <section
      id={spacerId}
      className="relative w-full"
      style={{ height: desktopH }}
      aria-hidden="true"
    >
      <style>
        {`
          @media (max-width: 768px) {
            #${spacerId} { height: ${tabletStable}; }
          }
          @media (max-width: 640px) {
            #${spacerId} { height: ${mobileStable}; }
          }
        `}
      </style>
    </section>
  );
}
