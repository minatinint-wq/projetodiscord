import React from "react";
import { profileArtFormat, profileArtSrc } from "../profile-art";

export default function ProfileArtEffect({ effect, preview = false }) {
  const src = profileArtSrc(effect);
  if (!src) return null;
  return <span
    className={preview ? "profile-art-effect profile-art-preview" : "profile-art-effect"}
    aria-hidden="true"
    data-format={profileArtFormat(effect)}
  >
    <img
      className="profile-art-media"
      src={src}
      alt=""
      draggable="false"
      decoding="async"
    />
  </span>;
}
