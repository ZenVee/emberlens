import { Check, Loader2 } from "lucide-react";

import type { AutoSaveStatus } from "@/hooks/use-auto-save";
import { cn } from "@/lib/utils";

export function SaveStatus({
  status,
  error,
  className,
}: {
  status: AutoSaveStatus;
  error?: string | null;
  className?: string;
}) {
  if (status === "pending" || status === "saving") {
    return (
      <span
        className={cn("inline-flex items-center gap-1.5 text-sm text-muted-foreground", className)}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-sm text-emerald-400", className)}>
        <Check className="h-3.5 w-3.5" />
        Saved
      </span>
    );
  }

  if (status === "error" && error) {
    return <span className={cn("text-sm text-destructive", className)}>{error}</span>;
  }

  return null;
}
