type Props = {
  src: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  aspect?: "square" | "portrait" | "landscape";
};

export function PhotoCard({ src, title, subtitle, onClick, aspect = "square" }: Props) {
  const aspectCls =
    aspect === "portrait" ? "aspect-[3/4]" : aspect === "landscape" ? "aspect-[4/3]" : "aspect-square";
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-glow ${aspectCls}`}
    >
      <img
        src={src}
        alt={title}
        loading="lazy"
        width={800}
        height={800}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-90" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-left">
        <p className="font-display text-base text-white">{title}</p>
        {subtitle && <p className="text-xs text-white/70">{subtitle}</p>}
      </div>
    </button>
  );
}
