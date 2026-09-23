import React, { useEffect, useMemo, useState } from "react";
import { profileArtFormat, profileArtSrc, profileArtVariantCount } from "../profile-art";

export default function ProfileArtEffect({ effect, preview = false }) {
  const [closing, setClosing] = useState(false);
  const [finished, setFinished] = useState(false);
  const variantCount = profileArtVariantCount(effect);
  const variant = useMemo(
    () => preview || variantCount < 2 ? 0 : Math.floor(Math.random() * variantCount),
    [effect, preview, variantCount],
  );
  const src = profileArtSrc(effect, variant);
  useEffect(() => {
    setClosing(false);
    setFinished(false);
    if (effect !== "codigo-neon" || preview || !src) return undefined;
    const closeTimer = window.setTimeout(() => setClosing(true), 6200);
    const finishTimer = window.setTimeout(() => setFinished(true), 6800);
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [effect, preview, src]);
  if (!src || (effect === "codigo-neon" && finished)) return null;
  return <span
    className={`${preview ? "profile-art-effect profile-art-preview" : "profile-art-effect"}${closing ? " profile-art-closing" : ""}`}
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
