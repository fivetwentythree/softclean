"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const COLORS = {
  available: "#FFFFFF",
  booked: "#FEF3C7",
  bookingAlt: "#DBEAFE",
  today: "#0A84FF",
  text: "#111827",
  muted: "#D1D5DB",
} as const;

type BookingInput = {
  id: string;
  check_in_at: string;
  check_out_at: string;
  guest_count?: number;
};

type DayCell = {
  date: Date;
  dateStr: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
};

type BookingWindow = {
  id: string;
  startId: number;
  endId: number;
  guestCount?: number;
  color: string;
};

const toDateStr = (y: number, m: number, d: number) => {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

const toLocalDate = (input: string) => {
  // Date-only strings should be treated as local dates.
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // Timestamps should respect timezone when converting to local date.
  const dt = new Date(input);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

const dayIdFromDate = (date: Date) => {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
};

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const startOfWeek = (date: Date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start;
};

const endOfWeek = (date: Date) => {
  const end = new Date(date);
  end.setDate(end.getDate() + (6 - end.getDay()));
  return end;
};

const buildMonthDays = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = startOfWeek(first);
  const end = endOfWeek(last);

  const days: DayCell[] = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    days.push({
      date: new Date(cursor),
      dateStr: toDateStr(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()),
      dayOfMonth: cursor.getDate(),
      isCurrentMonth: cursor.getMonth() === month,
    });
    cursor = addDays(cursor, 1);
  }
  return days;
};

export function DatePicker({
  value,
  bookings = [],
}: {
  value: string | null;
  bookings?: BookingInput[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const today = new Date();
  const todayId = dayIdFromDate(today);

  const initial = value ? new Date(value + "T00:00:00") : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());
  const [open, setOpen] = useState(!!value);

  const bookingWindows = useMemo<BookingWindow[]>(() => {
    const palette = [COLORS.booked, COLORS.bookingAlt];
    const sorted = [...bookings].sort((a, b) => {
      const aStart = dayIdFromDate(toLocalDate(a.check_in_at));
      const bStart = dayIdFromDate(toLocalDate(b.check_in_at));
      if (aStart !== bStart) return aStart - bStart;
      return a.id.localeCompare(b.id);
    });

    return sorted.map((booking, index) => {
      const start = toLocalDate(booking.check_in_at);
      const end = toLocalDate(booking.check_out_at);
      return {
        id: booking.id,
        startId: dayIdFromDate(start),
        endId: dayIdFromDate(end),
        guestCount: booking.guest_count ?? undefined,
        color: palette[index % palette.length],
      };
    });
  }, [bookings]);

  const days = useMemo(() => buildMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const weeks = useMemo(() => {
    const out: DayCell[][] = [];
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
    return out;
  }, [days]);

  const monthLabel = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    return first.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [viewYear, viewMonth]);

  function navigate(dir: -1 | 1) {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  }

  function selectDate(dateStr: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (dateStr === value) {
      params.delete("date");
      router.push(`${pathname}?${params.toString()}`);
    } else {
      params.set("date", dateStr);
      router.push(`${pathname}?${params.toString()}`);
    }
  }

  function handleClear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    router.push(`${pathname}?${params.toString()}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mx-6 mb-2 flex items-center gap-3 px-5 py-3.5 w-[calc(100%-3rem)] text-left rounded-[22px] border border-gray-100 bg-white shadow-sm"
      >
        <span className="text-sm font-medium text-gray-900">
          {value
            ? new Date(value + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "short",
                month: "long",
                day: "numeric",
              })
            : "Pick a date"}
        </span>
        <span className="ml-auto text-[#0A84FF] text-sm">›</span>
      </button>
    );
  }

  return (
    <div className="mx-6 mb-2 bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setOpen(false)}
          className="text-xl font-bold text-gray-900 flex items-center gap-2"
          aria-label="Collapse calendar"
        >
          {monthLabel} <span className="text-blue-600 text-lg">›</span>
        </button>
        <div className="flex items-center gap-4">
          {value && (
            <button
              onClick={handleClear}
              className="text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
            >
              Clear
            </button>
          )}
          <div className="flex gap-2 text-blue-600">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-1 hover:bg-blue-50 rounded-full transition-colors"
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-[11px] font-semibold tracking-wider text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-2">
        {weeks.flat().map((day, index) => {
          const dayId = dayIdFromDate(day.date);
          const isToday = dayId === todayId;
          const isSelected = day.dateStr === value;

          const startBooking = bookingWindows.find((b) => b.startId === dayId);
          const endBooking = bookingWindows.find((b) => b.endId === dayId);
          const isTurnover =
            !!startBooking && !!endBooking && startBooking.id !== endBooking.id;
          const dayBooking = bookingWindows.find(
            (b) => dayId >= b.startId && dayId <= b.endId
          );

          let background = day.isCurrentMonth ? COLORS.available : "#F5F6FA";
          if (isTurnover) {
            background = `linear-gradient(to right, ${endBooking!.color} 50%, ${startBooking!.color} 50%)`;
          } else if (dayBooking) {
            background = dayBooking.color;
          }

          const dayBookings = bookingWindows.filter((b) => dayId >= b.startId && dayId <= b.endId);
          const tooltip =
            dayBookings.length > 0
              ? `Bookings: ${dayBookings
                  .map((b) => (b.guestCount ? `${b.guestCount} guests` : "Booking"))
                  .join(", ")}`
              : "";

          return (
            <div
              key={`${day.dateStr}-${index}`}
              className="relative flex items-center justify-center h-12 w-full border border-gray-100 rounded-[14px]"
              style={{
                background,
                borderColor: isTurnover ? "#F59E0B" : "rgba(17, 24, 39, 0.08)",
                boxShadow: isTurnover
                  ? "0 0 0 2px #F59E0B inset"
                  : "none",
              }}
            >
              <button
                onClick={() => selectDate(day.dateStr)}
                className={`w-10 h-10 flex items-center justify-center text-sm transition-all duration-200 rounded-full ${
                  isSelected ? "ring-2 ring-blue-500" : ""
                }`}
                style={{
                  color: isToday ? COLORS.today : day.isCurrentMonth ? COLORS.text : COLORS.muted,
                  fontWeight: isToday ? 700 : 500,
                  textDecoration: "none",
                  opacity: day.isCurrentMonth ? 1 : 0.45,
                }}
                title={tooltip}
              >
                {day.dayOfMonth}
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}
