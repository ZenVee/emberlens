import { MediaImage } from "@/components/media-image";
import type { GalleryOrientation } from "@/lib/gallery-orientation";
import { cn } from "@/lib/utils";

export type EditorialMasonryItem = {
  id: string;
  src: string;
  title: string;
  subtitle?: string;
  watermarked?: boolean;
  orientation?: GalleryOrientation;
};

type EditorialMasonryGalleryProps = {
  items: EditorialMasonryItem[];
  onItemClick?: (index: number) => void;
  className?: string;
};

const PORTRAIT_LAYOUTS = [
  { col: "col-span-1", row: "row-span-4" },
  { col: "col-span-1", row: "row-span-3" },
] as const;

const LANDSCAPE_LAYOUTS = [
  { col: "col-span-2", row: "row-span-2" },
  { col: "col-span-2", row: "row-span-3" },
] as const;

function tileLayout(orientation: GalleryOrientation, variantIndex: number) {
  const layouts = orientation === "landscape" ? LANDSCAPE_LAYOUTS : PORTRAIT_LAYOUTS;
  return layouts[variantIndex % layouts.length];
}

function tileObjectPosition(orientation: GalleryOrientation) {
  return orientation === "landscape" ? "object-center" : "object-top";
}

export function EditorialMasonryGallery({
  items,
  onItemClick,
  className,
}: EditorialMasonryGalleryProps) {
  let portraitCount = 0;
  let landscapeCount = 0;

  return (
    <div
      className={cn(
        "grid grid-flow-dense grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4",
        "auto-rows-[minmax(4.5rem,1fr)] sm:auto-rows-[minmax(5rem,1fr)] lg:auto-rows-[minmax(5.5rem,1fr)]",
        className,
      )}
    >
      {items.map((item, index) => {
        const orientation = item.orientation ?? "portrait";
        const variantIndex = orientation === "landscape" ? landscapeCount++ : portraitCount++;
        const layout = tileLayout(orientation, variantIndex);
        const clickable = onItemClick !== undefined;

        return (
          <article
            key={item.id}
            className={cn(
              "group relative h-full min-h-0 w-full overflow-hidden bg-muted/30",
              layout.col,
              layout.row,
            )}
          >
            {clickable ? (
              <button
                type="button"
                onClick={() => onItemClick(index)}
                aria-label={`View ${item.title}`}
                className="absolute inset-0 z-10 cursor-zoom-in"
              />
            ) : null}
            <MediaImage
              src={item.src}
              alt={item.title}
              watermarked={item.watermarked}
              loading="lazy"
              width={900}
              height={1200}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.03]",
                tileObjectPosition(orientation),
              )}
            />
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0",
                "opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                clickable && "group-focus-within:opacity-100",
              )}
            />
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 px-3 pb-3 pt-10",
                "translate-y-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100",
                clickable && "group-focus-within:translate-y-0 group-focus-within:opacity-100",
              )}
            >
              {item.subtitle ? (
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/75">
                  {item.subtitle}
                </p>
              ) : null}
              <p className="mt-0.5 font-display text-sm leading-snug text-white sm:text-base">
                {item.title}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
