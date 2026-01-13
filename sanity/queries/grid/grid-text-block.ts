// sanity/queries/blocks/grid-text-block.ts
import { groq } from "next-sanity";
import { imageQuery } from "../shared/image";
import { linkQuery } from "../shared/link";
import { bodyQuery } from "../shared/body";

// @sanity-typegen-ignore
export const gridTextBlockQuery = groq`
  _type == "grid-text-block" => {
    _type,
    _key,

    // content
    titlePortable[]{
      ${bodyQuery}
    },
    bodyPortable[]{
      ${bodyQuery}
    },

    // toggles
    useDecorativeTitle,
    useDecorativeBody,

    // media
    image{
      ${imageQuery}
    },

    // link / button
    link{
      ${linkQuery}
    },
    showButton,

    // EFFECT STYLE
    effectStyle,

    // shape config (used when effectStyle == "shape")
    shape,
    blurShape,
    shapeHasBorder,

    // base colour scheme
    colorScheme,
    colorBgCustom,
    colorTextCustom,

    // hover colour scheme
    hoverColorChange,
    hoverColorScheme,
    hoverColorBgCustom,
    hoverColorTextCustom,

    // hover scale (normal + shape only)
    hoverScaleUp,

    // perspective tilt
    enablePerspective,

    // retro hover behaviour
    retroHoverDepress,
  }
`;
