type Props = {
  src: string;
  alt: string;
  watermarked?: boolean;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
};

export function MediaImage({ src, alt, watermarked, className, width, height, loading }: Props) {
  return (
    <div className={`relative overflow-hidden ${watermarked ? "select-none" : ""}`}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={className}
        draggable={!watermarked}
      />
      {watermarked && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-30deg,transparent,transparent_48px,rgba(255,255,255,0.14)_48px,rgba(255,255,255,0.14)_96px)]"
        />
      )}
      {watermarked && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="rotate-[-24deg] text-2xl font-semibold tracking-[0.35em] text-white/30 sm:text-4xl">
            EMBER LENS
          </span>
        </div>
      )}
    </div>
  );
}
