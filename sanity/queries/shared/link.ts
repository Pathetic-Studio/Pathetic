export const linkQuery = `
  _key,
  ...,
  "href": select(
    // Anchor links (on-page)
    linkType == "anchor-link" && defined(anchorId) => "#" + anchorId,

    // File download – use asset URL
    linkType == "download" && defined(downloadFile.asset) => downloadFile.asset->url,

    // Existing logic
    isExternal => href,
    defined(href) && !defined(internalLink) => href,
    @.internalLink->slug.current == "index" => "/",
    @.internalLink->_type == "post" => "/blog/" + @.internalLink->slug.current,
    "/" + @.internalLink->slug.current
  ),
  "anchorId": anchorId,
  "anchorOffsetPercent": anchorOffsetPercent,
  "downloadFilename": coalesce(downloadFilename, downloadFile.asset->originalFilename),

  // NEW: particles
  "particlesEnabled": coalesce(particlesEnabled, false),
  "particleImages": particleImages[]{
    _key,
    "url": asset->url
  },

  // NEW: background image behind button
  "backgroundImageEnabled": coalesce(imageEnabled, false),
  "backgroundImages": imageBehindButton[]{
    _key,
    "url": asset->url
  },

  // NEW: background image hover animation
  "backgroundImageAnimateEnabled": coalesce(imageHoverEnabled, false),
  "backgroundImageHoverEffect": imageHoverEffect
`;
