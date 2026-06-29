import { Check, CircleCheck, Clock, X } from "lucide-react";
import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import type { BookingStatus } from "@/lib/bookings-types";
import { cn } from "@/lib/utils";

export function PaidToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 px-4 py-3">
      <div>
        <p className="text-sm font-medium">Client paid</p>
        <p className="text-xs text-muted-foreground">
          Mark when the client has paid for this booking
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs",
          checked ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground",
        )}
      >
        <Check className="h-3.5 w-3.5" />
        {checked ? "Paid" : "Unpaid"}
      </button>
    </label>
  );
}

export function StatusPicker({
  value,
  onChange,
}: {
  value: BookingStatus;
  onChange: (status: BookingStatus) => void;
}) {
  const options: {
    status: BookingStatus;
    label: string;
    icon: typeof Check;
    active: string;
    idle: string;
  }[] = [
    {
      status: "Pending",
      label: "Pending",
      icon: Clock,
      active: "border-blush/60 bg-blush/20 text-blush shadow-[0_0_20px_oklch(0.82_0.08_20/0.2)]",
      idle: "border-border/60 bg-card/40 text-muted-foreground hover:border-blush/40 hover:bg-blush/10 hover:text-blush",
    },
    {
      status: "Confirmed",
      label: "Confirmed",
      icon: Check,
      active: "border-ember/60 bg-ember/20 text-ember shadow-glow",
      idle: "border-border/60 bg-card/40 text-muted-foreground hover:border-ember/40 hover:bg-ember/10 hover:text-ember",
    },
    {
      status: "Completed",
      label: "Completed",
      icon: CircleCheck,
      active:
        "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_oklch(0.72_0.17_155/0.2)]",
      idle: "border-border/60 bg-card/40 text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400",
    },
    {
      status: "Declined",
      label: "Declined",
      icon: X,
      active: "border-destructive/50 bg-destructive/15 text-destructive",
      idle: "border-border/60 bg-card/40 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:max-w-lg">
      {options.map(({ status, label, icon: Icon, active, idle }) => {
        const selected = value === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-all",
              selected ? active : idle,
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function BookingPanel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Check;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ember/15 text-ember">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-lg">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function BookingField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
