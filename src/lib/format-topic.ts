const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Converts a booking topic like "Booking 2026-03-08 -> 2026-03-17"
 * or "Booking 2026/03/08 → 2026/03/17"
 * into a human-readable date range like "Mar 8 – 17, 2026".
 * Non-booking topics are returned as-is.
 */
export function formatBookingTopic(topic: string): string {
  if (!topic.startsWith("Booking ")) return topic;

  const match = topic.match(
    /Booking\s+(\d{4})[-/](\d{2})[-/](\d{2})\s*(?:->|→|–)\s*(\d{4})[-/](\d{2})[-/](\d{2})/
  );

  if (!match) return topic;

  const [, y1, m1, d1, y2, m2, d2] = match;
  const startMonth = MONTHS[parseInt(m1, 10) - 1];
  const endMonth = MONTHS[parseInt(m2, 10) - 1];
  const startDay = parseInt(d1, 10);
  const endDay = parseInt(d2, 10);

  if (y1 !== y2) {
    // Cross-year: Dec 28, 2025 – Jan 3, 2026
    return `${startMonth} ${startDay}, ${y1} – ${endMonth} ${endDay}, ${y2}`;
  }

  if (m1 !== m2) {
    // Cross-month: Mar 28 – Apr 4, 2026
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${y1}`;
  }

  // Same month: Mar 8 – 17, 2026
  return `${startMonth} ${startDay} – ${endDay}, ${y1}`;
}
