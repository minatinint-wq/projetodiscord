import React from "react";
import { profileArtFormat, profileArtSrc } from "../profile-art";

export default function ProfileArtEffect({ effect, preview = false }) {
  const src = profileArtSrc(effect);
  if (!src) return null;
  return <img
    className={preview ? "profile-art-effect profile-art-preview" : "profile-art-effect"}
    src={src}
    alt=""
    aria-hidden="true"
    draggable="false"
    decoding="async"
    data-format={profileArtFormat(effect)}
  />;
}
