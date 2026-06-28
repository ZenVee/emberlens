import { CalendarDays, ChevronDown, Clock } from "lucide-react";
import { useMemo, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  buildDatetimeLocal,
  formatDatetimeLocalLabel,
  parseDatetimeLocalValue,
} from "@/lib/bookings-types";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

type BookingDateTimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
};

function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h} ${period}`;
}

export function BookingDateTimePicker({ id, value, onChange }: BookingDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseDatetimeLocalValue(value), [value]);
  const label = useMemo(() => formatDatetimeLocalLabel(value), [value]);

  const selectedDate = parsed?.date;
  const hours = parsed?.hours ?? 10;
  const minutes = parsed?.minutes ?? 0;

  function emit(date: Date, h: number, m: number) {
    onChange(buildDatetimeLocal(date, h, m));
  }

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    emit(date, hours, minutes);
    setOpen(false);
  }

  function handleHourChange(nextHour: number) {
    const date = selectedDate ?? new Date();
    emit(date, nextHour, minutes);
  }

  function handleMinuteChange(nextMinute: number) {
    const date = selectedDate ?? new Date();
    emit(date, hours, nextMinute);
  }

  return (
    <div className="space-y-3">
      <Label htmlFor={id}>Shoot date & time</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/50",
              selectedDate
                ? "border-ember/60 bg-ember/10 shadow-glow hover:border-ember hover:bg-ember/15"
                : "border-ember/40 bg-gradient-night hover:border-ember/70 hover:bg-ember/5",
            )}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-ember shadow-glow">
              <CalendarDays className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium uppercase tracking-wide text-ember">
                {selectedDate ? "Shoot date" : "Pick a date"}
              </span>
              <span
                className={cn(
                  "mt-0.5 block truncate text-sm font-medium",
                  selectedDate ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {selectedDate
                  ? selectedDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Open calendar to choose shoot day"}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-ember transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto rounded-2xl border-ember/25 bg-card p-0 shadow-card"
          sideOffset={8}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            defaultMonth={selectedDate}
            className="rounded-2xl p-3 [--cell-size:2.25rem]"
            buttonVariant="outline"
            classNames={{
              month_caption: "font-display text-base text-foreground",
              weekday: "text-ember text-[0.7rem] font-medium uppercase tracking-wider",
              button_previous:
                "border-ember/30 bg-ember/5 hover:border-ember/50 hover:bg-ember/15",
              button_next: "border-ember/30 bg-ember/5 hover:border-ember/50 hover:bg-ember/15",
              today: "bg-ember/15 text-ember font-semibold rounded-lg",
              outside: "text-muted-foreground/40",
            }}
          />
        </PopoverContent>
      </Popover>

      <div
        className={cn(
          "rounded-xl border border-border/60 bg-background/60 p-3",
          !selectedDate && "opacity-60",
        )}
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-ember" />
          Time
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Hour"
            disabled={!selectedDate}
            value={hours}
            onChange={(e) => handleHourChange(Number(e.target.value))}
            className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 disabled:cursor-not-allowed"
          >
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {formatHourLabel(hour)}
              </option>
            ))}
          </select>
          <span className="text-lg font-medium text-muted-foreground">:</span>
          <select
            aria-label="Minute"
            disabled={!selectedDate}
            value={minutes - (minutes % 5)}
            onChange={(e) => handleMinuteChange(Number(e.target.value))}
            className="h-10 w-24 rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ember focus:ring-2 focus:ring-ember/20 disabled:cursor-not-allowed"
          >
            {MINUTES.map((minute) => (
              <option key={minute} value={minute}>
                {String(minute).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
        {label && (
          <p className="mt-2.5 text-xs text-muted-foreground">
            Scheduled for <span className="font-medium text-foreground">{label}</span>
          </p>
        )}
      </div>
    </div>
  );
}
