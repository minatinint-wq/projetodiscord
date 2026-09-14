import React, { useEffect, useRef, useState } from "react";
import { Smile } from "lucide-react";

const ModernEmojiPicker = React.lazy(async () => {
  const [pickerModule, portugueseModule] = await Promise.all([
    import("emoji-picker-react"),
    import("emoji-picker-react/dist/data/emojis-pt")
  ]);
  const Picker = pickerModule.default;
  const emojiData = portugueseModule.default;

  return {
    default: (props) => <Picker {...props} emojiData={emojiData} />
  };
});

export default function EmojiPicker({ onSelect }) {
  const [open, setOpen] = useState(false);
  const host = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const outside = (event) => {
      if (!host.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const selectEmoji = (emojiData) => {
    onSelect(emojiData.emoji);
    setOpen(false);
  };

  return (
    <div className="emoji-picker" ref={host}>
      <button
        type="button"
        aria-label="Escolher emoji"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Smile size={20} />
      </button>
      {open && (
        <section className="emoji-popover emoji-popover-modern" role="dialog" aria-label="Emojis">
          <React.Suspense fallback={<div className="emoji-picker-loading">Carregando emojis…</div>}>
            <ModernEmojiPicker
              width="100%"
              height={420}
              theme="dark"
              emojiStyle="apple"
              lazyLoadEmojis
              searchPlaceholder="Buscar emoji"
              searchClearButtonLabel="Limpar busca"
              previewConfig={{ showPreview: false }}
              onEmojiClick={selectEmoji}
            />
          </React.Suspense>
        </section>
      )}
    </div>
  );
}
