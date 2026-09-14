import React from "react";
import { Emoji, EmojiStyle } from "emoji-picker-react";
import { emojiToUnified } from "./emojiUtils";

export default function EmojiArtwork({ emoji, size = 20 }) {
  return (
    <span className="emoji-artwork" aria-hidden="true">
      <Emoji
        unified={emojiToUnified(emoji)}
        emojiStyle={EmojiStyle.APPLE}
        size={size}
        lazyLoad
      />
    </span>
  );
}
