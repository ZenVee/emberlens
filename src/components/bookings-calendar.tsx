import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  bookingDateKey,
  bookingDateKeyFromIso,
  formatBookingTime,
  type BookingStatus,
  type DbBooking,
} from "@/lib/bookings-types";
import { cn } from "@/lib/utils";

type BookingsCalendarProps = {
  bookings: DbBooking[];
  selected?: Date;
  month: Date;
  onSelect: (date: Date | undefined) => void;
  onMonthChange: (date: Date) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalendarDay = {
  date: Date;
  inMonth: boolean;
};

export function BookingsCalendar({
  bookings,
  selected,
  month,
  onSelect,
  onMonthChange,
}: BookingsCalendarProps) {
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, DbBooking[]>();
    for (const booking of bookings) {
      const key = bookingDateKeyFromIso(booking.shoot_at);
      const list = map.get(key) ?? [];
      list.push(booking);
      map.set(key, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => new Date(a.shoot_at).getTime() - new Date(b.shoot_at).getTime());
    }
    return map;
  }, [bookings]);

  const days = useMemo(() => buildMonthGrid(month), [month]);
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function shiftMonth(offset: number) {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-ember/20 bg-gradient-night px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => shiftMonth(-1)}
          className="border-ember/30 bg-card/60 hover:border-ember/50 hover:bg-ember/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-display text-lg text-foreground">{monthLabel}</h3>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => shiftMonth(1)}
          className="border-ember/30 bg-card/60 hover:border-ember/50 hover:bg-ember/10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ember/20 bg-ember/5 shadow-card">
        <div className="grid grid-cols-7 gap-px bg-ember/10">
          {WEEKDAYS.map((label) => (
            <div
              key={label}
              className="bg-card/90 px-2 py-2.5 text-center text-xs font-medium uppercase tracking-[0.14em] text-ember"
            >
              {label}
            </div>
          ))}

          {days.map(({ date, inMonth }) => {
            const key = bookingDateKey(date);
            const dayBookings = bookingsByDate.get(key) ?? [];
            const isSelected = selected ? bookingDateKey(selected) === key : false;
            const isToday = bookingDateKey(new Date()) === key;

            return (
              <div
                key={key + (inMonth ? "" : "-outside")}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(isSelected ? undefined : date)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(isSelected ? undefined : date);
                  }
                }}
                className={cn(
                  "flex min-h-[6.5rem] cursor-pointer flex-col bg-card p-2 text-left transition-all sm:min-h-[7.5rem] sm:p-2.5",
                  "hover:bg-ember/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/40",
                  !inMonth && "bg-background/80 text-muted-foreground/60",
                  isSelected && "bg-ember/10 ring-2 ring-inset ring-ember shadow-glow",
                  isToday && !isSelected && "bg-ember/5",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-md text-sm font-medium",
                    isToday && "bg-gradient-ember text-primary-foreground shadow-glow",
                    isSelected && !isToday && "bg-ember/20 text-ember",
                  )}
                >
                  {date.getDate()}
                </span>

                <div className="mt-1.5 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <Link
                      key={booking.id}
                      to="/admin/bookings/$bookingId"
                      params={{ bookingId: booking.id }}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight transition-opacity hover:opacity-80 sm:text-[11px]",
                        statusChipClass(booking.status),
                      )}
                      title={`${formatBookingTime(booking.shoot_at)} · ${booking.client_name} · ${booking.session_type}`}
                    >
                      {formatBookingTime(booking.shoot_at)} {booking.client_name}
                    </Link>
                  ))}
                  {dayBookings.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{dayBookings.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        <LegendChip className="bg-blush/20 text-blush" label="Pending" />
        <LegendChip className="bg-ember/20 text-ember" label="Confirmed" />
        <LegendChip className="bg-emerald-500/20 text-emerald-400" label="Completed" />
        <LegendChip className="bg-muted text-muted-foreground" label="Declined" />
      </div>
    </div>
  );
}

function buildMonthGrid(month: Date): CalendarDay[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const leading = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const days: CalendarDay[] = [];

  for (let i = leading - 1; i >= 0; i--) {
    days.push({ date: new Date(year, monthIndex, -i), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ date: new Date(year, monthIndex, day), inMonth: true });
  }

  let trailing = 1;
  while (days.length < 42) {
    days.push({ date: new Date(year, monthIndex + 1, trailing++), inMonth: false });
  }

  return days;
}

function statusChipClass(status: BookingStatus) {
  if (status === "Confirmed") return "bg-ember/20 text-ember";
  if (status === "Pending") return "bg-blush/20 text-blush";
  if (status === "Completed") return "bg-emerald-500/20 text-emerald-400";
  return "bg-muted text-muted-foreground";
}

function LegendChip({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", className)}>
        {label}
      </span>
    </span>
  );
}
