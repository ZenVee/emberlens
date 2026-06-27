type Props = {
  src: string;
  alt: string;
  watermarked?: boolean;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  onClick?: () => void;
};

export function MediaImage({ src, alt, className, width, height, loading, onClick }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      onClick={onClick}
      className={className}
      draggable
    />
  );
}
