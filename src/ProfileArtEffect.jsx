import React, { useMemo } from "react";
import { profileArtFormat, profileArtSrc, profileArtVariantCount } from "../profile-art";

export default function ProfileArtEffect({ effect, preview = false }) {
  const variantCount = profileArtVariantCount(effect);
  const variant = useMemo(
    () => preview || variantCount < 2 ? 0 : Math.floor(Math.random() * variantCount),
    [effect, preview, variantCount],
  );
  const src = profileArtSrc(effect, variant);
  if (!src) return null;
  return <span
    className={preview ? "profile-art-effect profile-art-preview" : "profile-art-effect"}
    aria-hidden="true"
    data-effect={effect}
    data-format={profileArtFormat(effect)}
    data-variant={`${variant + 1}/${variantCount}`}
  >
    <img
      className="profile-art-media"
      src={src}
      alt=""
      draggable="false"
      decoding="async"
      loading={preview ? "lazy" : "eager"}
    />
  </span>;
}
