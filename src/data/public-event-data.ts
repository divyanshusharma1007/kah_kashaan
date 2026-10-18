import type { EventItem } from "@/data/home-page-data";
import { listUpcomingPublishedEvents } from "@/services/events";

type FeaturedEvent = {
  title: string;
  schedule: string;
  audience: string;
};

export async function getPublicEventData(
  fallbackEvents: EventItem[],
  fallbackFeaturedEvent: FeaturedEvent,
): Promise<{ upcomingEvents: EventItem[]; featuredEvent: FeaturedEvent }> {
  const events = await listUpcomingPublishedEvents();
  if (events === null) {
    return { upcomingEvents: fallbackEvents, featuredEvent: fallbackFeaturedEvent };
  }

  const upcomingEvents = events.map((event) => {
    const startsAt = new Date(event.startsAt);
    return {
      id: event.id,
      date: new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        timeZone: "Asia/Kolkata",
      }).format(startsAt),
      title: event.title,
      type: event.type,
      venue: event.location,
      startsAt: event.startsAt,
      description: event.description,
      price: event.price,
      capacity: event.capacity,
      organizer: event.organizer,
    };
  });
  const firstEvent = events[0];

  return {
    upcomingEvents,
    featuredEvent: firstEvent
      ? {
          title: firstEvent.title,
          schedule: new Intl.DateTimeFormat("en-IN", {
            dateStyle: "full",
            timeStyle: "short",
            timeZone: "Asia/Kolkata",
          }).format(new Date(firstEvent.startsAt)),
          audience: firstEvent.price === 0
            ? "Free entry"
            : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(firstEvent.price),
        }
      : {
          title: "New events coming soon",
          schedule: "Check back soon",
          audience: "Stay connected",
        },
  };
}
