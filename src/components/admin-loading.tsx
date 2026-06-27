type AdminLoadingProps = {
  variant?: "grid" | "cards" | "table" | "form";
};

export function AdminLoading({ variant = "grid" }: AdminLoadingProps) {
  if (variant === "table") {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-t border-border/60 px-4 py-3 first:border-t-0">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-secondary" />
              <div className="flex flex-1 flex-col gap-2 py-1">
                <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
            <div className="aspect-[4/3] animate-pulse bg-secondary" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-1/4 animate-pulse rounded bg-secondary" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-card">
            <div className="h-6 w-1/4 animate-pulse rounded bg-secondary" />
            {Array.from({ length: 4 }).map((__, j) => (
              <div key={j} className="h-10 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
          <div className="aspect-square animate-pulse bg-secondary" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}
