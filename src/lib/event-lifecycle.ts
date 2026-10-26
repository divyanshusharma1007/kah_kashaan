export type EventPublicationStatus = "published" | "draft";
export type EventLifecycleStatus = EventPublicationStatus | "completed";

function indiaCalendarDate(value: Date): string {
  const parts: Record<string, string> = {};
  for (const { type, value: partValue } of new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value)) {
    parts[type] = partValue;
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getEventLifecycleStatus(
  status: EventPublicationStatus,
  startsAt: string | Date | readonly (string | Date)[],
  now: Date = new Date(),
): EventLifecycleStatus {
  const eventDates: readonly (string | Date)[] =
    typeof startsAt === "string" || startsAt instanceof Date ? [startsAt] : startsAt;
  if (eventDates.length === 0) return status;
  const dates = eventDates.map((value) => value instanceof Date ? value : new Date(value));
  if (dates.some((date) => !Number.isFinite(date.getTime()))) return status;
  if (
    status === "published" &&
    dates.every((date) => indiaCalendarDate(date) < indiaCalendarDate(now))
  ) {
    return "completed";
  }
  return status;
}
