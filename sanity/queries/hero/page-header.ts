// sanity/queries/hero/page-header.ts
import { groq } from "next-sanity";
import { linkQuery } from "../shared/link";
import { bodyQuery } from "../shared/body";
import { anchorQuery } from "../shared/anchor";

// @sanity-typegen-ignore
export const pageHeaderQuery = groq`
  _type == "page-header" => {
    _type,
    _key,
    ${anchorQuery},
    tagLine,
    title,
    sectionHeightMobile,
    sectionHeightDesktop,
    customHeightMobile,
    customHeightDesktop,
    body[]{
      ${bodyQuery}
    },
    links[]{
      ${linkQuery}
    },
    background{
      enabled,
      layout,
      border,
      style,
      color,
      fromColor,
      toColor,
      angle,
      image,
      customHeight,
      verticalOffsetPercent
    },
    feature{
      type,
      images[]{
        _key,
        "url": asset->url
      },
      eyes[]{
        _key,
        x,
        y,
        size,
        xMobile,
        yMobile,
        sizeMobile
      },
      enableClickToAddEyes
    },
    loaderImages[]{
      _key,
      "url": asset->url
    },
  }
`;
