import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

import { MediaImage } from "./media-image";

type Item = { src: string; title: string };

export function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: Item[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  useEffect(() => {
    if (index === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, items.length, onClose, onIndexChange]);

  if (index === null) return null;
  const item = items[index];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
      <button
        className="absolute left-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          onIndexChange((index - 1 + items.length) % items.length);
        }}
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        className="absolute right-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={(e) => {
          e.stopPropagation();
          onIndexChange((index + 1) % items.length);
        }}
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <figure className="max-h-[90vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <MediaImage
          src={item.src}
          alt={item.title}
          className="max-h-[80vh] w-auto rounded-2xl object-contain shadow-glow"
        />
        <figcaption className="mt-3 text-center font-display text-lg text-white">
          {item.title}
        </figcaption>
      </figure>
    </div>
  );
}
