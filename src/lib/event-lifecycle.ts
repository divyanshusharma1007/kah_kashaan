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
  startsAt: string | Date,
  now: Date = new Date(),
): EventLifecycleStatus {
  const eventDate = startsAt instanceof Date ? startsAt : new Date(startsAt);
  if (!Number.isFinite(eventDate.getTime())) return status;
  if (status === "published" && indiaCalendarDate(eventDate) < indiaCalendarDate(now)) {
    return "completed";
  }
  return status;
}
