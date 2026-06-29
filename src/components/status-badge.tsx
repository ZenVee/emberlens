export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-blush/20 text-blush",
    Confirmed: "bg-ember/20 text-ember",
    Declined: "bg-destructive/20 text-destructive",
    Completed: "bg-emerald-500/20 text-emerald-400",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status] ?? "bg-secondary"}`}
    >
      {status}
    </span>
  );
}
